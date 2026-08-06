"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLog = auditLog;
const prisma_1 = require("../config/prisma");
function auditLog(action, targetResource) {
    return async (req, res, next) => {
        res.on('finish', async () => {
            if (res.statusCode >= 200 && res.statusCode < 400) {
                try {
                    await prisma_1.prisma.auditLog.create({
                        data: {
                            userId: req.user?.userId || null,
                            userEmail: req.user?.email || 'Anonymous',
                            action,
                            targetResource,
                            details: JSON.stringify({ body: req.body, query: req.query, params: req.params }),
                            ipAddress: req.ip || req.socket.remoteAddress || '127.0.0.1',
                        },
                    });
                }
                catch (err) {
                    // Silent catch for audit log non-blocking write
                }
            }
        });
        next();
    };
}
