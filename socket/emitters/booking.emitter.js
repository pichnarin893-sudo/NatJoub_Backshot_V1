class BookingEmitter {

    notifyBookingCreated(io, roomId, booking, senderSocketId = null) {
        const event = {
            event: 'booking_created',
            success: true,
            message: 'New booking created',
            data: {
                id: booking.id,
                room_id: booking.room_id,
                start_time: booking.start_time,
                end_time: booking.end_time,
                status: booking.status,
                customer: booking.customer,
                room: booking.room
            },
            timestamp: new Date().toISOString()
        };

        console.log(`[Emitter] 📡 Emitting booking:created to room:${roomId}`);
        console.log(`[Emitter] 📦 Event data:`, JSON.stringify(event, null, 2));

        if (senderSocketId) {
            io.to(`room:${roomId}`).except(senderSocketId).emit('booking:created', event);
        } else {
            io.to(`room:${roomId}`).emit('booking:created', event);
        }
    }
    notifyBookingCancelled(io, roomId, bookingId, refundInfo = null, senderSocketId = null) {
        const event = {
            event: 'booking_cancelled',
            success: true,
            message: 'Booking cancelled successfully',
            data: {
                bookingId,
                roomId,
                refund_percentage: refundInfo?.refund_percentage || null,
                refund_amount: refundInfo?.refund_amount || null
            },
            timestamp: new Date().toISOString()
        };

        console.log(`[Emitter] 📡 Emitting booking:cancelled to room:${roomId}`);
        console.log(`[Emitter] 📦 Event data:`, JSON.stringify(event, null, 2));

        if (senderSocketId) {
            io.to(`room:${roomId}`).except(senderSocketId).emit('booking:cancelled', event);
        } else {
            io.to(`room:${roomId}`).emit('booking:cancelled', event);
        }
    }
}

module.exports = new BookingEmitter();