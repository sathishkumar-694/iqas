import express from 'express';
import {
    getBugsByProject,
    getBugById,
    createBug,
    updateBug,
    deleteBug,
} from './bug.controller.js';
import { protect, authorize } from '../../shared/middleware/auth.middleware.js';
import { createBugValidation, updateBugValidation } from './bug.validation.js';
import validate from '../../shared/middleware/validate.middleware.js';

const router = express.Router();

router.route('/').post(protect, createBugValidation, validate, createBug);
router.route('/project/:projectId').get(protect, getBugsByProject);
router
    .route('/:id')
    .get(protect, getBugById)
    .put(protect, updateBugValidation, validate, updateBug)
    .delete(protect, authorize('Admin'), deleteBug);

export default router;
