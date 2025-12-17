'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
    async up(queryInterface, Sequelize) {
        const now = new Date();

        // Room data with hourly prices
        const rooms = [
            { id: "11111111-1111-1111-1111-111111111111", hourlyPrice: 50.000 },
            { id: "11111111-1111-1111-1111-111111111112", hourlyPrice: 100.000 },
            { id: "11111111-1111-1111-1111-111111111113", hourlyPrice: 150.000 },
            { id: "22222222-2222-2222-2222-222222222221", hourlyPrice: 50.000 },
            { id: "22222222-2222-2222-2222-222222222222", hourlyPrice: 100.000 },
            { id: "22222222-2222-2222-2222-222222222223", hourlyPrice: 150.000 },
            { id: "33333333-3333-3333-3333-333333333331", hourlyPrice: 50.000 },
            { id: "33333333-3333-3333-3333-333333333332", hourlyPrice: 100.000 },
            { id: "33333333-3333-3333-3333-333333333333", hourlyPrice: 150.000 },
            { id: "44444444-4444-4444-4444-444444444441", hourlyPrice: 50.000 },
            { id: "44444444-4444-4444-4444-444444444442", hourlyPrice: 100.000 },
            { id: "44444444-4444-4444-4444-444444444443", hourlyPrice: 150.000 },
            { id: "55555555-5555-5555-5555-555555555551", hourlyPrice: 50.000 },
            { id: "55555555-5555-5555-5555-555555555552", hourlyPrice: 100.000 },
            { id: "55555555-5555-5555-5555-555555555553", hourlyPrice: 150.000 },
            { id: "66666666-6666-6666-6666-666666666661", hourlyPrice: 50.000 },
            { id: "66666666-6666-6666-6666-666666666662", hourlyPrice: 100.000 },
            { id: "66666666-6666-6666-6666-666666666663", hourlyPrice: 150.000 },
            { id: "77777777-7777-7777-7777-777777777771", hourlyPrice: 50.000 },
            { id: "77777777-7777-7777-7777-777777777772", hourlyPrice: 100.000 },
            { id: "77777777-7777-7777-7777-777777777773", hourlyPrice: 150.000 },
            { id: "88888888-8888-8888-8888-888888888881", hourlyPrice: 50.000 },
            { id: "88888888-8888-8888-8888-888888888882", hourlyPrice: 100.000 },
            { id: "88888888-8888-8888-8888-888888888883", hourlyPrice: 150.000 },
            { id: "99999999-9999-9999-9999-999999999991", hourlyPrice: 50.000 },
            { id: "99999999-9999-9999-9999-999999999992", hourlyPrice: 100.000 },
            { id: "99999999-9999-9999-9999-999999999993", hourlyPrice: 150.000 },
            { id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1", hourlyPrice: 50.000 },
            { id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2", hourlyPrice: 100.000 },
            { id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3", hourlyPrice: 150.000 },
        ];

        // Customer IDs
        const customers = [
            "123e4501-e89b-12d3-a456-426614174000",
            "123e4502-e89b-12d3-a456-426614174000",
            "123e4503-e89b-12d3-a456-426614174000",
            "123e4504-e89b-12d3-a456-426614174000",
            "123e4505-e89b-12d3-a456-426614174000",
            "123e4506-e89b-12d3-a456-426614174000",
            "123e4507-e89b-12d3-a456-426614174000",
            "123e4508-e89b-12d3-a456-426614174000",
            "123e4509-e89b-12d3-a456-426614174000",
            "123e4010-e89b-12d3-a456-426614174000",
            "123e4011-e89b-12d3-a456-426614174000",
            "123e4012-e89b-12d3-a456-426614174000",
            "123e4013-e89b-12d3-a456-426614174000",
            "123e4014-e89b-12d3-a456-426614174000",
            "123e4015-e89b-12d3-a456-426614174000",
            "123e4016-e89b-12d3-a456-426614174000",
            "123e4017-e89b-12d3-a456-426614174000",
            "123e4018-e89b-12d3-a456-426614174000",
            "123e4019-e89b-12d3-a456-426614174000",
        ];

        // Cancellation reasons
        const cancellationReasons = [
            'Change of plans',
            'Schedule conflict',
            'Found a better option',
            'Personal emergency',
            'Weather conditions',
            'Transportation issues',
            'Meeting cancelled',
            'Budget constraints',
            'Illness',
            'Double booking mistake',
        ];

        // Time slots
        const timeSlots = [
            { start: 8, end: 13 },   // 5 hours
            { start: 9, end: 12 },   // 3 hours
            { start: 10, end: 14 },  // 4 hours
            { start: 13, end: 17 },  // 4 hours
            { start: 14, end: 19 },  // 5 hours
            { start: 15, end: 18 },  // 3 hours
        ];

        /**
         * Booking Status: 'pending', 'completed', 'cancelled', 'failed', 'expired', 'cancellation_requested'
         * Payment Status: 'pending', 'completed', 'failed', 'expired', 'cancelled', 'refunded'

         *  pending                  pending         Waiting for payment
         *  completed                completed       Payment successful, booking valid
         *  cancelled                cancelled       User cancelled before paying
         *  cancelled                refunded        User cancelled after paying (got refund)
         *  failed                   failed          Payment failed (card declined, error)
         *  expired                  expired         Payment timeout (abandoned)
         *  cancellation_requested   completed       User requested cancellation, awaiting approval |
         */

            // Booking status distribution (weighted)
            // 60% completed, 8% pending, 12% cancelled, 5% failed, 5% expired, 10% cancellation_requested
        const getBookingStatus = () => {
                const rand = Math.random();
                if (rand < 0.60) return 'completed';
                if (rand < 0.68) return 'pending';
                if (rand < 0.80) return 'cancelled';
                if (rand < 0.85) return 'failed';
                if (rand < 0.90) return 'expired';
                return 'cancellation_requested';
            };

        // Payment status based on booking status
        const getPaymentStatus = (bookingStatus) => {
            switch (bookingStatus) {
                case 'completed':
                    return 'completed';
                case 'pending':
                    return 'pending';
                case 'cancelled':
                    // 70% were paid then refunded, 30% cancelled before payment
                    return Math.random() < 0.7 ? 'refunded' : 'cancelled';
                case 'failed':
                    return 'failed';
                case 'expired':
                    return 'expired';
                case 'cancellation_requested':
                    // Was paid, now requesting cancellation
                    return 'completed';
                default:
                    return 'pending';
            }
        };

        // Refund percentage options
        const refundPercentages = [100, 75, 50, 25, 0];

        // Generate transaction ID
        const generateTransactionId = () => {
            const timestamp = Date.now().toString(36);
            const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
            return `TXN-${timestamp}-${randomPart}`;
        };

        // Helper functions
        const getRandomCustomer = () => customers[Math.floor(Math.random() * customers.length)];
        const getRandomCancellationReason = () => cancellationReasons[Math.floor(Math.random() * cancellationReasons.length)];
        const getRandomRefundPercentage = () => refundPercentages[Math.floor(Math.random() * refundPercentages.length)];

        const getDateRange = (startDate, endDate) => {
            const dates = [];
            let currentDate = new Date(startDate);
            const end = new Date(endDate);
            while (currentDate <= end) {
                dates.push(new Date(currentDate));
                currentDate.setDate(currentDate.getDate() + 1);
            }
            return dates;
        };

        // Generate bookings and payments
        const bookings = [];
        const payments = [];
        const customerStats = {}; // Track stats per customer

        const startDate = '2025-05-01';
        const endDate = '2025-12-15';
        const dates = getDateRange(startDate, endDate);

        for (const date of dates) {
            for (const room of rooms) {
                const timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];
                const customerId = getRandomCustomer();
                const bookingStatus = getBookingStatus();
                const paymentStatus = getPaymentStatus(bookingStatus);

                // Create start and end datetime
                const startTime = new Date(date);
                startTime.setHours(timeSlot.start, 0, 0, 0);

                const endTime = new Date(date);
                endTime.setHours(timeSlot.end, 0, 0, 0);

                // Calculate duration and price
                const durationHours = timeSlot.end - timeSlot.start;
                const totalPrice = durationHours * room.hourlyPrice;

                // Initialize customer stats if needed
                if (!customerStats[customerId]) {
                    customerStats[customerId] = {
                        total_bookings: 0,
                        total_cancellations: 0,
                        last_cancellation_at: null,
                    };
                }

                // Update customer stats
                customerStats[customerId].total_bookings++;

                const bookingId = uuidv4();
                const bookingCreatedAt = new Date(startTime.getTime() - (Math.random() * 7 * 24 * 60 * 60 * 1000)); // Created 0-7 days before

                // Build booking object
                const booking = {
                    id: bookingId,
                    room_id: room.id,
                    customer_id: customerId,
                    start_time: startTime,
                    end_time: endTime,
                    status: bookingStatus,
                    total_price: totalPrice,
                    promotion_id: null,
                    refund_percentage: null,
                    cancellation_reason: null,
                    cancelled_at: null,
                    cancelled_by: null,
                    cancellation_requested_at: null,
                    createdAt: bookingCreatedAt,
                    updatedAt: bookingCreatedAt,
                };

                // Handle cancelled bookings
                if (bookingStatus === 'cancelled') {
                    const refundPercentage = paymentStatus === 'refunded' ? getRandomRefundPercentage() : null;
                    const cancelledAt = new Date(bookingCreatedAt.getTime() + (Math.random() * 2 * 24 * 60 * 60 * 1000));

                    booking.refund_percentage = refundPercentage;
                    booking.cancellation_reason = getRandomCancellationReason();
                    booking.cancelled_at = cancelledAt;
                    booking.cancelled_by = customerId;
                    booking.cancellation_requested_at = new Date(cancelledAt.getTime() - (Math.random() * 60 * 60 * 1000));
                    booking.updatedAt = cancelledAt;

                    // Update cancellation stats
                    customerStats[customerId].total_cancellations++;
                    if (!customerStats[customerId].last_cancellation_at ||
                        cancelledAt > customerStats[customerId].last_cancellation_at) {
                        customerStats[customerId].last_cancellation_at = cancelledAt;
                    }
                }

                // Handle cancellation_requested bookings
                if (bookingStatus === 'cancellation_requested') {
                    const requestedAt = new Date(bookingCreatedAt.getTime() + (Math.random() * 3 * 24 * 60 * 60 * 1000));
                    booking.cancellation_reason = getRandomCancellationReason();
                    booking.cancellation_requested_at = requestedAt;
                    booking.updatedAt = requestedAt;
                }

                // Handle failed bookings
                if (bookingStatus === 'failed') {
                    const failedAt = new Date(bookingCreatedAt.getTime() + (Math.random() * 10 * 60 * 1000)); // Failed within 10 mins
                    booking.updatedAt = failedAt;
                }

                // Handle expired bookings
                if (bookingStatus === 'expired') {
                    const expiredAt = new Date(bookingCreatedAt.getTime() + (15 * 60 * 1000)); // Expired after 15 mins
                    booking.updatedAt = expiredAt;
                }

                bookings.push(booking);

                // Create corresponding payment
                const transactionId = generateTransactionId();
                const paymentCreatedAt = new Date(bookingCreatedAt.getTime() + (Math.random() * 30 * 60 * 1000));

                const payment = {
                    id: uuidv4(),
                    booking_id: bookingId,
                    transaction_id: transactionId,
                    amount: totalPrice,
                    currency: 'USD',
                    payment_method: 'ABA_PAYWAY',
                    qr_string: null,
                    qr_image: null,
                    abapay_deeplink: null,
                    payment_status: paymentStatus,
                    payment_status_code: null,
                    original_amount: totalPrice,
                    refund_amount: 0,
                    discount_amount: 0,
                    apv: null,
                    transaction_date: null,
                    paid_at: null,
                    last_checked_at: paymentCreatedAt,
                    refund_status: 'none',
                    refund_transaction_id: null,
                    refunded_at: null,
                    gateway_fee_amount: 0,
                    createdAt: paymentCreatedAt,
                    updatedAt: paymentCreatedAt,
                };

                // Set payment-specific fields based on status
                switch (paymentStatus) {
                    case 'completed':
                        payment.payment_status_code = 1;
                        payment.paid_at = new Date(paymentCreatedAt.getTime() + (Math.random() * 5 * 60 * 1000));
                        payment.transaction_date = payment.paid_at;
                        payment.apv = `APV${Date.now().toString().slice(-8)}`;
                        payment.gateway_fee_amount = parseFloat((totalPrice * 0.025).toFixed(2));
                        payment.updatedAt = payment.paid_at;
                        break;

                    case 'refunded':
                        payment.payment_status_code = 4;
                        payment.paid_at = new Date(paymentCreatedAt.getTime() + (Math.random() * 5 * 60 * 1000));
                        payment.transaction_date = payment.paid_at;
                        payment.apv = `APV${Date.now().toString().slice(-8)}`;
                        payment.gateway_fee_amount = parseFloat((totalPrice * 0.025).toFixed(2));

                        const refundPct = booking.refund_percentage || 100;
                        payment.refund_amount = parseFloat((totalPrice * refundPct / 100).toFixed(2));
                        payment.refund_status = 'completed';
                        payment.refund_transaction_id = `REF-${transactionId}`;
                        payment.refunded_at = booking.cancelled_at
                            ? new Date(booking.cancelled_at.getTime() + (Math.random() * 24 * 60 * 60 * 1000))
                            : now;
                        payment.updatedAt = payment.refunded_at;
                        break;

                    case 'cancelled':
                        payment.payment_status_code = 3;
                        payment.updatedAt = booking.cancelled_at || now;
                        break;

                    case 'failed':
                        payment.payment_status_code = 2;
                        payment.updatedAt = new Date(paymentCreatedAt.getTime() + (Math.random() * 10 * 60 * 1000));
                        break;

                    case 'expired':
                        payment.payment_status_code = 5;
                        payment.updatedAt = new Date(paymentCreatedAt.getTime() + (15 * 60 * 1000));
                        break;

                    case 'pending':
                    default:
                        payment.payment_status_code = 0;
                        break;
                }

                payments.push(payment);
            }
        }

        // Build user_cancellation_stats records
        const userCancellationStats = Object.entries(customerStats).map(([userId, stats]) => {
            const cancellationRate = stats.total_bookings > 0
                ? parseFloat(((stats.total_cancellations / stats.total_bookings) * 100).toFixed(2))
                : 0;

            return {
                id: uuidv4(),
                user_id: userId,
                total_bookings: stats.total_bookings,
                total_cancellations: stats.total_cancellations,
                cancellation_rate: cancellationRate,
                is_flagged: cancellationRate > 30,
                last_cancellation_at: stats.last_cancellation_at,
                createdAt: now,
                updatedAt: now,
            };
        });

        // Insert data in batches
        const batchSize = 500;

        for (let i = 0; i < bookings.length; i += batchSize) {
            const batch = bookings.slice(i, i + batchSize);
            await queryInterface.bulkInsert('bookings', batch, {});
        }
        console.log(` Seeded ${bookings.length} bookings`);

        for (let i = 0; i < payments.length; i += batchSize) {
            const batch = payments.slice(i, i + batchSize);
            await queryInterface.bulkInsert('payments', batch, {});
        }
        console.log(` Seeded ${payments.length} payments`);

        await queryInterface.bulkInsert('user_cancellation_stats', userCancellationStats, {});
        console.log(` Seeded ${userCancellationStats.length} user cancellation stats`);

        // Summary stats
        const statusCounts = bookings.reduce((acc, b) => {
            acc[b.status] = (acc[b.status] || 0) + 1;
            return acc;
        }, {});

        const paymentStatusCounts = payments.reduce((acc, p) => {
            acc[p.payment_status] = (acc[p.payment_status] || 0) + 1;
            return acc;
        }, {});

        console.log('\n Booking Status Distribution:');
        console.log('   (pending | completed | cancelled | failed | expired | cancellation_requested)');
        Object.entries(statusCounts).forEach(([status, count]) => {
            console.log(`   ${status}: ${count} (${((count / bookings.length) * 100).toFixed(1)}%)`);
        });

        console.log('\n Payment Status Distribution:');
        console.log('   (pending | completed | failed | expired | cancelled | refunded)');
        Object.entries(paymentStatusCounts).forEach(([status, count]) => {
            console.log(`   ${status}: ${count} (${((count / payments.length) * 100).toFixed(1)}%)`);
        });

        const flaggedUsers = userCancellationStats.filter(s => s.is_flagged).length;
        console.log(`\nFlagged users (>30% cancellation rate): ${flaggedUsers}/${userCancellationStats.length}`);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('payments', null, {});
        await queryInterface.bulkDelete('bookings', null, {});
        await queryInterface.bulkDelete('user_cancellation_stats', null, {});

        console.log('✓ Removed all seeded bookings, payments, and user cancellation stats');
    }
};