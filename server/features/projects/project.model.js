import mongoose from 'mongoose';

const projectSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    project_head: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    team_members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

const Project = mongoose.model('Project', projectSchema);

export default Project;
