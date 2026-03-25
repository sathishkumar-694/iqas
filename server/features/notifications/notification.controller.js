import Notification from './notification.model.js';
import asyncHandler from 'express-async-handler';

const getNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ user_id: req.user._id })
        .sort({ created_at: -1 });
    res.json(notifications);
});

const markAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findById(req.params.id);

    if (notification && notification.user_id.toString() === req.user._id.toString()) {
        notification.is_read = true;
        await notification.save();
        res.json(notification);
    } else {
        res.status(404);
        throw new Error('Notification not found or unauthorized');
    }
});

export { getNotifications, markAsRead };
