"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
function errorHandler(err, req, res, next) {
    logger_1.logger.error(err.stack || err.message || err);
    if (err instanceof zod_1.ZodError) {
        const errorDetails = err.errors.map((e) => `${e.path.join('.') || 'field'}: ${e.message}`).join('; ');
        return res.status(400).json({
            success: false,
            message: errorDetails || 'Validation error',
            errors: err.flatten().fieldErrors,
        });
    }
    const statusCode = err.statusCode || err.status || 500;
    const message = err.message || 'Internal Server Error';
    return res.status(statusCode).json({
        success: false,
        message,
        errors: err.errors || null,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
}
