import multer from 'multer';
import path from 'path';
import Attachment from '../../shared/models/attachment.model.js';
import asyncHandler from 'express-async-handler';

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|log|csv|zip/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname || mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Only images, documents, and archives are allowed'), false);
    }
};

export const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter,
});

// GET /api/attachments/bug/:bugId
const getAttachmentsByBug = asyncHandler(async (req, res) => {
    const attachments = await Attachment.find({ bug_id: req.params.bugId })
        .populate('uploaded_by', 'username')
        .sort({ created_at: -1 });
    res.json(attachments);
});

// POST /api/attachments/bug/:bugId
const uploadAttachment = asyncHandler(async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error('Please upload a file');
    }

    const attachment = await Attachment.create({
        bug_id: req.params.bugId,
        file_name: req.file.originalname,
        file_url: `/uploads/${req.file.filename}`,
        uploaded_by: req.user._id,
    });

    const populated = await Attachment.findById(attachment._id).populate('uploaded_by', 'username');
    res.status(201).json(populated);
});

// DELETE /api/attachments/:id
const deleteAttachment = asyncHandler(async (req, res) => {
    const attachment = await Attachment.findById(req.params.id);
    if (!attachment) {
        res.status(404);
        throw new Error('Attachment not found');
    }

    // Only uploader or Admin can delete
    if (attachment.uploaded_by.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
        res.status(403);
        throw new Error('Not authorized to delete this attachment');
    }

    await attachment.deleteOne();
    res.json({ message: 'Attachment removed' });
});

export { getAttachmentsByBug, uploadAttachment, deleteAttachment };
