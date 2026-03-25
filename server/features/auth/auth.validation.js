import { z } from 'zod';

export const registerValidation = z.object({
    username: z.string().trim()
        .min(1, { message: 'Username is required' })
        .min(3, { message: 'Username must be at least 3 characters' })
        .max(30, { message: 'Username must be at most 30 characters' }),
    email: z.string().trim()
        .min(1, { message: 'Email is required' })
        .email({ message: 'Please provide a valid email' }),
    password: z.string()
        .min(1, { message: 'Password is required' })
        .min(6, { message: 'Password must be at least 6 characters' }),
    role: z.enum(['TL', 'Dev', 'Tester'], {
        errorMap: () => ({ message: 'Invalid role' })
    }).optional()
});

export const loginValidation = z.object({
    email: z.string().trim()
        .min(1, { message: 'Email is required' })
        .email({ message: 'Please provide a valid email' }),
    password: z.string()
        .min(1, { message: 'Password is required' })
});
