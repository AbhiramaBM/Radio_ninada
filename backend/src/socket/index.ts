import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { config } from '../config/index';

let io: Server;
let activeListenersCount = 42;

export function initSocket(server: HttpServer): Server {
  io = new Server(server, {
    cors: {
      origin: config.corsOrigin,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    activeListenersCount += 1;
    io.emit('listener-count-update', { activeListeners: activeListenersCount });

    socket.on('disconnect', () => {
      activeListenersCount = Math.max(10, activeListenersCount - 1);
      io.emit('listener-count-update', { activeListeners: activeListenersCount });
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}
