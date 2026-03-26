import express from 'express';
import {
    getBugsByProject,
    getBugById,
    createBug,
    updateBug,
    deleteBug,
    getBugActivity,
    bulkUpdateBugs,
} from './bug.controller.js';
import { protect, authorize } from '../../shared/middleware/auth.middleware.js';
import { createBugValidation, updateBugValidation } from './bug.validation.js';
import validate from '../../shared/middleware/validate.middleware.js';

const router = express.Router();

router.route('/').post(protect, validate(createBugValidation), createBug);
router.route('/bulk').put(protect, authorize('Admin', 'TL'), bulkUpdateBugs);
router.route('/project/:projectId').get(protect, getBugsByProject);
router
    .route('/:id')
    .get(protect, getBugById)
    .put(protect, validate(updateBugValidation), updateBug)
    .delete(protect, authorize('Admin'), deleteBug);
router.route('/:id/activity').get(protect, getBugActivity);

export default router;
