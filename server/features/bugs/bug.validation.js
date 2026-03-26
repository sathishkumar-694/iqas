import { z } from 'zod';

export const createBugValidation = z.object({
    title: z.string().trim()
        .min(1, { message: 'Bug title is required' })
        .max(200, { message: 'Title must not exceed 200 characters' }),
    projectId: z.string().trim()
        .min(1, { message: 'Project ID is required' })
        .regex(/^[0-9a-fA-F]{24}$/, { message: 'Invalid Project ID' }),
    priority: z.enum(['Low', 'Medium', 'High', 'Critical'], {
        errorMap: () => ({ message: 'Invalid priority value' })
    }).optional(),
    assignedTo: z.string().trim()
        .regex(/^[0-9a-fA-F]{24}$/, { message: 'Invalid assignee ID' })
        .optional().or(z.literal('')),
    dueDate: z.string().datetime({ message: 'Invalid date format' }).optional().or(z.literal('')),
});

export const updateBugValidation = z.object({
    title: z.string().trim()
        .max(200, { message: 'Title must not exceed 200 characters' })
        .optional(),
    status: z.enum(['Open', 'In Progress', 'Resolved', 'Closed'], {
        errorMap: () => ({ message: 'Invalid status value' })
    }).optional(),
    priority: z.enum(['Low', 'Medium', 'High', 'Critical'], {
        errorMap: () => ({ message: 'Invalid priority value' })
    }).optional(),
    assignedTo: z.string().trim()
        .regex(/^[0-9a-fA-F]{24}$/, { message: 'Invalid assignee ID' })
        .optional().or(z.literal('')),
    dueDate: z.string().datetime({ message: 'Invalid date format' }).optional().or(z.literal('')),
});
