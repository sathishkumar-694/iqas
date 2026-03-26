import User from './user.model.js';
import asyncHandler from 'express-async-handler';
import cloudinary from '../../config/cloudinary.js';

const getUsers = asyncHandler(async (req, res) => {
    const query = req.query.role ? { role: req.query.role } : {};
    const users = await User.find(query).select('-password');
    res.json(users);
});

const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.username = req.body.username || user.username;
        user.email = req.body.email || user.email;
        
        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            role: updatedUser.role,
            avatar: updatedUser.avatar,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

const uploadAvatar = asyncHandler(async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error('Please upload an image file');
    }

    const user = await User.findById(req.user._id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Delete old avatar if exists
    if (user.avatar_cloudinary_id) {
        try {
            await cloudinary.uploader.destroy(user.avatar_cloudinary_id);
        } catch (error) {
            console.error('Failed to delete old avatar:', error);
        }
    }

    user.avatar = req.file.path;
    user.avatar_cloudinary_id = req.file.filename;
    
    await user.save();

    res.json({
        _id: user._id,
        avatar: user.avatar,
        message: 'Avatar updated successfully'
    });
});

const adminResetUserPassword = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        const resetPassword = process.env.DEFAULT_RESET_PASSWORD || 'iqas_reset_123';
        user.password = resetPassword;
        await user.save();
        res.json({ message: 'User password successfully reset to default.' });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        if (user.role === 'Admin' && user.email === 'admin@iqas.com') {
            res.status(400);
            throw new Error('Cannot delete the Supreme Admin');
        }
        await user.deleteOne();
        res.json({ message: 'User removed from system' });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

const updateUserRole = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        if (user.role === 'Admin' && user.email === 'admin@iqas.com') {
            res.status(400);
            throw new Error('Cannot alter Supreme Admin role');
        }
        user.role = req.body.role || user.role;
        const updatedUser = await user.save();
        res.json(updatedUser);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

export { getUsers, updateUserProfile, adminResetUserPassword, deleteUser, updateUserRole, uploadAvatar };
