import express from 'express';
import { getDashboardStats, exportReport } from './report.controller.js';
import { protect, authorize } from '../../shared/middleware/auth.middleware.js';

const router = express.Router();

router.route('/dashboard').get(protect, getDashboardStats);
router.route('/export').get(protect, authorize('Admin', 'TL'), exportReport);

export default router;
