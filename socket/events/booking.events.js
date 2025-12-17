const bookingController = require('../../controllers/api/v1/user/booking.controller');
const availabilityController = require('../../controllers/api/v1/user/availability.controller');
const BookingEmitter = require('../emitters/booking.emitter');

module.exports = (io, socket) => {

    socket.on('booking:create', async (data) => {
        try {
            const { roomId, startTime, endTime, promotionId } = data;

            const booking = await bookingController.createBooking({
                userId: socket.user.id,
                roomId,
                startTime,
                endTime,
                promotionId
            });

            socket.emit('booking:created', { success: true, booking });
            BookingEmitter.notifyBookingCreated(io, roomId, booking, socket.id);

        } catch (error) {
            socket.emit('booking:error', { message: error.message });
        }
    });

    socket.on('booking:cancel', async (data) => {
        try {
            const { bookingId, roomId } = data;
            await bookingController.cancelBooking(bookingId, socket.user.id, socket.user.role);

            socket.emit('booking:cancelled', { success: true, bookingId });
            BookingEmitter.notifyBookingCancelled(io, roomId, bookingId, socket.id);

        } catch (error) {
            socket.emit('booking:error', { message: error.message });
        }
    });

    socket.on('booking:getAvailability', async (data) => {
        try {
            const { roomId, date } = data;
            const availability = await availabilityController.getAvailability(roomId, date);
            socket.emit('booking:availability', availability);
        } catch (error) {
            socket.emit('booking:error', { message: error.message });
        }
    });
};