import Bug from '../models/Bug.js';
import ActivityLog from '../models/ActivityLog.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

const getBugsByProject = async (req, res) => {
    try {
        const bugs = await Bug.find({ project_id: req.params.projectId })
            .populate('reported_by', 'username')
            .populate('assigned_to', 'username');
        res.json(bugs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getBugById = async (req, res) => {
    try {
        const bug = await Bug.findById(req.params.id)
            .populate('project_id', 'name')
            .populate('reported_by', 'username')
            .populate('assigned_to', 'username');

        if (bug) {
            res.json(bug);
        } else {
            res.status(404).json({ message: 'Bug not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createBug = async (req, res) => {
    const { title, description, priority, projectId, assignedTo, dueDate } = req.body;

    if (!title || !projectId) {
        return res.status(400).json({ message: 'Please add title and project ID' });
    }

    try {
        const bug = await Bug.create({
            title,
            description,
            priority,
            project_id: projectId,
            reported_by: req.user._id,
            assigned_to: assignedTo,
            due_date: dueDate,
        });

        await ActivityLog.create({
            user_id: req.user._id,
            bug_id: bug._id,
            action: 'created bug',
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
        }));
        
        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
            const io = req.app.get('io');
            notifications.forEach(n => {
                io.to(n.user_id.toString()).emit('new_notification', n.message);
            });
        }

        res.status(201).json(bug);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateBug = async (req, res) => {
    try {
        const bug = await Bug.findById(req.params.id);

        if (bug) {
            const isAssigning = req.body.assignedTo && req.body.assignedTo !== bug.assigned_to?.toString();
            if (isAssigning && req.user.role !== 'Admin' && req.user.role !== 'TL') {
                return res.status(403).json({ message: 'Only Admin or TL can assign bugs' });
            }

            const oldStatus = bug.status;

            const isTryingToEditCore = req.body.title || req.body.description || req.body.priority;
            
            if (isTryingToEditCore) {
                if (req.user.role !== 'Admin' && req.user.role !== 'TL' && req.user._id.toString() !== bug.reported_by.toString()) {
                     return res.status(403).json({ message: 'Developers cannot change the title, description, or priority.' });
                }
                
                bug.title = req.body.title || bug.title;
                bug.description = req.body.description || bug.description;
                bug.priority = req.body.priority || bug.priority;
            }

            if (req.body.status && req.body.status !== oldStatus) {
                if (req.user.role === 'Dev' && (req.body.status === 'Closed' || req.body.status === 'Open')) {
                    return res.status(403).json({ message: 'Developers can only set status to In Progress or Resolved.' });
                }
                
                if (req.user.role === 'Tester' && (req.body.status === 'In Progress' || req.body.status === 'Resolved')) {
                    return res.status(403).json({ message: 'Testers can only Reopen or Close bugs.' });
                }
                
                bug.status = req.body.status;
            }

            bug.assigned_to = req.body.assignedTo || bug.assigned_to;
            bug.due_date = req.body.dueDate || bug.due_date;

            const updatedBug = await bug.save();

            await ActivityLog.create({
                user_id: req.user._id,
                bug_id: bug._id,
                action: 'updated bug',
            });

            const io = req.app.get('io');

            if (isAssigning) {
                const message = `You have been assigned to bug: ${updatedBug.title}`;
                await Notification.create({
                    user_id: updatedBug.assigned_to,
                    message: message,
                });
                io.to(updatedBug.assigned_to.toString()).emit('new_notification', message);
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
                }));
                if (notifications.length > 0) {
                    await Notification.insertMany(notifications);
                    notifications.forEach(n => {
                        io.to(n.user_id.toString()).emit('new_notification', n.message);
                    });
                }
            }

            res.json(updatedBug);
        } else {
            res.status(404).json({ message: 'Bug not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteBug = async (req, res) => {
    try {
        const bug = await Bug.findById(req.params.id);

        if (bug) {
            await bug.deleteOne();
            res.json({ message: 'Bug removed' });
        } else {
            res.status(404).json({ message: 'Bug not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export {
    getBugsByProject,
    getBugById,
    createBug,
    updateBug,
    deleteBug,
};
