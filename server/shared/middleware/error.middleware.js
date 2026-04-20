import logger from '../utils/logger.js';

const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

const errorHandler = (err, req, res, next) => {
    // Log the error for debugging
    const errorLog = `${err.message} - ${req ? req.method : 'N/A'} ${req ? req.originalUrl : 'N/A'} - ${req ? req.ip : 'N/A'}`;
    logger.error(errorLog);

    if (process.env.NODE_ENV !== 'production' && err.stack) {
        console.error(err.stack);
    }

    if (typeof next !== 'function') {
        console.warn('⚠️ Warning: errorHandler called without a valid next function reference.');
    }

    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message;

    // Handle Mongoose bad ObjectId
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
        statusCode = 404;
        message = 'Resource not found';
    }

    // Remove file path locations from the message to prevent exposing internal paths
    if (message && message.includes('ENOENT')) {
        message = 'File system error occurred. Cannot find the specified directory or file.';
    } else if (message) {
        // Strip out anything that looks like a drive letter and path (e.g., C:\Users\...)
        message = message.replace(/[A-Za-z]:\\[\w\\\-\.]+/, '[REDACTED PATH]');
        // Strip out anything that looks like a linux path (e.g., /home/user/...)
        message = message.replace(/(?:\/[\w\.\-]+)+/, '[REDACTED PATH]');
    }

    res.status(statusCode).json({
        message,
    });
};

export { notFound, errorHandler };
