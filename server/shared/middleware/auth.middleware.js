import jwt from 'jsonwebtoken';
import User from '../../features/users/user.model.js';
import asyncHandler from 'express-async-handler';

const protect = asyncHandler(async (req, res, next) => {
    let token;

    // Notice we use signedCookies now
    if (req.signedCookies && req.signedCookies.accessToken) {
        token = req.signedCookies.accessToken;
    } else if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (token === 'undefined' || token === 'null') {
        token = null;
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) {
                res.status(401);
                throw new Error('Not authorized, user not found or deleted');
            }
            next();
        } catch (error) {
            console.error(error);
            res.status(401);
            throw new Error('Not authorized, token failed or expired');
        }
    } else {
        res.status(401);
        throw new Error('Not authorized, no token provided');
    }
});

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            res.status(403);
            return next(new Error(`User role ${req.user.role} is not authorized to access this route`));
        }
        next();
    };
};

export { protect, authorize };
