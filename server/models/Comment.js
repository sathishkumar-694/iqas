import mongoose from 'mongoose';

const commentSchema = mongoose.Schema({
    bug_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bug',
        required: true,
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    comment_text: {
        type: String,
        required: true,
    },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: false },
});

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;
