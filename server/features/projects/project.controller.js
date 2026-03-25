import Project from './project.model.js';
import asyncHandler from 'express-async-handler';

// GET /api/projects?search=&page=&limit=
const getProjects = asyncHandler(async (req, res) => {
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
});

const getProjectById = asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id)
        .populate('created_by', 'username email')
        .populate('project_head', 'username email')
        .populate('team_members', 'username role');

    if (project) {
        res.json(project);
    } else {
        res.status(404);
        throw new Error('Project not found');
    }
});

const createProject = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if (!name) {
        res.status(400);
        throw new Error('Please add a project name');
    }

    const project = await Project.create({
        name,
        description,
        created_by: req.user._id,
    });

    res.status(201).json(project);
});

const updateProject = asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);

    if (project) {
        project.name = req.body.name || project.name;
        project.description = req.body.description || project.description;

        const updatedProject = await project.save();
        res.json(updatedProject);
    } else {
        res.status(404);
        throw new Error('Project not found');
    }
});

const deleteProject = asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);

    if (project) {
        await project.deleteOne();
        res.json({ message: 'Project removed' });
    } else {
        res.status(404);
        throw new Error('Project not found');
    }
});

const assignTeamMember = asyncHandler(async (req, res) => {
    const { userId } = req.body;
    const project = await Project.findById(req.params.id);
    
    if (!project) {
        res.status(404);
        throw new Error('Project not found');
    }

    if (!project.team_members.includes(userId)) {
        project.team_members.push(userId);
        await project.save();
    }
    
    res.json(project);
});

const removeTeamMember = asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
        res.status(404);
        throw new Error('Project not found');
    }

    project.team_members = project.team_members.filter(
        (id) => id.toString() !== req.params.userId
    );
    await project.save();
    
    res.json(project);
});

export {
    getProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    assignTeamMember,
    removeTeamMember
};
