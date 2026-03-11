import { body } from 'express-validator';

export const createBugValidation = [
    body('title')
        .trim()
        .notEmpty().withMessage('Bug title is required')
        .isLength({ max: 200 }).withMessage('Title must not exceed 200 characters'),
    body('projectId')
        .notEmpty().withMessage('Project ID is required')
        .isMongoId().withMessage('Invalid Project ID'),
    body('priority')
        .optional()
        .isIn(['Low', 'Medium', 'High', 'Critical']).withMessage('Invalid priority value'),
    body('assignedTo')
        .optional()
        .isMongoId().withMessage('Invalid assignee ID'),
    body('dueDate')
        .optional()
        .isISO8601().withMessage('Invalid date format'),
];

export const updateBugValidation = [
    body('title')
        .optional()
        .trim()
        .isLength({ max: 200 }).withMessage('Title must not exceed 200 characters'),
    body('status')
        .optional()
        .isIn(['Open', 'In Progress', 'Resolved', 'Closed']).withMessage('Invalid status value'),
    body('priority')
        .optional()
        .isIn(['Low', 'Medium', 'High', 'Critical']).withMessage('Invalid priority value'),
    body('assignedTo')
        .optional()
        .isMongoId().withMessage('Invalid assignee ID'),
    body('dueDate')
        .optional()
        .isISO8601().withMessage('Invalid date format'),
];
