import { z } from 'zod';

export const addCommentValidation = z.object({
    comment_text: z.string().trim()
        .min(1, { message: 'Comment text is required' })
        .max(2000, { message: 'Comment must not exceed 2000 characters' }),
});
