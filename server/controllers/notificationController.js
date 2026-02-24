import Notification from '../models/Notification.js';

const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ user_id: req.user._id })
            .sort({ created_at: -1 });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (notification && notification.user_id.toString() === req.user._id.toString()) {
            notification.is_read = true;
            await notification.save();
            res.json(notification);
        } else {
            res.status(404).json({ message: 'Notification not found or unauthorized' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export { getNotifications, markAsRead };
