"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const contact_controller_1 = require("../controllers/contact.controller");
const auth_1 = require("../middlewares/auth");
const audit_1 = require("../middlewares/audit");
const router = (0, express_1.Router)();
// Public submission
router.post('/', contact_controller_1.submitContactMessage);
// Admin listing & status update
router.get('/', auth_1.authenticate, (0, auth_1.requireRole)(['SUPER_ADMIN', 'ADMIN']), contact_controller_1.listContactMessages);
router.patch('/:id', auth_1.authenticate, (0, auth_1.requireRole)(['SUPER_ADMIN', 'ADMIN']), (0, audit_1.auditLog)('UPDATE', 'ContactMessage'), contact_controller_1.updateContactMessageStatus);
exports.default = router;
