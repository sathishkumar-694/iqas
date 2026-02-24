import express from 'express';
import { getUsers } from '../controllers/userController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, authorize('Admin', 'TL'), getUsers);

export default router;
