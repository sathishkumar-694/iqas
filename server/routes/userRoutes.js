import express from 'express';
import { getUsers, updateUserProfile, adminResetUserPassword, deleteUser, updateUserRole } from '../controllers/userController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, authorize('Admin', 'TL'), getUsers);
router.route('/profile').put(protect, updateUserProfile);
router.route('/:id/reset-password').put(protect, authorize('Admin'), adminResetUserPassword);
router.route('/:id/role').put(protect, authorize('Admin'), updateUserRole);
router.route('/:id').delete(protect, authorize('Admin'), deleteUser);

export default router;
