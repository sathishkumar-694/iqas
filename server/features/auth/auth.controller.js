import crypto from 'crypto';
import User from '../users/user.model.js';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '30d',
    });
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
};

const registerUser = async (req, res) => {
    const { username, email, password, role } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    if (role === 'Admin') {
        return res.status(403).json({ message: 'Admin registration is not allowed via this endpoint' });
    }

    const user = await User.create({
        username,
        email,
        password,
        role,
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

const adminLogin = async (req, res) => {
    const { email, password } = req.body;

    const envAdminEmail = process.env.ADMIN_EMAIL || 'admin@iqas.com';
    const envAdminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (email === envAdminEmail && password === envAdminPassword) {
        let adminUser = await User.findOne({ email: envAdminEmail });
        
        if (!adminUser) {
            adminUser = await User.create({
                username: 'Supreme Admin',
                email: envAdminEmail,
                password: envAdminPassword,
                role: 'Admin'
            });
        }

        res.json({
            _id: adminUser._id,
            username: adminUser.username,
            email: adminUser.email,
            role: adminUser.role,
            token: generateToken(adminUser._id),
        });
    } else {
        res.status(401).json({ message: 'Invalid Admin credentials' });
    }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'No account found with that email' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

        user.resetPasswordToken = resetTokenHash;
        user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
        await user.save();

        // Build reset URL
        const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

        // Send email (uses SMTP config from .env, or logs to console as fallback)
        if (process.env.SMTP_HOST) {
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT || 587,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });

            await transporter.sendMail({
                from: process.env.SMTP_FROM || 'noreply@iqas.com',
                to: user.email,
                subject: 'IQAS - Password Reset Request',
                html: `<h3>Password Reset</h3><p>Click the link below to reset your password. This link expires in 30 minutes.</p><a href="${resetUrl}">${resetUrl}</a>`,
            });

            res.json({ message: 'Password reset email sent' });
        } else {
            // No SMTP configured — return token directly (dev mode)
            console.log(`[DEV] Password reset link: ${resetUrl}`);
            res.json({ message: 'Password reset link generated (check server console in dev mode)', resetUrl });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST /api/auth/reset-password/:token
const resetPassword = async (req, res) => {
    const { password } = req.body;

    if (!password || password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    try {
        const resetTokenHash = crypto.createHash('sha256').update(req.params.token).digest('hex');

        const user = await User.findOne({
            resetPasswordToken: resetTokenHash,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.json({ message: 'Password reset successful. You can now log in.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export { loginUser, registerUser, adminLogin, forgotPassword, resetPassword };
