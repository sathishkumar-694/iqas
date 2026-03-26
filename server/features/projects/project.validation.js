import { z } from 'zod';

export const createProjectValidation = z.object({
    name: z.string().trim()
        .min(1, { message: 'Project name is required' })
        .max(100, { message: 'Project name must not exceed 100 characters' }),
    description: z.string().trim()
        .max(1000, { message: 'Description must not exceed 1000 characters' })
        .optional(),
});

export const assignMemberValidation = z.object
({
    userId: z.string().trim()
        .min(1, { message: 'User ID is required' })
        .regex(/^[0-9a-fA-F]{24}$/, { message: 'Invalid User ID' }),
});
