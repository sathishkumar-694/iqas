import Bug from './bug.model.js';
import ActivityLog from '../../shared/models/activityLog.model.js';
import Project from '../projects/project.model.js';
import User from '../users/user.model.js';
import Notification from '../notifications/notification.model.js';
import { sendBugAssignmentEmail, sendStatusUpdateEmail } from '../../shared/utils/emailService.js';
import { analyzeBug } from '../../shared/utils/aiService.js';
import asyncHandler from 'express-async-handler';

// GET /api/bugs/project/:projectId?search=&status=&priority=&label=&page=&limit=
const getBugsByProject = asyncHandler(async (req, res) => {
    const { search, status, priority, label, page = 1, limit = 20 } = req.query;
    const query = { project_id: req.params.projectId };

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (label) query.labels = { $in: label.split(',') };
    if (search) {
        query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
        ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Bug.countDocuments(query);
    const bugs = await Bug.find(query)
        .populate('reported_by', 'username')
        .populate('assigned_to', 'username')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    res.json({
        data: bugs,
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit)),
        },
    });
});

const getBugById = asyncHandler(async (req, res) => {
    const bug = await Bug.findById(req.params.id)
        .populate('project_id', 'name')
        .populate('reported_by', 'username')
        .populate('assigned_to', 'username');

    if (bug) {
        res.json(bug);
    } else {
        res.status(404);
        throw new Error('Bug not found');
    }
});

const createBug = asyncHandler(async (req, res) => {
    const { title, description, priority, projectId, assignedTo, dueDate, labels } = req.body;

    if (!title || !projectId) {
        res.status(400);
        throw new Error('Please add title and project ID');
    }

    // AI Analysis
    const aiAnalysis = await analyzeBug(title, description);
    const finalPriority = priority || aiAnalysis.suggestedPriority || 'Medium';
    const complexity = aiAnalysis.complexity || 2;

    let finalAssignedTo = assignedTo;

    // Smart Auto-Assignment if no assignee provided
    if (!finalAssignedTo) {
        const potentialAssignees = await User.find({ 
            role: 'Dev', 
            rank: { $gte: complexity - 1 } 
        });

        if (potentialAssignees.length > 0) {
            // Find user with minimum active bugs
            const activeBugsCount = await Bug.aggregate([
                { $match: { status: { $in: ['Open', 'In Progress'] } } },
                { $group: { _id: '$assigned_to', count: { $sum: 1 } } }
            ]);

            const countsMap = activeBugsCount.reduce((acc, curr) => {
                if (curr._id) acc[curr._id.toString()] = curr.count;
                return acc;
            }, {});

            potentialAssignees.sort((a, b) => (countsMap[a._id.toString()] || 0) - (countsMap[b._id.toString()] || 0));
            finalAssignedTo = potentialAssignees[0]._id;
        }
    }

    const bug = await Bug.create({
        title,
        description,
        priority: finalPriority,
        complexity,
        project_id: projectId,
        reported_by: req.user._id,
        assigned_to: finalAssignedTo,
        due_date: dueDate,
        labels: labels || [],
    });

    // Award points for reporting
    await User.findByIdAndUpdate(req.user._id, { $inc: { points: 10, bugs_reported_count: 1 } });

    await ActivityLog.create({
        user_id: req.user._id,
        bug_id: bug._id,
        action: 'Created bug',
    });

    const admins = await User.find({ role: 'Admin' });
    const project = await Project.findById(projectId);
    
    const notifyUsers = new Set(admins.map(a => a._id.toString()));
    if (project && project.project_head) {
        notifyUsers.add(project.project_head.toString());
    }

    const notifications = Array.from(notifyUsers).map(userId => ({
        user_id: userId,
        message: `New bug created: ${title} in project ${project?.name || projectId}`,
        link: `/bug/${bug._id}`
    }));
    
    if (notifications.length > 0) {
        await Notification.insertMany(notifications);
        const io = req.app.get('io');
        notifications.forEach(n => {
            io.to(n.user_id.toString()).emit('new_notification', n.message);
        });
    }

    if (assignedTo) {
        const assignedUser = await User.findById(assignedTo);
        if (assignedUser) {
            const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
            sendBugAssignmentEmail(assignedUser, title, `${clientUrl}/bug/${bug._id}`);
        }
    }

    res.status(201).json(bug);
});

const updateBug = asyncHandler(async (req, res) => {
    const bug = await Bug.findById(req.params.id);

    if (bug) {
        const isAssigning = req.body.assignedTo && req.body.assignedTo !== bug.assigned_to?.toString();
        if (isAssigning && req.user.role !== 'Admin' && req.user.role !== 'TL') {
            res.status(403);
            throw new Error('Only Admin or TL can assign bugs');
        }

        const oldStatus = bug.status;

        const isTryingToEditCore = 
            (req.body.title && req.body.title !== bug.title) || 
            (req.body.description !== undefined && req.body.description !== bug.description) || 
            (req.body.priority && req.body.priority !== bug.priority);
        
        if (isTryingToEditCore) {
            if (req.user.role !== 'Admin' && req.user.role !== 'TL' && req.user._id.toString() !== bug.reported_by.toString()) {
                res.status(403);
                throw new Error('Developers cannot change the title, description, priority, or environment specs.');
            }
            
            if (req.body.title) bug.title = req.body.title;
            if (req.body.description !== undefined) bug.description = req.body.description;
            if (req.body.priority) bug.priority = req.body.priority;
        }

        if (req.body.labels) {
            bug.labels = req.body.labels;
        }

        if (req.body.status && req.body.status !== oldStatus) {
            if (req.user.role === 'Dev' && (req.body.status === 'Closed' || req.body.status === 'Open')) {
                res.status(403);
                throw new Error('Developers can only set status to In Progress or Resolved.');
            }
            
            if (req.user.role === 'Tester' && (req.body.status === 'In Progress' || req.body.status === 'Resolved')) {
                res.status(403);
                throw new Error('Testers can only Reopen or Close bugs.');
            }
            
            // Automatically push due date 7 days into the future if reopening an old bug
            if ((oldStatus === 'Closed' || oldStatus === 'Resolved') && 
                (req.body.status === 'Open' || req.body.status === 'In Progress') && 
                !req.body.dueDate) {
                const futureDate = new Date();
                futureDate.setDate(futureDate.getDate() + 7);
                bug.due_date = futureDate;
            }

            bug.status = req.body.status;

            // QUALITY LOGIC: Points Award or Penalty
            if (req.body.status === 'Resolved' || req.body.status === 'Closed') {
                if (bug.assigned_to) {
                    const priorityWeight = { 'Critical': 5, 'High': 3, 'Medium': 2, 'Low': 1 }[bug.priority] || 2;
                    const basePoints = (bug.complexity || 2) * priorityWeight * 5;
                    
                    // Bonus for speed (within 24h)
                    const isFast = (new Date() - new Date(bug.created_at)) < (24 * 60 * 60 * 1000);
                    const finalPoints = isFast ? Math.round(basePoints * 1.25) : basePoints;

                    await User.findByIdAndUpdate(bug.assigned_to, { 
                        $inc: { points: finalPoints, bugs_resolved_count: 1 } 
                    });
                }
            }

            // Penalty for Reopening
            if ((oldStatus === 'Resolved' || oldStatus === 'Closed') && (req.body.status === 'Open' || req.body.status === 'In Progress')) {
                if (bug.assigned_to) {
                    await User.findByIdAndUpdate(bug.assigned_to, { 
                        $inc: { points: -20, bugs_reopened_count: 1 } 
                    });
                }
            }
        }

        bug.assigned_to = req.body.assignedTo || bug.assigned_to;
        bug.due_date = req.body.dueDate || bug.due_date;

        const updatedBug = await bug.save();

        const actionDetails = [];
        if (req.body.status && req.body.status !== oldStatus) actionDetails.push(`Status → ${req.body.status}`);
        if (isAssigning) actionDetails.push(`Assigned to user`);
        if (isTryingToEditCore) actionDetails.push(`Edited bug details`);
        if (req.body.labels) actionDetails.push(`Updated labels`);

        await ActivityLog.create({
            user_id: req.user._id,
            bug_id: bug._id,
            action: actionDetails.length > 0 ? actionDetails.join(', ') : 'Updated bug',
        });

        const io = req.app.get('io');

        if (isAssigning) {
            const message = `You have been assigned to bug: ${updatedBug.title}`;
            await Notification.create({
                user_id: updatedBug.assigned_to,
                message: message,
                link: `/bug/${updatedBug._id}`
            });
            io.to(updatedBug.assigned_to.toString()).emit('new_notification', message);

            const assignedUser = await User.findById(updatedBug.assigned_to);
            if (assignedUser) {
                const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
                sendBugAssignmentEmail(assignedUser, updatedBug.title, `${clientUrl}/bug/${updatedBug._id}`);
            }
        }

        if (req.body.status && req.body.status !== oldStatus) {
            const project = await Project.findById(updatedBug.project_id);
            const notifyUsers = new Set();
            notifyUsers.add(updatedBug.reported_by.toString());
            if (project && project.project_head) {
                notifyUsers.add(project.project_head.toString());
            }
            
            notifyUsers.delete(req.user._id.toString());

            const notifications = Array.from(notifyUsers).map(userId => ({
                user_id: userId,
                message: `Bug status updated to ${updatedBug.status}: ${updatedBug.title}`,
                link: `/bug/${updatedBug._id}`
            }));
            if (notifications.length > 0) {
                await Notification.insertMany(notifications);
                notifications.forEach(n => {
                    io.to(n.user_id.toString()).emit('new_notification', n.message);
                });

                const usersToEmail = await User.find({ _id: { $in: Array.from(notifyUsers) } });
                const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
                usersToEmail.forEach(u => {
                    sendStatusUpdateEmail(u, updatedBug.title, updatedBug.status, `${clientUrl}/bug/${updatedBug._id}`);
                });
            }
        }

        res.json(updatedBug);
    } else {
        res.status(404);
        throw new Error('Bug not found');
    }
});

const deleteBug = asyncHandler(async (req, res) => {
    const bug = await Bug.findById(req.params.id);

    if (bug) {
        await bug.deleteOne();
        res.json({ message: 'Bug removed' });
    } else {
        res.status(404);
        throw new Error('Bug not found');
    }
});

// GET /api/bugs/:id/activity — activity timeline
const getBugActivity = asyncHandler(async (req, res) => {
    const logs = await ActivityLog.find({ bug_id: req.params.id })
        .populate('user_id', 'username')
        .sort({ timestamp: -1 });
    res.json(logs);
});

// PUT /api/bugs/bulk — bulk status update / assign
const bulkUpdateBugs = asyncHandler(async (req, res) => {
    const { bugIds, status, assignedTo, labels } = req.body;

    if (!bugIds || !Array.isArray(bugIds) || bugIds.length === 0) {
        res.status(400);
        throw new Error('bugIds array is required');
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (assignedTo) updateData.assigned_to = assignedTo;
    if (labels) updateData.labels = labels;

    const result = await Bug.updateMany(
        { _id: { $in: bugIds } },
        { $set: updateData }
    );

    const actionParts = [];
    if (status) actionParts.push(`Bulk status → ${status}`);
    if (assignedTo) actionParts.push(`Bulk assigned`);
    if (labels) actionParts.push(`Bulk labels updated`);

    const logEntries = bugIds.map(bugId => ({
        user_id: req.user._id,
        bug_id: bugId,
        action: actionParts.join(', ') || 'Bulk updated',
    }));
    await ActivityLog.insertMany(logEntries);

    res.json({ message: `${result.modifiedCount} bugs updated`, modifiedCount: result.modifiedCount });
});

export {
    getBugsByProject,
    getBugById,
    createBug,
    updateBug,
    deleteBug,
    getBugActivity,
    bulkUpdateBugs,
};
