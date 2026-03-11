import { body } from 'express-validator';

export const updateProfileValidation = [
    body('username')
        .optional()
        .trim()
        .isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters'),
    body('email')
        .optional()
        .trim()
        .isEmail().withMessage('Please provide a valid email'),
    body('password')
        .optional()
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

export const updateRoleValidation = [
    body('role')
        .notEmpty().withMessage('Role is required')
        .isIn(['Admin', 'TL', 'Dev', 'Tester']).withMessage('Invalid role'),
];
