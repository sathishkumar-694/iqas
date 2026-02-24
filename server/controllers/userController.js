import User from '../models/User.js';

// @desc    Get all users (Filtering by role optionally)
// @route   GET /api/users
// @access  Private/Admin|TL
const getUsers = async (req, res) => {
    try {
        const query = req.query.role ? { role: req.query.role } : {};
        const users = await User.find(query).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export { getUsers };
