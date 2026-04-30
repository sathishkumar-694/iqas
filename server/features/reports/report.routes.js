import express from 'express';
import { getDashboardStats, exportReport } from './report.controller.js';
import { protect, authorize } from '../../shared/middleware/auth.middleware.js';

const router = express.Router();

router.route('/dashboard').get(protect, authorize('Admin', 'TL'), getDashboardStats);
router.route('/project/:projectId').get(protect, authorize('Admin', 'TL'), getDashboardStats); // Reusing logic with filter or new function
router.route('/export').get(protect, authorize('Admin', 'TL'), exportReport);

export default router;
