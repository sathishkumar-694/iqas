import express from 'express';
import { getLeaderboard, getUserQualityStats } from './ranking.controller.js';
import { protect } from '../../shared/middleware/auth.middleware.js';

const router = express.Router();

router.get('/leaderboard', protect, getLeaderboard);
router.get('/stats/:userId', protect, getUserQualityStats);

export default router;
