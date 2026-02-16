import Bug from '../models/Bug.js';
import ActivityLog from '../models/ActivityLog.js';

// @desc    Get bugs for a project
// @route   GET /api/projects/:projectId/bugs
// @access  Private
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

// @desc    Get single bug
// @route   GET /api/bugs/:id
// @access  Private
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

// @desc    Create a bug
// @route   POST /api/bugs
// @access  Private
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

        // Log activity
        await ActivityLog.create({
            user_id: req.user._id,
            bug_id: bug._id,
            action: 'created bug',
        });

        res.status(201).json(bug);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a bug
// @route   PUT /api/bugs/:id
// @access  Private
const updateBug = async (req, res) => {
    try {
        const bug = await Bug.findById(req.params.id);

        if (bug) {
            bug.title = req.body.title || bug.title;
            bug.description = req.body.description || bug.description;
            bug.priority = req.body.priority || bug.priority;
            bug.status = req.body.status || bug.status;
            bug.assigned_to = req.body.assignedTo || bug.assigned_to;
            bug.due_date = req.body.dueDate || bug.due_date;

            const updatedBug = await bug.save();

            // Log activity
            await ActivityLog.create({
                user_id: req.user._id,
                bug_id: bug._id,
                action: 'updated bug',
            });

            res.json(updatedBug);
        } else {
            res.status(404).json({ message: 'Bug not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a bug
// @route   DELETE /api/bugs/:id
// @access  Private
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
