import express from 'express';
import { getCommentsByBug, addComment } from '../controllers/commentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/:bugId').get(protect, getCommentsByBug).post(protect, addComment);

export default router;
