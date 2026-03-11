import express from 'express';
import { getCommentsByBug, addComment } from './comment.controller.js';
import { protect } from '../../shared/middleware/auth.middleware.js';
import { addCommentValidation } from './comment.validation.js';
import validate from '../../shared/middleware/validate.middleware.js';

const router = express.Router();

router.route('/:bugId').get(protect, getCommentsByBug).post(protect, addCommentValidation, validate, addComment);

export default router;
