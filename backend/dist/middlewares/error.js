"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const logger_1 = require("../utils/logger");
function errorHandler(err, req, res, next) {
    logger_1.logger.error(err.stack || err.message || err);
    const statusCode = err.statusCode || err.status || 500;
    const message = err.message || 'Internal Server Error';
    return res.status(statusCode).json({
        success: false,
        message,
        errors: err.errors || null,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
}
