import express from 'express';
import {
    getProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    assignTeamMember,
    removeTeamMember
} from '../controllers/projectController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, getProjects).post(protect, authorize('Admin', 'TL'), createProject);
router
    .route('/:id')
    .get(protect, getProjectById)
    .put(protect, authorize('Admin'), updateProject)
    .delete(protect, authorize('Admin'), deleteProject);

router.route('/:id/members').put(protect, authorize('Admin', 'TL'), assignTeamMember);
router.route('/:id/members/:userId').delete(protect, authorize('Admin', 'TL'), removeTeamMember);

export default router;
