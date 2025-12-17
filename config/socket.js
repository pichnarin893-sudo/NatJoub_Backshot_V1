const { Server } = require('socket.io');
const socketAuth = require('../middlewares/socket.auth.middleware');
const socketHandler = require('../socket/socket.handler');

function initializeSocket(server) {
    const io = new Server(server, {
        cors: {
            origin: process.env.SOCKET_IO_URL || '*',
            methods: ['GET', 'POST'],
            credentials: true,
            allowedHeaders: ['Authorization']

        },
        pingTimeout: 60000,
        pingInterval: 25000,
        transports: ['websocket', 'polling']
    });

    // Authentication middleware
    io.use(socketAuth);

    // Handle connections
    io.on('connection', (socket) => {
        console.log('✅ Client connected:', socket.id);
        console.log('   User:', socket.user.id, `(${socket.user.role})`);

        socketHandler(io, socket);

        socket.on('disconnect', (reason) => {
            console.log('❌ Client disconnected:', socket.id, '-', reason);
        });
    });

    console.log('🔌 Socket.IO initialized successfully');
    return io;
}

module.exports = { initializeSocket };