import multer from 'multer';
import path from 'path';
import Attachment from '../../shared/models/attachment.model.js';
import asyncHandler from 'express-async-handler';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../../config/cloudinary.js';

// Configure multer storage with Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'iqas-attachments',
        // allow various resource types since attachments can be pdf, zip, etc (if cloudinary supports it)
        resource_type: 'auto',
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
        file_url: req.file.path,
        cloudinary_id: req.file.filename,
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

    // Remove from Cloudinary if cloudinary_id exists
    if (attachment.cloudinary_id) {
        try {
            await cloudinary.uploader.destroy(attachment.cloudinary_id);
        } catch (error) {
            console.error('Failed to delete attachment from Cloudinary:', error);
        }
    }

    await attachment.deleteOne();
    res.json({ message: 'Attachment removed' });
});

export { getAttachmentsByBug, uploadAttachment, deleteAttachment };
