import express from 'express';
import { getNotifications, markAsRead } from './notification.controller.js';
import { protect } from '../../shared/middleware/auth.middleware.js';

const router = express.Router();

router.route('/').get(protect, getNotifications);
router.route('/:id/read').put(protect, markAsRead);

export default router;
