import Bug from '../bugs/bug.model.js';
import Project from '../projects/project.model.js';
import User from '../users/user.model.js';
import asyncHandler from 'express-async-handler';

// GET /api/reports/dashboard OR /api/reports/project/:projectId
const getDashboardStats = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const query = projectId ? { project_id: projectId } : {};

    const totalProjects = projectId ? 1 : await Project.countDocuments();
    const totalBugs = await Bug.countDocuments(query);
    const totalUsers = projectId ? (await Project.findById(projectId)).team_members.length : await User.countDocuments();

    const bugsByStatus = await Bug.aggregate([
        { $match: query },
        { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const bugsByPriority = await Bug.aggregate([
        { $match: query },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    const bugsOverTime = await Bug.aggregate([
        { $match: query },
        {
            $group: {
                _id: {
                    year: { $year: '$created_at' },
                    month: { $month: '$created_at' },
                },
                count: { $sum: 1 },
            },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 },
    ]);

    const bugsByProject = await Bug.aggregate([
        { $group: { _id: '$project_id', count: { $sum: 1 } } },
        {
            $lookup: {
                from: 'projects',
                localField: '_id',
                foreignField: '_id',
                as: 'project',
            },
        },
        { $unwind: '$project' },
        { $project: { projectName: '$project.name', count: 1 } },
        { $sort: { count: -1 } },
        { $limit: 10 },
    ]);

    const topAssignees = await Bug.aggregate([
        { $match: { ...query, assigned_to: { $ne: null } } },
        { $group: { _id: '$assigned_to', count: { $sum: 1 } } },
        {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'user',
            },
        },
        { $unwind: '$user' },
        { $project: { username: '$user.username', points: '$user.points', count: 1 } },
        { $sort: { count: -1 } },
        { $limit: 10 },
    ]);

    const overdueBugs = await Bug.countDocuments({
        ...query,
        due_date: { $lt: new Date() },
        status: { $nin: ['Closed', 'Resolved'] },
    });

    const qualityMetrics = await Bug.aggregate([
        { $match: query },
        {
            $group: {
                _id: null,
                avgComplexity: { $avg: '$complexity' },
                reopenedCount: {
                    $sum: { $cond: [{ $in: ['$status', ['Open', 'In Progress']] }, 1, 0] } // simplified reopening check
                }
            }
        }
    ]);

    const avgResolutionTime = await Bug.aggregate([
        { $match: { ...query, status: 'Closed' } },
        {
            $project: {
                resolutionTime: {
                    $subtract: ['$updated_at', '$created_at'],
                },
            },
        },
        { $group: { _id: null, avg: { $avg: '$resolutionTime' } } },
    ]);

    res.json({
        totalProjects,
        totalBugs,
        totalUsers,
        overdueBugs,
        avgResolutionHours: avgResolutionTime[0] ? Math.round(avgResolutionTime[0].avg / (1000 * 60 * 60)) : 0,
        bugsByStatus: bugsByStatus.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
        bugsByPriority: bugsByPriority.reduce((acc, p) => ({ ...acc, [p._id]: p.count }), {}),
        bugsOverTime: bugsOverTime.map(t => ({
            month: `${t._id.year}-${String(t._id.month).padStart(2, '0')}`,
            count: t.count,
        })),
        bugsByProject,
        topAssignees,
    });
});

// GET /api/reports/export?format=csv
const exportReport = asyncHandler(async (req, res) => {
    const bugs = await Bug.find()
        .populate('project_id', 'name')
        .populate('reported_by', 'username')
        .populate('assigned_to', 'username')
        .lean();

    const csvData = bugs.map(b => ({
        Title: b.title,
        Description: b.description || '',
        Status: b.status,
        Priority: b.priority,
        Project: b.project_id?.name || '',
        Reporter: b.reported_by?.username || '',
        Assignee: b.assigned_to?.username || '',
        Labels: (b.labels || []).join('; '),
        OS: b.os || '',
        Browser: b.browser || '',
        Device: b.device || '',
        DueDate: b.due_date ? new Date(b.due_date).toISOString().split('T')[0] : '',
        CreatedAt: b.created_at ? new Date(b.created_at).toISOString().split('T')[0] : '',
    }));

    if (csvData.length === 0) {
        return res.status(200).send('No bugs to export');
    }

    const headers = Object.keys(csvData[0]);
    const csvRows = [
        headers.join(','),
        ...csvData.map(row =>
            headers.map(h => {
                const val = String(row[h] || '').replace(/"/g, '""');
                return `"${val}"`;
            }).join(',')
        ),
    ];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=bugs_report.csv');
    res.send(csvRows.join('\n'));
});

export { getDashboardStats, exportReport };
