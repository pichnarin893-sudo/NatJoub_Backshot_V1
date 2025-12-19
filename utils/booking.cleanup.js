const { bookings, payments, promotions, user_promo_code_track } = require('../models');
const { Op } = require('sequelize');

/**
 * Auto-cancel pending bookings that are 5 minutes past their creation time
 * Business rule: Users have 5 minutes from booking creation to complete payment
 * This prevents rooms from being blocked by unpaid/unconfirmed bookings
 */
async function cancelExpiredPendingBookings() {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    try {
        // Find all pending bookings where createdAt was more than 5 minutes ago
        const expiredBookings = await bookings.findAll({
            where: {
                status: 'pending',
                createdAt: {
                    [Op.lte]: fiveMinutesAgo  // createdAt <= (now - 5 minutes)
                }
            },
            include: [
                {
                    model: payments,
                    as: 'payment'
                },
                {
                    model: promotions,
                    as: 'promotion'
                }
            ]
        });

        if (expiredBookings.length === 0) {
            return { cancelled: 0, details: [] };
        }

        const cancelledDetails = [];

        for (const booking of expiredBookings) {
            const bookingId = booking.id;
            const roomId = booking.room_id;
            const customerId = booking.customer_id;

            // Update booking status to 'expired'
            await booking.update({
                status: 'expired',
                cancelled_at: new Date(),
                cancellation_reason: 'Auto-cancelled: Payment not received within 5 minutes of booking creation'
            });

            // Mark payment as expired if it exists and is still pending
            if (booking.payment && booking.payment.payment_status === 'pending') {
                await booking.payment.update({
                    payment_status: 'expired'
                });
            }

            // Restore promo code usage if a promo code was used
            if (booking.promotion_id && booking.promotion && booking.promotion.promo_code) {
                await user_promo_code_track.destroy({
                    where: {
                        user_id: customerId,
                        promotion_id: booking.promotion_id
                    }
                });

                console.log(`   ↳ Restored promo code usage for user ${customerId}, promotion ${booking.promotion_id}`);
            }

            cancelledDetails.push({
                bookingId,
                roomId,
                customerId,
                startTime: booking.start_time,
                totalPrice: booking.total_price
            });

            console.log(`   ✅ Cancelled booking ${bookingId} (Room: ${roomId}, Start: ${booking.start_time.toISOString()})`);
        }

        return {
            cancelled: expiredBookings.length,
            details: cancelledDetails
        };

    } catch (error) {
        console.error('❌ Error in cancelExpiredPendingBookings:', error);
        throw error;
    }
}

/**
 * Get statistics about pending bookings approaching expiry
 * Useful for monitoring and debugging
 * Expiry = createdAt + 5 minutes
 */
async function getPendingBookingsNearExpiry(minutesFromNow = 10) {
    try {
        const now = Date.now();
        // Expiry time = createdAt + 5 minutes
        // We want: NOW < expiryTime < (NOW + minutesFromNow)
        // Therefore: (NOW - 5min) < createdAt < (NOW + minutesFromNow - 5min)
        const createdAfter = new Date(now - 5 * 60 * 1000);      // Not yet expired
        const createdBefore = new Date(now + (minutesFromNow - 5) * 60 * 1000);  // Will expire within minutesFromNow

        const nearExpiryBookings = await bookings.findAll({
            where: {
                status: 'pending',
                createdAt: {
                    [Op.gt]: createdAfter,   // Created less than 5 minutes ago (not expired yet)
                    [Op.lte]: createdBefore  // Will expire within next minutesFromNow
                }
            },
            order: [['createdAt', 'ASC']],
            limit: 20
        });

        return {
            count: nearExpiryBookings.length,
            bookings: nearExpiryBookings.map(b => {
                const expiryTime = new Date(b.createdAt).getTime() + 5 * 60 * 1000;
                return {
                    id: b.id,
                    roomId: b.room_id,
                    createdAt: b.createdAt,
                    startTime: b.start_time,
                    expiresAt: new Date(expiryTime),
                    minutesUntilExpiry: Math.round((expiryTime - now) / 60000),
                    secondsUntilExpiry: Math.round((expiryTime - now) / 1000)
                };
            })
        };

    } catch (error) {
        console.error('Error in getPendingBookingsNearExpiry:', error);
        throw error;
    }
}

module.exports = {
    cancelExpiredPendingBookings,
    getPendingBookingsNearExpiry
};
