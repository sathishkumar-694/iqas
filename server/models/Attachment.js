import mongoose from 'mongoose';

const attachmentSchema = mongoose.Schema({
    bug_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bug',
        required: true,
    },
    file_name: {
        type: String,
        required: true,
    },
    file_url: {
        type: String,
        required: true,
    },
    uploaded_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: false },
});

const Attachment = mongoose.model('Attachment', attachmentSchema);

export default Attachment;
