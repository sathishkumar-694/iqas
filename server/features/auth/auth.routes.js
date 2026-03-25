import express from 'express';
import { loginUser, registerUser, adminLogin, logoutUser, refreshAccessToken, getMe, forgotPassword, resetPassword } from './auth.controller.js';
import { registerValidation, loginValidation } from './auth.validation.js';
import validate from '../../shared/middleware/validate.middleware.js';
import { protect } from '../../shared/middleware/auth.middleware.js';
import { authLimiter } from '../../shared/middleware/rateLimiter.js';

const router = express.Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@iqas.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Successful login. Sets HttpOnly cookies.
 *       401:
 *         description: Invalid credentials
 */
router.post('/register', authLimiter, validate(registerValidation), registerUser);
router.post('/login', authLimiter, validate(loginValidation), loginUser);
router.post('/admin-login', authLimiter, validate(loginValidation), adminLogin);
router.post('/logout', logoutUser);
router.get('/refresh', refreshAccessToken);
router.get('/me', protect, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

export default router;
