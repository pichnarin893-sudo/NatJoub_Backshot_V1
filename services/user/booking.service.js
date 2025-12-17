const bookingController = require('../../controllers/api/v1/user/booking.controller');
const availabilityController = require('../../controllers/api/v1/user/availability.controller');
const BookingEmitter = require('../../socket/emitters/booking.emitter');
const { errorResponse, successResponse } = require("../../controllers/api/v1/baseApi.controller");
const paymentUtil = require('../../utils/payment.util');

async function createBooking(req, res) {
    try {
        const { roomId, startTime, endTime, promo_code } = req.body;

        if (!roomId || !startTime || !endTime) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Create booking with pending status
        const booking = await bookingController.createBooking({
            userId: req.user.id,
            roomId,
            startTime,
            endTime,
            promo_code
        });

        // Generate payment QR automatically
        let paymentData = null;
        try {
            const paymentResult = await paymentUtil.processPayment(booking, req.user.id);

            if (paymentResult.success) {
                paymentData = paymentResult.data;
            }
        } catch (paymentError) {
            console.error('Payment generation error:', paymentError);
            // Continue even if payment fails - user can retry later
        }

        // Emit booking created event
        const io = req.app.get('io');
        if (io) {
            console.log(`[HTTP] 📤 Broadcasting booking:created to room: ${roomId}`);
            BookingEmitter.notifyBookingCreated(io, roomId, booking);
        }

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            data: {
                booking,
                payment: paymentData
            }
        });
    } catch (error) {
        console.error('Create booking error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

async function verifyPayment(req, res) {
    try {
        const { transactionId } = req.params;

        if (!transactionId) {
            return res.status(400).json({
                success: false,
                message: 'Transaction ID is required'
            });
        }

        // Verify and update payment status
        const result = await paymentUtil.verifyAndUpdatePayment(transactionId);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.error || 'Payment verification failed'
            });
        }

        // If payment was already processed
        if (result.alreadyProcessed) {
            return res.json({
                success: true,
                message: 'Payment already processed',
                data: result.data
            });
        }

        // If payment successful, emit booking confirmed event
        if (result.data.bookingStatus === 'confirmed') {
            const payment = await paymentUtil.getPaymentByTransactionId(transactionId);

            if (payment.success && payment.data.booking) {
                const io = req.app.get('io');
                if (io) {
                    io.to(`room:${payment.data.booking.room_id}`).emit('booking:confirmed', {
                        bookingId: payment.data.booking_id,
                        roomId: payment.data.booking.room_id,
                        status: 'confirmed'
                    });
                }
            }
        }

        res.json({
            success: true,
            message: 'Payment verified successfully',
            data: result.data
        });

    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

async function getPaymentHistory(req, res) {
    try {
        const { bookingId } = req.params;

        if (!bookingId) {
            return res.status(400).json({
                success: false,
                message: 'Booking ID is required'
            });
        }

        const result = await paymentUtil.getPaymentHistory(bookingId);

        if (!result.success) {
            return res.status(404).json({
                success: false,
                message: 'Payment history not found'
            });
        }

        res.json({
            success: true,
            count: result.data.length,
            data: result.data
        });

    } catch (error) {
        console.error('Get payment history error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

async function getPaymentStatus(req, res) {
    try {
        const { transactionId } = req.params;

        if (!transactionId) {
            return res.status(400).json({
                success: false,
                message: 'Transaction ID is required'
            });
        }

        const result = await paymentUtil.getPaymentByTransactionId(transactionId);

        if (!result.success) {
            return res.status(404).json({
                success: false,
                message: result.error || 'Payment not found'
            });
        }

        res.json({
            success: true,
            data: {
                paymentId: result.data.id,
                transactionId: result.data.transaction_id,
                paymentStatus: result.data.payment_status,
                paymentStatusCode: result.data.payment_status_code,
                amount: result.data.amount,
                currency: result.data.currency,
                paidAt: result.data.paid_at,
                transactionDate: result.data.transaction_date,
                apv: result.data.apv,
                refundAmount: result.data.refund_amount,
                bookingId: result.data.booking_id,
                bookingStatus: result.data.booking ? result.data.booking.status : null
            }
        });

    } catch (error) {
        console.error('Get payment status error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

async function getRoomAvailability(req, res) {
    try {
        const { roomId } = req.params;
        const { date } = req.query;
        const availability = await availabilityController.getAvailability(roomId, date);
        res.json({ success: true, data: availability });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

async function checkTimeSlot(req, res) {
    try {
        const { roomId, startTime, endTime } = req.body;
        const result = await availabilityController.checkTimeSlotAvailability(roomId, startTime, endTime);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

async function getMyBookings(req, res) {
    try {
        const { status, limit } = req.query;
        const userId = req.user.id;
        const bookings = await bookingController.getUserBookings(userId, { status, limit });
        res.json({ success: true, count: bookings.length, data: bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

async function requestCancellation(req, res) {
    try {
        const { id } = req.params;
        const { cancellation_reason } = req.body;

        const booking = await bookingController.requestCancellation(
            id,
            req.user.id,
            req.user.role,
            cancellation_reason
        );

        const io = req.app.get('io');
        if (io) {
            // Notify owner of new cancellation request
            io.to(`user:${booking.owner_id}`).emit('cancellation:requested', {
                success: true,
                message: 'New cancellation request received',
                data: {
                    bookingId: id,
                    roomId: booking.room_id,
                    customerId: req.user.id,
                    customerName: `${req.user.first_name} ${req.user.last_name}`,
                    refund_estimate: booking.refund_estimate,
                    cancellation_reason: cancellation_reason
                },
                timestamp: new Date().toISOString()
            });
        }

        res.json({
            success: true,
            message: 'Cancellation request submitted successfully. Waiting for owner approval.',
            data: booking
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

async function approveCancellation(req, res) {
    try {
        const { id } = req.params;

        const booking = await bookingController.approveCancellation(id, req.user.id);

        const io = req.app.get('io');
        if (io) {
            // Notify customer that cancellation was approved
            io.to(`user:${booking.customer_id}`).emit('cancellation:approved', {
                success: true,
                message: 'Your cancellation request was approved',
                data: {
                    bookingId: id,
                    roomId: booking.room_id,
                    refund_details: booking.refund_details
                },
                timestamp: new Date().toISOString()
            });

            // Notify room availability change
            BookingEmitter.notifyBookingCancelled(io, booking.room_id, id, {
                refund_percentage: booking.refund_details?.percentage,
                refund_amount: booking.refund_details?.total_refund
            });
        }

        res.json({
            success: true,
            message: 'Cancellation approved and refund processed',
            data: booking
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

async function rejectCancellation(req, res) {
    try {
        const { id } = req.params;
        const { rejection_reason } = req.body;

        const booking = await bookingController.rejectCancellation(id, req.user.id, rejection_reason);

        const io = req.app.get('io');
        if (io) {
            // Notify customer that cancellation was rejected
            io.to(`user:${booking.customer_id}`).emit('cancellation:rejected', {
                success: true,
                message: 'Your cancellation request was rejected',
                data: {
                    bookingId: id,
                    roomId: booking.room_id,
                    rejection_reason: rejection_reason
                },
                timestamp: new Date().toISOString()
            });
        }

        res.json({
            success: true,
            message: 'Cancellation request rejected',
            data: booking
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

async function getPendingCancellationRequests(req, res) {
    try {
        const requests = await bookingController.getPendingCancellationRequests(req.user.id);

        res.json({
            success: true,
            count: requests.length,
            data: requests
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

async function updateBookingStatus(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['confirmed', 'cancelled'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const booking = await bookingController.getBookingById(id);
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Not found' });
        }

        await booking.update({ status });

        const io = req.app.get('io');
        if (io) {
            io.to(`room:${booking.room_id}`).emit('booking:statusUpdated', {
                bookingId: id,
                status,
                roomId: booking.room_id
            });
        }

        res.json({ success: true, data: { id, status } });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

async function getOccupiedRoomBookingTimes(req, res) {
    try {
        const { roomId, date, bookingStatus, branchId } = req.query;
        const occupiedTimes = await bookingController.getOccupiedRoomBookingTimes(roomId, date, bookingStatus, branchId);
        return successResponse(res, occupiedTimes, 'Occupied room booking times retrieved successfully');

    } catch (error) {
        console.error('getOccupiedRoomBookingTimes error:', error);
        return errorResponse(res, error.message || 'Failed to fetch occupied room bookings', 500);
    }
}

module.exports = {
    createBooking,
    verifyPayment,
    getPaymentHistory,
    getPaymentStatus,
    getRoomAvailability,
    checkTimeSlot,
    getMyBookings,
    requestCancellation,
    approveCancellation,
    rejectCancellation,
    getPendingCancellationRequests,
    updateBookingStatus,
    getOccupiedRoomBookingTimes
};