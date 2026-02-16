import Comment from '../models/Comment.js';

// @desc    Get comments for a bug
// @route   GET /api/bugs/:bugId/comments
// @access  Private
const getCommentsByBug = async (req, res) => {
    try {
        const comments = await Comment.find({ bug_id: req.params.bugId })
            .populate('user_id', 'username')
            .sort({ created_at: -1 });
        res.json(comments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add a comment
// @route   POST /api/bugs/:bugId/comments
// @access  Private
const addComment = async (req, res) => {
    const { comment_text } = req.body;

    if (!comment_text) {
        return res.status(400).json({ message: 'Please add comment text' });
    }

    try {
        const comment = await Comment.create({
            bug_id: req.params.bugId,
            user_id: req.user._id,
            comment_text,
        });

        const populatedComment = await Comment.findById(comment._id).populate('user_id', 'username');

        res.status(201).json(populatedComment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export { getCommentsByBug, addComment };
