const { bookings, rooms, branches, users, promotions, payments, sequelize, room_promotions, branch_promotions, user_promo_code_track, user_cancellation_stats  } = require('../../../../models');
const { Op } = require('sequelize');
const moment = require('moment-timezone');
const refundUtil = require('../../../../utils/refund.util');
const paymentUtil = require('../../../../utils/payment.util');

class BookingController {

    async createBooking(bookingData) {
        //here i change const to let, so we can apply modify the promotion value
        let {
            userId,
            roomId,
            startTime,
            endTime,
            promo_code = null,
          
        } = bookingData;

        const transaction = await sequelize.transaction();

        try {
            if (!userId ||!roomId || !startTime || !endTime) {
                throw new Error('Missing required fields');
            }

            // ✅ Parse input times as Cambodia timezone explicitly
            // Input format: "2025-12-19 6:30:00" or "2025-12-19T14:00:00.000Z"
            // Strip timezone info and treat as Cambodia local time
            const cambodiaTimezone = 'Asia/Phnom_Penh';

            // Remove timezone indicators (Z, +XX:XX, -XX:XX) to force local interpretation
            const cleanStartTime = startTime.replace(/Z|([+-]\d{2}:\d{2})$/, '');
            const cleanEndTime = endTime.replace(/Z|([+-]\d{2}:\d{2})$/, '');

            // Parse as Cambodia local time
            const start = moment.tz(cleanStartTime, cambodiaTimezone).toDate();
            const end = moment.tz(cleanEndTime, cambodiaTimezone).toDate();

            console.log('[BookingController] 🕐 Received times:');
            console.log('  Input start:', startTime);
            console.log('  Input end:', endTime);
            console.log('  Parsed start (UTC):', start.toISOString());
            console.log('  Parsed end (UTC):', end.toISOString());
            console.log('  Start (Cambodia display):', start.toLocaleString('en-US', {timeZone: cambodiaTimezone}));
            console.log('  End (Cambodia display):', end.toLocaleString('en-US', {timeZone: cambodiaTimezone}));

            if (start >= end) {
                throw new Error('Start time must be before end time');
            }

            // Compare with current time
            const now = new Date();
            if (start < now) {
                throw new Error('Cannot book in the past');
            }

            // Get room and branch
            const room = await rooms.findByPk(roomId, {
                include: [{
                    model: branches,
                    as: 'branch',
                    attributes: ['id', 'branch_name', 'work_days', 'open_times', 'close_times', 'is_active']
                }],
                transaction
            });

            if (!room) throw new Error('Room not found');
            if (!room.is_available) throw new Error('Room is not available');
            if (!room.branch.is_active) throw new Error('Branch is not active');

            // Validate branch hours (using Cambodia time for validation)
            this._validateBranchHours(start, end, room.branch);

            // Check for overlaps
            const hasOverlap = await this._checkOverlap(roomId, start, end, null, transaction);
            if (hasOverlap) throw new Error('Time slot is already booked');

            // Calculate price
            const durationHours = (end - start) / (1000 * 60 * 60);
            let totalPrice = room.price_per_hour * durationHours;

            /**
             * Part: Promotion logic
             * Disclaimer: I find the highest promotion and apply only 1 (no stack promotion)
             */

            let appliedPromotionId = null;
            let bestDiscountPercent = 0;

            // 1. Room promotion (auto apply)
            const roomPromotion = await room_promotions.findOne({
                where: {room_id: roomId},
                include: [{
                    model: promotions,
                    as: 'promotion',
                    where: {
                        is_active: true,
                        target_type: 'room',
                        promo_code: null,
                        start_date: {[Op.lte]: start},
                        end_date: {[Op.gte]: end}
                    }
                }],
                transaction
            });

            if (roomPromotion?.promotion) {
                bestDiscountPercent = Number(roomPromotion.promotion.discount_percent);
                appliedPromotionId = roomPromotion.promotion.id;
            }

            // 2. Branch promotion (auto apply)
            
            const branchPromotion = await branch_promotions.findOne({
            where: {branch_id: room.branch_id},
            include: [{
                model: promotions,
                as: 'promotion',
                where: {
                    is_active: true,
                    target_type: 'branch',   // must be branch type
                    promo_code: null,        // exclude promo code promotions
                    start_date: {[Op.lte]: start},
                    end_date: {[Op.gte]: end}
                }
            }],
                transaction
            });

            if (branchPromotion && Number(branchPromotion.promotion.discount_percent) > bestDiscountPercent) {
                bestDiscountPercent = Number(branchPromotion.promotion.discount_percent);
                appliedPromotionId = branchPromotion.promotion.id;
            }


            console.log("My promo code: ", promo_code);
            console.log("user id: ", userId);
            console.log("branch_promotion: ", branchPromotion);

            // 3. Promo code (manual)
            if (promo_code) {
                const promoCodePromotion = await promotions.findOne({
                    where: {
                        promo_code,
                        is_active: true,
                        target_type: 'global',
                        start_date: {[Op.lte]: start},
                        end_date: {[Op.gte]: end}
                    },
                    transaction
                });

                if (!promoCodePromotion) {
                    throw new Error("Invalid or expired promo code");
                }

                // Check if user already used this promo code
                const usageCount = await user_promo_code_track.count({
                    where: {
                        user_id: userId,
                        promotion_id: promoCodePromotion.id
                    },
                    transaction
                });

                if (usageCount >= promoCodePromotion.per_user_limit) {
                    throw new Error("You have already used this promo code");
                }

                if (promoCodePromotion.discount_percent > bestDiscountPercent) {
                    bestDiscountPercent = Number(promoCodePromotion.discount_percent);
                    appliedPromotionId = promoCodePromotion.id;
                }
                
                // store user history of using promo code 
                await user_promo_code_track.create({
                    user_id : userId,
                    promotion_id : appliedPromotionId
                },{transaction});

            }

            // 4. Apply the best discount
            totalPrice = totalPrice - (totalPrice * bestDiscountPercent / 100);

            /**
             * End of promotion logic
             */

          
const booking = await bookings.create({
    customer_id: userId,
    room_id: roomId,
    start_time: new Date(start), // Parse ISO string as UTC Date object
    end_time: new Date(end),     // Parse ISO string as UTC Date object
    total_price: totalPrice.toFixed(3),
    promotion_id: appliedPromotionId,
    status: 'pending'
}, { transaction });

console.log('[BookingController] ✅ Booking created:');
console.log('  ID:', booking.id);
console.log('  Start stored (UTC):', booking.start_time.toISOString());
console.log('  End stored (UTC):', booking.end_time.toISOString());


            await transaction.commit();
            return await this.getBookingById(booking.id);

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async getBookingById(bookingId) {
        return await bookings.findByPk(bookingId, {
            include: [
                {
                    model: users,
                    as: 'customer',
                    attributes: ['id', 'first_name', 'last_name']
                },
                {
                    model: rooms,
                    as: 'room',
                    attributes: ['id', 'room_no', 'people_capacity', 'price_per_hour'],
                    include: [{
                        model: branches,
                        as: 'branch',
                        attributes: ['id', 'branch_name', 'address']
                    }]
                },
                {
                    model: promotions,
                    as: 'promotion',
                    attributes: ['id', 'title', 'discount_percent','target_type']
                }
            ]
        });
    }

    async requestCancellation(bookingId, userId, cancellationReason = null) {
        const transaction = await sequelize.transaction();
        try {
            // Fetch booking with payment and room information
            const booking = await bookings.findByPk(bookingId, {
                include: [{
                    model: payments,
                    as: 'payment'
                }, {
                    model: promotions,
                    as: 'promotion'
                }, {
                    model: rooms,
                    as: 'room',
                    include: [{
                        model: branches,
                        as: 'branch',
                        attributes: ['id', 'owner_id', 'branch_name']
                    }]
                }],
                transaction
            });

            if (!booking) throw new Error('Booking not found');

            // Check if already has a pending cancellation request
            if (booking.status === 'cancellation_requested') {
                throw new Error('Cancellation request already pending');
            }

            // Validate cancellation is allowed
            const validation = refundUtil.validateCancellation(booking);
            if (!validation.allowed) {
                throw new Error(validation.reason);
            }

            // Calculate refund (but don't process yet)
            const refundCalc = refundUtil.calculateRefundPercentage(booking.start_time);
            const refundAmounts = refundUtil.calculateRefundAmount(
                parseFloat(booking.total_price),
                refundCalc.percentage
            );

            const requestedAt = new Date();

            console.log(`Cancellation request for booking ${bookingId}:`, {
                hoursUntilCheckIn: refundCalc.hoursUntilCheckIn,
                refundPercentage: refundCalc.percentage,
                baseRefund: refundAmounts.refundAmount,
                gatewayFee: refundAmounts.gatewayFee,
                totalRefund: refundAmounts.totalRefund
            });

            // Update booking status to cancellation_requested
            await booking.update({
                status: 'cancellation_requested',
                refund_percentage: refundCalc.percentage,
                cancellation_reason: cancellationReason,
                cancellation_requested_at: requestedAt,
                cancelled_by: userId
            }, { transaction });

            await transaction.commit();

            // Return updated booking with calculated refund info
            const updatedBooking = await this.getBookingById(bookingId);
            return {
                ...updatedBooking.toJSON(),
                refund_estimate: {
                    percentage: refundCalc.percentage,
                    base_refund: refundAmounts.refundAmount,
                    gateway_fee: refundAmounts.gatewayFee,
                    total_refund: refundAmounts.totalRefund
                },
                owner_id: booking.room.branch.owner_id
            };

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async approveCancellation(bookingId, ownerId) {
        const transaction = await sequelize.transaction();
        try {
            // Fetch booking with all related data
            const booking = await bookings.findByPk(bookingId, {
                include: [{
                    model: payments,
                    as: 'payment'
                }, {
                    model: promotions,
                    as: 'promotion'
                }, {
                    model: rooms,
                    as: 'room',
                    include: [{
                        model: branches,
                        as: 'branch',
                        attributes: ['id', 'owner_id']
                    }]
                }],
                transaction
            });

            if (!booking) throw new Error('Booking not found');

            // Verify owner owns this booking's branch
            if (booking.room.branch.owner_id !== ownerId) {
                throw new Error('Unauthorized: You can only approve cancellations for your own properties');
            }

            // Verify status is cancellation_requested
            if (booking.status !== 'cancellation_requested') {
                throw new Error('No pending cancellation request for this booking');
            }

            // Process the cancellation
            const refundAmounts = refundUtil.calculateRefundAmount(
                parseFloat(booking.total_price),
                parseFloat(booking.refund_percentage)
            );

            // Update booking status to cancelled
            await booking.update({
                status: 'cancelled',
                cancelled_at: new Date()
            }, { transaction });

            // Process refund if payment was completed
            let refundResult = null;
            if (booking.payment && booking.payment.payment_status === 'completed') {
                refundResult = await paymentUtil.refundPayment(
                    booking.payment.transaction_id,
                    refundAmounts.totalRefund,
                    refundAmounts.gatewayFee
                );

                if (!refundResult.success) {
                    await transaction.rollback();
                    throw new Error(`Refund failed: ${refundResult.error}`);
                }
            }

            // Restore promo code usage if applicable
            if (booking.promotion_id && booking.promotion && booking.promotion.promo_code) {
                await user_promo_code_track.destroy({
                    where: {
                        user_id: booking.customer_id,
                        promotion_id: booking.promotion_id
                    },
                    transaction
                });

                console.log(`Restored promo code usage for promotion ${booking.promotion_id}`);
            }

            // Update user cancellation statistics
            await this._updateCancellationStats(booking.customer_id, transaction);

            await transaction.commit();

            // Return updated booking with refund info
            const updatedBooking = await this.getBookingById(bookingId);
            return {
                ...updatedBooking.toJSON(),
                refund: refundResult ? refundResult.data : null,
                refund_details: {
                    percentage: booking.refund_percentage,
                    base_refund: refundAmounts.refundAmount,
                    gateway_fee: refundAmounts.gatewayFee,
                    total_refund: refundAmounts.totalRefund
                }
            };

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async rejectCancellation(bookingId, ownerId, rejectionReason = null) {
        const transaction = await sequelize.transaction();
        try {
            // Fetch booking
            const booking = await bookings.findByPk(bookingId, {
                include: [{
                    model: rooms,
                    as: 'room',
                    include: [{
                        model: branches,
                        as: 'branch',
                        attributes: ['id', 'owner_id']
                    }]
                }],
                transaction
            });

            if (!booking) throw new Error('Booking not found');

            // Verify owner owns this booking's branch
            if (booking.room.branch.owner_id !== ownerId) {
                throw new Error('Unauthorized: You can only reject cancellations for your own properties');
            }

            // Verify status is cancellation_requested
            if (booking.status !== 'cancellation_requested') {
                throw new Error('No pending cancellation request for this booking');
            }

            // Revert to completed status
            await booking.update({
                status: 'completed',
                cancellation_reason: rejectionReason ? `REJECTED: ${rejectionReason}` : 'REJECTED',
                cancellation_requested_at: null,
                refund_percentage: null,
                cancelled_by: null
            }, { transaction });

            await transaction.commit();

            return await this.getBookingById(bookingId);

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async getPendingCancellationRequests(ownerId) {
        try {
            return await bookings.findAll({
                where: {
                    status: 'cancellation_requested'
                },
                include: [
                    {
                        model: users,
                        as: 'customer',
                        attributes: ['id', 'first_name', 'last_name']
                    },
                    {
                        model: rooms,
                        as: 'room',
                        include: [{
                            model: branches,
                            as: 'branch',
                            where: {owner_id: ownerId},
                            attributes: ['id', 'branch_name', 'owner_id']
                        }]
                    },
                    {
                        model: promotions,
                        as: 'promotion',
                        attributes: ['id', 'title', 'discount_percent']
                    }
                ],
                order: [['cancellation_requested_at', 'ASC']]
            });

        } catch (error) {
            console.error('Error fetching pending cancellation requests:', error);
            throw error;
        }
    }

    async cancelBooking(bookingId, userId, userRole = 'customer') {
        const transaction = await sequelize.transaction();
        try {
            // Fetch booking with related data
            const booking = await bookings.findByPk(bookingId, {
                include: [
                    {
                        model: payments,
                        as: 'payment'
                    },
                    {
                        model: promotions,
                        as: 'promotion'
                    },
                    {
                        model: rooms,
                        as: 'room',
                        include: [{
                            model: branches,
                            as: 'branch',
                            attributes: ['id', 'owner_id']
                        }]
                    }
                ],
                transaction
            });

            if (!booking) throw new Error('Booking not found');

            // Authorization check
            const isOwner = booking.room?.branch?.owner_id === userId;
            const isCustomer = booking.customer_id === userId;
            const isAdmin = userRole === 'admin';

            if (!isOwner && !isCustomer && !isAdmin) {
                throw new Error('Unauthorized: You cannot cancel this booking');
            }

            // Check if booking can be cancelled
            if (booking.status === 'cancelled' || booking.status === 'expired') {
                throw new Error('Booking is already cancelled');
            }

            if (booking.status === 'completed') {
                throw new Error('Cannot cancel a completed booking');
            }

            // For pending bookings, allow direct cancellation (no refund needed)
            if (booking.status === 'pending') {
                await booking.update({
                    status: 'cancelled',
                    cancelled_at: new Date(),
                    cancelled_by: userId,
                    cancellation_reason: 'Cancelled by user'
                }, { transaction });

                // Restore promo code usage if applicable
                if (booking.promotion_id && booking.promotion && booking.promotion.promo_code) {
                    await user_promo_code_track.destroy({
                        where: {
                            user_id: booking.customer_id,
                            promotion_id: booking.promotion_id
                        },
                        transaction
                    });

                    console.log(`Restored promo code usage for promotion ${booking.promotion_id}`);
                }

                await transaction.commit();
                return await this.getBookingById(bookingId);
            }

            // For confirmed bookings, use the request cancellation workflow
            throw new Error('Use the cancellation request workflow for confirmed bookings');

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async _updateCancellationStats(userId, transaction = null) {
        try {
            // Get or create user cancellation stats
            let stats = await user_cancellation_stats.findOne({
                where: { user_id: userId },
                transaction
            });

            if (!stats) {
                stats = await user_cancellation_stats.create({
                    user_id: userId,
                    total_bookings: 0,
                    total_cancellations: 0,
                    cancellation_rate: 0,
                    is_flagged: false
                }, { transaction });
            }

            // Count total bookings and cancellations
            const totalBookings = await bookings.count({
                where: { customer_id: userId },
                transaction
            });

            const totalCancellations = await bookings.count({
                where: {
                    customer_id: userId,
                    status: 'refunded'
                },
                transaction
            });

            // Calculate cancellation rate and flag status
            const abuseCheck = refundUtil.shouldFlagUserForAbuse(totalBookings, totalCancellations);

            // Update stats
            await stats.update({
                total_bookings: totalBookings,
                total_cancellations: totalCancellations,
                cancellation_rate: abuseCheck.rate,
                is_flagged: abuseCheck.shouldFlag,
                last_cancellation_at: new Date()
            }, { transaction });

            if (abuseCheck.shouldFlag) {
                console.warn(`⚠️  User ${userId} flagged for high cancellation rate: ${abuseCheck.rate}%`);
            }

            return stats;

        } catch (error) {
            console.error('Error updating cancellation stats:', error);
            throw error;
        }
    }

    async getUserBookings(userId, options = {}) {
        const {status, limit = 50} = options;
        const whereClause = {customer_id: userId};
        if (status) whereClause.status = status;

        return await bookings.findAll({
            where: whereClause,
            include: [
                {
                    model: rooms,
                    as: 'room',
                    include: [{
                        model: branches,
                        as: 'branch',
                        attributes: ['id', 'branch_name', 'address']
                    }]
                },
                {
                    model: promotions,
                    as: 'promotion',
                    attributes: ['id', 'title', 'discount_percent']
                },
                {
                    model: payments,
                    as: 'payment',
                    attributes: [
                        'id',
                        'transaction_id',
                        'amount',
                        'currency',
                        'qr_image',
                        'paid_at',
                        'createdAt'
                    ]
                }
            ],
            order: [['start_time', 'DESC']],
            limit
        });
    }

    async getRoomBookings(roomId, date = null) {
        const whereClause = {
            room_id: roomId,
            // Only show bookings that actually occupy the room
            status: {[Op.notIn]: ['cancelled', 'expired', 'failed']}
        };

        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            whereClause.start_time = {[Op.between]: [startOfDay, endOfDay]};
        }

        return await bookings.findAll({
            where: whereClause,
            include: [{model: users, as: 'customer', attributes: ['id', 'first_name', 'last_name']}],
            order: [['start_time', 'ASC']]
        });
    }

    async getOccupiedRoomBookingTimes(roomId, date, bookingStatus, branchId) {
        try {
            let bookingConditions = {
                status: bookingStatus ? bookingStatus : 'completed'
            }

            // Choose between roomId or branchId filtering
            if (roomId) {
                bookingConditions.room_id = roomId;
            } else if (branchId) {
                // Get all room IDs for this branch
                const branchRooms = await rooms.findAll({
                    where: {branch_id: branchId},
                    attributes: ['id']
                });

                const roomIds = branchRooms.map(room => room.id);

                if (roomIds.length === 0) {
                    throw new Error('No rooms found for this branch');
                }

                bookingConditions.room_id = {
                    [Op.in]: roomIds
                };
            } else {
                throw new Error('Either roomId or branchId must be provided');
            }

            // If date is provided, filter bookings for that specific date
            if (date) {
                const startOfDay = moment(date).startOf('day').toDate();
                const endOfDay = moment(date).endOf('day').toDate();

                bookingConditions.start_time = {
                    [Op.gte]: startOfDay,
                    [Op.lt]: endOfDay
                };
            } else {
                // Show only future and current bookings
                bookingConditions.end_time = {
                    [Op.gte]: new Date()
                };
            }

            // Get all confirmed bookings
            const confirmedBookings = await bookings.findAll({
                where: bookingConditions,
                include: [
                    {
                        model: rooms,
                        as: 'room',
                        attributes: ['id', 'room_no'],
                        include: [
                            {
                                model: branches,
                                as: 'branch',
                                attributes: ['id', 'branch_name']
                            }
                        ]
                    }
                ],
                order: [['start_time', 'ASC']],
                attributes: [
                    'id',
                    'start_time',
                    'end_time',
                    'total_price',
                    'status',
                    'createdAt',
                    'room_id'
                ]
            });

            // Format the booked time slots (now includes room info when branchId is used)
            const bookedTimeSlots = confirmedBookings.map(booking => {
                const startTime = moment(booking.start_time);
                const endTime = moment(booking.end_time);

                return {
                    booking_id: booking.id,
                    room_id: booking.room_id,
                    room_no: booking.room?.room_no,
                    branch_name: booking.room?.branch?.branch_name,
                    time_slot: `${startTime.format('h:mma')} - ${endTime.format('h:mma')}`,
                    start_time: startTime.format('YYYY-MM-DD HH:mm:ss'),
                    end_time: endTime.format('YYYY-MM-DD HH:mm:ss'),
                    duration_hours: moment.duration(endTime.diff(startTime)).asHours(),
                    is_current: moment().isBetween(startTime, endTime)
                };
            });

            return {
                booked_time_slots: bookedTimeSlots,
                note: 'These are completed (paid) bookings. You cannot book during these times.'
            };

        } catch (error) {
            console.error('Error in getOccupiedRoomBookingTimes:', error);
            throw error;
        }
    }

    async _checkOverlap(roomId, startTime, endTime, excludeBookingId = null, transaction = null) {
        const overlappingBookings = await bookings.findAll({
            where: {
                room_id: roomId,
                // Only consider bookings that actually occupy the room
                // Exclude: cancelled, expired (payment timeout), failed (payment failed)
                status: { [Op.notIn]: ['cancelled', 'expired', 'failed'] },
                [Op.or]: [
                    { start_time: { [Op.lte]: startTime }, end_time: { [Op.gt]: startTime } },
                    { start_time: { [Op.lt]: endTime }, end_time: { [Op.gte]: endTime } },
                    { start_time: { [Op.gte]: startTime }, end_time: { [Op.lte]: endTime } }
                ],
                ...(excludeBookingId && { id: { [Op.ne]: excludeBookingId } })
            },
            include: [
                {
                    model: payments,
                    as: 'payment'
                }
            ],
            transaction
        });

        if (overlappingBookings.length === 0) return false;

        const FIVE_MINUTES = 5 * 60 * 1000;
        const now = Date.now();
        let hasValidOverlap = false;

        // Lazy expiration: catch any pending bookings that should be expired
        // but haven't been processed by the cron job yet
        for (const b of overlappingBookings) {
            const createdMs = new Date(b.createdAt).getTime();
            const isExpired = (now - createdMs) > FIVE_MINUTES;

            // Booking is pending AND expired (payment window passed)
            if (b.status === "pending" && isExpired) {
                // Mark as expired (consistent with cron job behavior)
                b.status = "expired";
                b.cancelled_at = new Date();
                b.cancellation_reason = 'Auto-cancelled: Payment not received within 5 minutes of booking creation';
                await b.save({ transaction });

                // Mark payment as expired if exists
                if (b.payment && b.payment.payment_status === "pending") {
                    b.payment.payment_status = "expired";
                    await b.payment.save({ transaction });
                }

                console.log(`[Lazy Expiration] Expired booking ${b.id} during overlap check`);

                // Skip — expired booking should not block room
                continue;
            }

            // Non-expired booking → blocks room
            hasValidOverlap = true;
        }

        return hasValidOverlap;
    }

    _validateBranchHours(startTime, endTime, branch) {
        const cambodiaTimezone = 'Asia/Phnom_Penh';

        // Convert start and end to Cambodia time for validation
        const startLocal = new Date(startTime.toLocaleString('en-US', { timeZone: cambodiaTimezone }));
        const endLocal = new Date(endTime.toLocaleString('en-US', { timeZone: cambodiaTimezone }));

        const dayOfWeek = startLocal.toLocaleDateString('en-US', { weekday: 'long', timeZone: cambodiaTimezone }).toLowerCase();

        if (!branch.work_days.map(d => d.toLowerCase()).includes(dayOfWeek)) {
            throw new Error(`Branch is closed on ${dayOfWeek}`);
        }

        const [openHour, openMin] = branch.open_times.split(':').map(Number);
        const [closeHour, closeMin] = branch.close_times.split(':').map(Number);

        const startMinutes = startLocal.getHours() * 60 + startLocal.getMinutes();
        const endMinutes = endLocal.getHours() * 60 + endLocal.getMinutes();
        const openMinutes = openHour * 60 + openMin;
        const closeMinutes = closeHour * 60 + closeMin;

        if (startMinutes < openMinutes) throw new Error(`Branch opens at ${branch.open_times}`);
        if (endMinutes > closeMinutes) throw new Error(`Branch closes at ${branch.close_times}`);
    }
}
module.exports = new BookingController();
