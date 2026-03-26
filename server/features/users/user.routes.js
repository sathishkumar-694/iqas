import express from 'express';
import { getUsers, updateUserProfile, adminResetUserPassword, deleteUser, updateUserRole, uploadAvatar } from './user.controller.js';
import { protect, authorize } from '../../shared/middleware/auth.middleware.js';
import { updateProfileValidation, updateRoleValidation } from './user.validation.js';
import validate from '../../shared/middleware/validate.middleware.js';

import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../../config/cloudinary.js';

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'iqas-avatars',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    },
});

const upload = multer({ storage });

const router = express.Router();

router.route('/').get(protect, authorize('Admin', 'TL'), getUsers);
router.route('/profile').put(protect, validate(updateProfileValidation), updateUserProfile);
router.route('/profile/avatar').put(protect, upload.single('avatar'), uploadAvatar);
router.route('/:id/reset-password').put(protect, authorize('Admin'), adminResetUserPassword);
router.route('/:id/role').put(protect, authorize('Admin'), validate(updateRoleValidation), updateUserRole);
router.route('/:id').delete(protect, authorize('Admin'), deleteUser);

export default router;
