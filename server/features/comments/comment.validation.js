import { body } from 'express-validator';

export const addCommentValidation = [
    body('comment_text')
        .trim()
        .notEmpty().withMessage('Comment text is required')
        .isLength({ max: 2000 }).withMessage('Comment must not exceed 2000 characters'),
];
