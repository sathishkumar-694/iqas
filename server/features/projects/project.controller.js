import Project from './project.model.js';

// GET /api/projects?search=&page=&limit=
const getProjects = async (req, res) => {
    try {
        const { search, page = 1, limit = 20 } = req.query;
        let query = {};
        
        if (req.user.role === 'Dev' || req.user.role === 'Tester') {
            query.team_members = req.user._id;
        } else if (req.user.role === 'TL') {
            query.$or = [
                { project_head: req.user._id },
                { team_members: req.user._id }
            ];
        }

        if (search) {
            const searchCondition = { name: { $regex: search, $options: 'i' } };
            if (query.$or) {
                query = { $and: [{ $or: query.$or }, searchCondition] };
            } else {
                Object.assign(query, searchCondition);
            }
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await Project.countDocuments(query);
        const projects = await Project.find(query)
            .populate('created_by', 'username email')
            .populate('project_head', 'username email')
            .populate('team_members', 'username role')
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.json({
            data: projects,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('created_by', 'username email')
            .populate('project_head', 'username email')
            .populate('team_members', 'username role');

        if (project) {
            res.json(project);
        } else {
            res.status(404).json({ message: 'Project not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createProject = async (req, res) => {
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Please add a project name' });
    }

    try {
        const project = await Project.create({
            name,
            description,
            created_by: req.user._id,
        });

        res.status(201).json(project);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (project) {
            project.name = req.body.name || project.name;
            project.description = req.body.description || project.description;

            const updatedProject = await project.save();
            res.json(updatedProject);
        } else {
            res.status(404).json({ message: 'Project not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (project) {
            await project.deleteOne();
            res.json({ message: 'Project removed' });
        } else {
            res.status(404).json({ message: 'Project not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const assignTeamMember = async (req, res) => {
    const { userId } = req.body;
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        if (!project.team_members.includes(userId)) {
            project.team_members.push(userId);
            await project.save();
        }
        res.json(project);
    } catch(error) {
        res.status(500).json({ message: error.message });
    }
};

const removeTeamMember = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        project.team_members = project.team_members.filter(
            (id) => id.toString() !== req.params.userId
        );
        await project.save();
        res.json(project);
    } catch(error) {
        res.status(500).json({ message: error.message });
    }
};

export {
    getProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    assignTeamMember,
    removeTeamMember
};
