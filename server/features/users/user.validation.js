import { z } from 'zod';

export const updateProfileValidation = z.object({
    username: z.string().trim()
        .min(3, { message: 'Username must be between 3 and 30 characters' })
        .max(30, { message: 'Username must be between 3 and 30 characters' })
        .optional(),
    email: z.string().trim()
        .email({ message: 'Please provide a valid email' })
        .optional(),
    password: z.string()
        .min(6, { message: 'Password must be at least 6 characters' })
        .optional(),
});

export const updateRoleValidation = z.object({
    role: z.enum(['Admin', 'TL', 'Dev', 'Tester'], {
        errorMap: () => ({ message: 'Invalid role' })
    })
});
