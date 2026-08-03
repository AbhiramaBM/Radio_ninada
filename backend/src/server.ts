import http from 'http';
import app from './app';
import { config } from './config/index';
import { logger } from './utils/logger';
import { initSocket } from './socket/index';

const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

server.listen(config.port, () => {
  logger.info(`🚀 Radio Ninada Backend Server running on port ${config.port} [${config.nodeEnv}]`);
  logger.info(`📡 Health Check available at: http://localhost:${config.port}/api/health`);
});
