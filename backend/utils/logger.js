const winston = require('winston');
const path = require('path');

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Create the logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports: [
        // Write to console
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        // Write to file
        new winston.transports.File({
            filename: path.join(__dirname, '../logs/error.log'),
            level: 'error'
        }),
        new winston.transports.File({
            filename: path.join(__dirname, '../logs/combined.log')
        })
    ]
});

// Create a stream object for Morgan
logger.stream = {
    write: (message) => {
        logger.info(message.trim());
    }
};

// Logging middleware
const loggingMiddleware = (req, res, next) => {
    const start = Date.now();

    // Log request
    logger.info({
        type: 'request',
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('user-agent')
    });

    // Log response
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info({
            type: 'response',
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`
        });
    });

    next();
};

// Audit logging for sensitive operations
const auditLog = (action, userId, details) => {
    logger.info({
        type: 'audit',
        action,
        userId,
        details,
        timestamp: new Date().toISOString()
    });
};

// Error logging
const errorLog = (error, req = null) => {
    const errorDetails = {
        type: 'error',
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
    };

    if (req) {
        errorDetails.request = {
            method: req.method,
            url: req.url,
            ip: req.ip,
            user: req.user ? req.user._id : null
        };
    }

    logger.error(errorDetails);
};

module.exports = {
    logger,
    loggingMiddleware,
    auditLog,
    errorLog
}; 