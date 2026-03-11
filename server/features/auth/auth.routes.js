import express from 'express';
import { loginUser, registerUser, adminLogin } from './auth.controller.js';
import { registerValidation, loginValidation } from './auth.validation.js';
import validate from '../../shared/middleware/validate.middleware.js';

const router = express.Router();

router.post('/register', registerValidation, validate, registerUser);
router.post('/login', loginValidation, validate, loginUser);
router.post('/admin-login', loginValidation, validate, adminLogin);

export default router;
