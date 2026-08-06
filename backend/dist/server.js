"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const index_1 = require("./config/index");
const logger_1 = require("./utils/logger");
const index_2 = require("./socket/index");
const server = http_1.default.createServer(app_1.default);
// Initialize Socket.IO
(0, index_2.initSocket)(server);
server.listen(index_1.config.port, () => {
    logger_1.logger.info(`🚀 Radio Ninada Backend Server running on port ${index_1.config.port} [${index_1.config.nodeEnv}]`);
    logger_1.logger.info(`📡 Health Check available at: http://localhost:${index_1.config.port}/api/health`);
});
