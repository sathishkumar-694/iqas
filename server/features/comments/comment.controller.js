import Comment from './comment.model.js';
import User from '../users/user.model.js';
import Notification from '../notifications/notification.model.js';
import asyncHandler from 'express-async-handler';

const getCommentsByBug = asyncHandler(async (req, res) => {
    const comments = await Comment.find({ bug_id: req.params.bugId })
        .populate('user_id', 'username')
        .sort({ created_at: -1 });
    res.json(comments);
});

const addComment = asyncHandler(async (req, res) => {
    const { comment_text } = req.body;

    if (!comment_text) {
        res.status(400);
        throw new Error('Please add comment text');
    }

    const comment = await Comment.create({
        bug_id: req.params.bugId,
        user_id: req.user._id,
        comment_text,
    });

    const populatedComment = await Comment.findById(comment._id).populate('user_id', 'username');

    // Handle @mentions — find @username patterns and notify them
    const mentionPattern = /@(\w+)/g;
    const mentions = [...comment_text.matchAll(mentionPattern)].map(m => m[1]);

    if (mentions.length > 0) {
        const mentionedUsers = await User.find({
            username: { $in: mentions },
            _id: { $ne: req.user._id }, // Don't notify yourself
        });

        const notifications = mentionedUsers.map(u => ({
            user_id: u._id,
            message: `${req.user.username} mentioned you in a comment: "${comment_text.substring(0, 80)}${comment_text.length > 80 ? '...' : ''}"`,
        }));

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
            const io = req.app.get('io');
            notifications.forEach(n => {
                io.to(n.user_id.toString()).emit('new_notification', n.message);
            });
        }
    }

    res.status(201).json(populatedComment);
});

export { getCommentsByBug, addComment };
