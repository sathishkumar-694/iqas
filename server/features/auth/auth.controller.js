import crypto from 'crypto';
import User from '../users/user.model.js';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';
import { sendWelcomeEmail } from '../../shared/utils/emailService.js';
import asyncHandler from 'express-async-handler';
import Redis from 'ioredis';

// Fallback or Distributed caching setup for secure token management
const fallbackBlacklist = new Set();
let redisClient = null;
let redisAvailable = false;

if (process.env.REDIS_URL) {
    try {
        redisClient = new Redis(process.env.REDIS_URL, {
            lazyConnect: true,          // Don't connect immediately on creation
            maxRetriesPerRequest: 1,    // Fail fast per request instead of hanging
            connectTimeout: 5000,       // 5s connection timeout
            enableOfflineQueue: false,  // Don't queue commands when disconnected
            retryStrategy: (times) => {
                if (times > 3) {
                    // After 3 failed retries, give up and use fallback
                    console.warn('[Redis] Connection failed after retries. Falling back to in-memory token store.');
                    redisAvailable = false;
                    return null; // Stop retrying
                }
                return Math.min(times * 500, 2000); // Backoff: 500ms, 1s, 1.5s...
            },
        });

        // Handle errors without crashing the process
        redisClient.on('error', (err) => {
            if (redisAvailable) {
                console.warn(`[Redis] Connection lost: ${err.message}. Using in-memory fallback.`);
            }
            redisAvailable = false;
        });

        redisClient.on('connect', () => {
            redisAvailable = true;
            console.log('[Redis] Connected to Redis successfully.');
        });

        // Attempt initial connection
        redisClient.connect().catch(() => {
            console.warn('[Redis] Could not connect to Redis. Token blacklisting will use in-memory fallback.');
            redisAvailable = false;
        });

    } catch (err) {
        console.warn('[Redis] Failed to initialize Redis client. Using in-memory fallback.');
    }
}

const addTokenToBlacklist = async (token) => {
    if (redisClient && redisAvailable) {
        try {
            await redisClient.set(`bl_${token}`, 'true', 'EX', 7 * 24 * 60 * 60);
            return;
        } catch {
            // Redis failed mid-operation, fall through to in-memory
        }
    }
    fallbackBlacklist.add(token);
};

const isTokenBlacklisted = async (token) => {
    if (redisClient && redisAvailable) {
        try {
            return (await redisClient.get(`bl_${token}`)) === 'true';
        } catch {
            // Redis failed, fall through to in-memory
        }
    }
    return fallbackBlacklist.has(token);
};

const generateAccessToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '15m', // Configurable expiry
    });
};

const generateRefreshToken = (id) => {
    return jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d', // Configurable expiry
    });
};

const isProduction = process.env.NODE_ENV === 'production';

const setCookies = (res, accessToken, refreshToken) => {
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',  // 'none' required for Vercel → Render cross-origin
        signed: true,
        maxAge: 15 * 60 * 1000, // 15 mins
    });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',  // 'none' required for Vercel → Render cross-origin
        signed: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
};

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Use .select('+password') because we configured select: false on the schema
    const user = await User.findOne({ email }).select('+password');
    const emailId = user ? user.email : "dummy@gmail.com";
    
    // Always run the password check or a dummy match to prevent timing attacks
    const isMatch = user ? await user.matchPassword(password) : false;

    // Secure checking
    if (user && isMatch) {
        // Remove password before sending to the client logic manually
        user.password = undefined;

        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);
        
        setCookies(res, accessToken, refreshToken);

        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password, role } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    if (role === 'Admin') {
        res.status(403);
        throw new Error('Admin registration is not allowed via this endpoint');
    }

    const user = await User.create({
        username,
        email,
        password,
        role,
    });

    if (user) {
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);
        
        setCookies(res, accessToken, refreshToken);
        sendWelcomeEmail(user);

        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

const adminLogin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const envAdminEmail = process.env.ADMIN_EMAIL;
    const envAdminPassword = process.env.ADMIN_PASSWORD;

    if (email === envAdminEmail && password === envAdminPassword) {
        // Use .select('+password') because we configured select: false on the schema
        let adminUser = await User.findOne({ email: envAdminEmail }).select('+password');
        
        if (!adminUser) {
            adminUser = await User.create({
                username: 'Supreme Admin',
                email: envAdminEmail,
                password: envAdminPassword,
                role: 'Admin'
            });
        }

        const accessToken = generateAccessToken(adminUser._id);
        const refreshToken = generateRefreshToken(adminUser._id);
        
        setCookies(res, accessToken, refreshToken);

        res.json({
            _id: adminUser._id,
            username: adminUser.username,
            email: adminUser.email,
            role: adminUser.role,
        });
    } else {
        res.status(401);
        throw new Error('Invalid Admin credentials');
    }
});

const logoutUser = asyncHandler(async (req, res) => {
    const refreshToken = req.signedCookies.refreshToken; // Read signed cookie
    if (refreshToken) {
        await addTokenToBlacklist(refreshToken);
    }
    
    res.cookie('accessToken', '', { httpOnly: true, signed: true, expires: new Date(0) });
    res.cookie('refreshToken', '', { httpOnly: true, signed: true, expires: new Date(0) });
    res.json({ message: 'Logged out successfully' });
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const refreshToken = req.signedCookies.refreshToken; // Read signed cookie
    
    if (!refreshToken) {
        res.status(401);
        throw new Error('No refresh token provided');
    }

    if (await isTokenBlacklisted(refreshToken)) {
        res.cookie('accessToken', '', { httpOnly: true, signed: true, expires: new Date(0) });
        res.cookie('refreshToken', '', { httpOnly: true, signed: true, expires: new Date(0) });
        res.status(403);
        throw new Error('Token has been revoked. Please log in again.');
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET);
    
    const newAccessToken = generateAccessToken(decoded.id);
    const newRefreshToken = generateRefreshToken(decoded.id);
    
    await addTokenToBlacklist(refreshToken);
    setCookies(res, newAccessToken, newRefreshToken);
    
    res.json({ message: 'Token refreshed successfully' });
});

const getMe = asyncHandler(async (req, res) => {
    if (req.user) {
        res.json({
            _id: req.user._id,
            username: req.user.username,
            email: req.user.email,
            role: req.user.role,
        });
    } else {
        res.status(401);
        throw new Error('User not found');
    }
});

const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        res.status(404);
        throw new Error('No account found with that email');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000;
    await user.save();

    const origin = req.headers.origin || process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${origin}/reset-password/${resetToken}`;

    if (process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY);

        try {
            await resend.emails.send({
                from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
                to: user.email,
                subject: 'IQAS - Password Reset Request',
                html: `<h3>Password Reset</h3><p>Click the link below to reset your password. This link expires in 30 minutes.</p><a href="${resetUrl}">${resetUrl}</a>`,
            });
            res.json({ message: 'Password reset email sent' });
        } catch (error) {
            console.error('Resend error:', error);
            res.status(500);
            throw new Error('Failed to send password reset email');
        }
    } else {
        console.log(`[DEV] Password reset link: ${resetUrl}`);
        res.json({ message: 'Password reset link generated (check server console in dev mode)', resetUrl });
    }
});

const resetPassword = asyncHandler(async (req, res) => {
    const { password } = req.body;

    if (!password || password.length < 6) {
        res.status(400);
        throw new Error('Password must be at least 6 characters');
    }

    const resetTokenHash = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
        resetPasswordToken: resetTokenHash,
        resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
        res.status(400);
        throw new Error('Invalid or expired reset token');
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: 'Password reset successful. You can now log in.' });
});

export { loginUser, registerUser, adminLogin, logoutUser, refreshAccessToken, getMe, forgotPassword, resetPassword };
