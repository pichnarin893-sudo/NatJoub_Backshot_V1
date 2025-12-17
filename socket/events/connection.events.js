module.exports = (io, socket) => {

    socket.emit('connection:established', {
        userId: socket.user.id,
        email: socket.user.email,
        role: socket.user.role,
        firstName: socket.user.firstName,
        lastName: socket.user.lastName
    });

    socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
    });
};