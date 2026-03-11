import User from './user.model.js';

const getUsers = async (req, res) => {
    try {
        const query = req.query.role ? { role: req.query.role } : {};
        const users = await User.find(query).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateUserProfile = async (req, res) => {
    try {
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
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const adminResetUserPassword = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            const resetPassword = process.env.DEFAULT_RESET_PASSWORD || 'iqas_reset_123';
            user.password = resetPassword;
            await user.save();
            res.json({ message: 'User password successfully reset to default.' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            if (user.role === 'Admin' && user.email === 'admin@iqas.com') {
                return res.status(400).json({ message: 'Cannot delete the Supreme Admin' });
            }
            await user.deleteOne();
            res.json({ message: 'User removed from system' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateUserRole = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            if (user.role === 'Admin' && user.email === 'admin@iqas.com') {
                return res.status(400).json({ message: 'Cannot alter Supreme Admin role' });
            }
            user.role = req.body.role || user.role;
            const updatedUser = await user.save();
            res.json(updatedUser);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export { getUsers, updateUserProfile, adminResetUserPassword, deleteUser, updateUserRole };
