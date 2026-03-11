import { body } from 'express-validator';

export const createProjectValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Project name is required')
        .isLength({ max: 100 }).withMessage('Project name must not exceed 100 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('Description must not exceed 1000 characters'),
];

export const assignMemberValidation = [
    body('userId')
        .notEmpty().withMessage('User ID is required')
        .isMongoId().withMessage('Invalid User ID'),
];
