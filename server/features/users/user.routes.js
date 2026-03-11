import express from 'express';
import { getUsers, updateUserProfile, adminResetUserPassword, deleteUser, updateUserRole } from './user.controller.js';
import { protect, authorize } from '../../shared/middleware/auth.middleware.js';
import { updateProfileValidation, updateRoleValidation } from './user.validation.js';
import validate from '../../shared/middleware/validate.middleware.js';

const router = express.Router();

router.route('/').get(protect, authorize('Admin', 'TL'), getUsers);
router.route('/profile').put(protect, updateProfileValidation, validate, updateUserProfile);
router.route('/:id/reset-password').put(protect, authorize('Admin'), adminResetUserPassword);
router.route('/:id/role').put(protect, authorize('Admin'), updateRoleValidation, validate, updateUserRole);
router.route('/:id').delete(protect, authorize('Admin'), deleteUser);

export default router;
