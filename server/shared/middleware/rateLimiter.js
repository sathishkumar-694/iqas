import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
    windowMs: 60, // 15 minutes
    max: 1000, // Limit each IP to 5 requests per window
    message: { message: 'Too many authentication attempts from this IP, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});

export const apiLimiter = rateLimit({
    windowMs: 60, 
    max: 1000, // Limit general API to 100 requests per 15 mins
    message: { message: 'Too many requests, please try again later' }
});
