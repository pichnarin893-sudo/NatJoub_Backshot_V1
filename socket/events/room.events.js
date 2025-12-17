const RoomsManager = require('../rooms.manager');

module.exports = (io, socket) => {

    socket.on('room:join', (data) => {
        const { roomId } = data;
        socket.join(`room:${roomId}`);
        RoomsManager.addUser(roomId, socket.user.id);

        socket.emit('room:joined', {
            roomId,
            viewersCount: RoomsManager.getRoomSize(roomId)
        });

        socket.to(`room:${roomId}`).emit('room:userJoined', {
            userId: socket.user.id,
            viewersCount: RoomsManager.getRoomSize(roomId)
        });
    });

    socket.on('room:leave', (data) => {
        const { roomId } = data;
        socket.leave(`room:${roomId}`);
        RoomsManager.removeUser(roomId, socket.user.id);

        socket.emit('room:left', { roomId });

        socket.to(`room:${roomId}`).emit('room:userLeft', {
            userId: socket.user.id,
            viewersCount: RoomsManager.getRoomSize(roomId)
        });
    });
};