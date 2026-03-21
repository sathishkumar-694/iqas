import express from 'express';
import { getAttachmentsByBug, uploadAttachment, deleteAttachment, upload } from './attachment.controller.js';
import { protect } from '../../shared/middleware/auth.middleware.js';

const router = express.Router();

router.route('/bug/:bugId')
    .get(protect, getAttachmentsByBug)
    .post(protect, upload.single('file'), uploadAttachment);

router.route('/:id')
    .delete(protect, deleteAttachment);

export default router;
