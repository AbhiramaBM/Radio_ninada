"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = initSocket;
exports.getIO = getIO;
const socket_io_1 = require("socket.io");
const index_1 = require("../config/index");
let io;
let activeListenersCount = 42;
function initSocket(server) {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: index_1.config.corsOrigin,
            methods: ['GET', 'POST'],
        },
    });
    io.on('connection', (socket) => {
        activeListenersCount += 1;
        io.emit('listener-count-update', { activeListeners: activeListenersCount });
        socket.on('disconnect', () => {
            activeListenersCount = Math.max(10, activeListenersCount - 1);
            io.emit('listener-count-update', { activeListeners: activeListenersCount });
        });
    });
    return io;
}
function getIO() {
    if (!io) {
        throw new Error('Socket.IO not initialized');
    }
    return io;
}
