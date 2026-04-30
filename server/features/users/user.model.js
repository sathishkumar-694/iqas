import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },

    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        select: false,
    },
    role: {
        type: String,
        enum: ['Admin', 'TL', 'Dev', 'Tester'],
        default: 'Tester',
    },
    avatar: {
        type: String,
        default: '',
    },
    avatar_cloudinary_id: {
        type: String,
        default: '',
    },
    points: {
        type: Number,
        default: 0,
    },
    rank: {
        type: Number,
        default: 1, // 1: Bronze, 2: Silver, 3: Gold, 4: Platinum
    },
    efficiency_score: {
        type: Number,
        default: 0,
    },
    experience_years: {
        type: Number,
        default: 0,
    },
    bugs_resolved_count: {
        type: Number,
        default: 0,
    },
    bugs_reported_count: {
        type: Number,
        default: 0,
    },
    bugs_reopened_count: {
        type: Number,
        default: 0,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
}, {
    timestamps: true,
});

userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
