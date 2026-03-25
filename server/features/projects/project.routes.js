import express from 'express';
import {
    getProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    assignTeamMember,
    removeTeamMember
} from './project.controller.js';
import { protect, authorize } from '../../shared/middleware/auth.middleware.js';
import { createProjectValidation, assignMemberValidation } from './project.validation.js';
import validate from '../../shared/middleware/validate.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Retrieve a list of projects
 *     tags: [Projects]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search projects by name
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *     responses:
 *       200:
 *         description: A paginated list of projects
 */
router.route('/').get(protect, getProjects).post(protect, authorize('Admin', 'TL'), createProjectValidation, validate, createProject);
router
    .route('/:id')
    .get(protect, getProjectById)
    .put(protect, authorize('Admin'), updateProject)
    .delete(protect, authorize('Admin'), deleteProject);

router.route('/:id/members').put(protect, authorize('Admin', 'TL'), assignMemberValidation, validate, assignTeamMember);
router.route('/:id/members/:userId').delete(protect, authorize('Admin', 'TL'), removeTeamMember);

export default router;
