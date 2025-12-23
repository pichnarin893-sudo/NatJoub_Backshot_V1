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
         * BOOKING & PAYMENT STATUS MAPPING:
         * ─────────────────────────────────────────────────────────────────────────
         * Booking Status          | Payment Status   | Refund Status | Description
         * ─────────────────────────────────────────────────────────────────────────
         * pending                 | pending          | none          | Waiting for payment (has QR)
         * completed               | completed        | none          | Payment successful, booking valid
         * cancelled               | cancelled        | none          | User cancelled BEFORE paying
         * failed                  | failed           | none          | Payment failed (card declined, error)
         * expired                 | expired          | none          | Payment timeout (QR expired, abandoned)
         * cancellation_requested  | completed        | pending       | User requested cancellation, awaiting approval
         * refunded                | refunded         | completed     | Cancellation approved, refund processed
         * ─────────────────────────────────────────────────────────────────────────
         * 
         * Booking Status Enum: pending, cancelled, completed, failed, expired, refunded, cancellation_requested
         * Payment Status Enum: pending, completed, failed, expired, cancelled, refunded
         * Refund Status Enum: none, pending, completed
         */

        // Payment status codes mapping
        const PAYMENT_STATUS_CODES = {
            pending: 0,
            completed: 1,
            failed: 2,
            cancelled: 3,
            refunded: 4,
            expired: 5,
        };

        // Booking status distribution (weighted)
        // 55% completed, 8% pending, 8% cancelled, 5% failed, 5% expired, 10% cancellation_requested, 9% refunded
        const getBookingStatus = () => {
            const rand = Math.random();
            if (rand < 0.55) return 'completed';
            if (rand < 0.63) return 'pending';
            if (rand < 0.71) return 'cancelled';  // Cancelled before payment
            if (rand < 0.76) return 'failed';
            if (rand < 0.81) return 'expired';
            if (rand < 0.91) return 'cancellation_requested';
            return 'refunded';  // Cancelled after payment, refund completed
        };

        // Payment and refund status based on booking status
        const getPaymentAndRefundStatus = (bookingStatus) => {
            switch (bookingStatus) {
                case 'completed':
                    return { paymentStatus: 'completed', refundStatus: 'none' };
                case 'pending':
                    return { paymentStatus: 'pending', refundStatus: 'none' };
                case 'cancelled':
                    // Cancelled before payment - no refund needed
                    return { paymentStatus: 'cancelled', refundStatus: 'none' };
                case 'failed':
                    return { paymentStatus: 'failed', refundStatus: 'none' };
                case 'expired':
                    return { paymentStatus: 'expired', refundStatus: 'none' };
                case 'cancellation_requested':
                    // Was paid, now requesting cancellation - refund pending approval
                    return { paymentStatus: 'completed', refundStatus: 'pending' };
                case 'refunded':
                    // Was paid, cancellation approved, refund completed
                    return { paymentStatus: 'refunded', refundStatus: 'completed' };
                default:
                    return { paymentStatus: 'pending', refundStatus: 'none' };
            }
        };

        // Refund percentage options (for cancelled bookings with refunds)
        const refundPercentages = [100, 75, 50, 25, 0];

        // Counter for unique IDs
        let transactionCounter = 0;
        let apvCounter = 0;

        // Generate unique transaction ID
        const generateTransactionId = (datePrefix) => {
            transactionCounter++;
            const datePart = datePrefix.toISOString().slice(0, 10).replace(/-/g, '');
            const counterPart = String(transactionCounter).padStart(6, '0');
            const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
            return `TXN-${datePart}-${counterPart}-${randomPart}`;
        };

        // Generate unique APV (Approval Code)
        const generateAPV = () => {
            apvCounter++;
            const counterPart = String(apvCounter).padStart(8, '0');
            return `APV${counterPart}`;
        };

        // Generate mock QR string (simulates ABA PayWay QR format)
        const generateQRString = (transactionId, amount) => {
            const merchantId = 'NETJOUB001';
            const timestamp = Date.now();
            return `00020101021129370016${merchantId}0208${transactionId}5303840540${amount.toFixed(2)}5802KH5913NetJoub Space6010Phnom Penh62070503***6304${timestamp.toString(16).toUpperCase()}`;
        };

        // Generate mock QR image URL (base64 placeholder or URL)
        const generateQRImage = (transactionId) => {
            return `https://api.ababank.com/payway/qr/${transactionId}.png`;
        };

        // Generate mock ABA deeplink
        const generateABADeeplink = (transactionId, amount) => {
            return `aba://payway?txn=${transactionId}&amt=${amount.toFixed(2)}&merchant=NETJOUB001`;
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

        // Calculate gateway fee (2.5% for ABA PayWay)
        const calculateGatewayFee = (amount) => {
            return parseFloat((amount * 0.025).toFixed(2));
        };

        // Generate bookings and payments
        const bookings = [];
        const payments = [];
        const customerStats = {}; // Track stats per customer

        const startDate = '2025-05-01';
        const endDate = '2025-12-22';
        const dates = getDateRange(startDate, endDate);

        for (const date of dates) {
            for (const room of rooms) {
                const timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];
                const customerId = getRandomCustomer();
                const bookingStatus = getBookingStatus();
                const { paymentStatus, refundStatus } = getPaymentAndRefundStatus(bookingStatus);

                // Create start and end datetime
                const startTime = new Date(date);
                startTime.setHours(timeSlot.start, 0, 0, 0);

                const endTime = new Date(date);
                endTime.setHours(timeSlot.end, 0, 0, 0);

                // Calculate duration and price
                const durationHours = timeSlot.end - timeSlot.start;
                const totalPrice = parseFloat((durationHours * room.hourlyPrice).toFixed(3));

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
                // Booking created 1-7 days before the start time
                const daysBeforeBooking = 1 + Math.floor(Math.random() * 6);
                const bookingCreatedAt = new Date(startTime.getTime() - (daysBeforeBooking * 24 * 60 * 60 * 1000));
                // Add random hours/minutes for realism
                bookingCreatedAt.setHours(
                    8 + Math.floor(Math.random() * 12), // Between 8 AM and 8 PM
                    Math.floor(Math.random() * 60),
                    Math.floor(Math.random() * 60),
                    0
                );

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

                // Generate transaction ID for payment
                const transactionId = generateTransactionId(bookingCreatedAt);
                
                // Payment created immediately after booking (within 1-5 seconds)
                const paymentCreatedAt = new Date(bookingCreatedAt.getTime() + (1000 + Math.random() * 4000));

                // Build payment object with all fields
                const payment = {
                    id: uuidv4(),
                    booking_id: bookingId,
                    transaction_id: transactionId,
                    amount: parseFloat(totalPrice.toFixed(2)),
                    currency: 'USD',
                    payment_method: 'ABA_PAYWAY',
                    qr_string: generateQRString(transactionId, totalPrice),
                    qr_image: generateQRImage(transactionId),
                    abapay_deeplink: generateABADeeplink(transactionId, totalPrice),
                    payment_status: paymentStatus,
                    payment_status_code: PAYMENT_STATUS_CODES[paymentStatus],
                    original_amount: parseFloat(totalPrice.toFixed(2)),
                    refund_amount: 0,
                    discount_amount: 0,
                    apv: null,
                    transaction_date: null,
                    paid_at: null,
                    last_checked_at: paymentCreatedAt,
                    refund_status: refundStatus,
                    refund_transaction_id: null,
                    refunded_at: null,
                    gateway_fee_amount: 0,
                    createdAt: paymentCreatedAt,
                    updatedAt: paymentCreatedAt,
                };

                // Process based on booking/payment status
                switch (bookingStatus) {
                    case 'completed': {
                        // Payment completed successfully
                        // User pays within 1-10 minutes of payment creation
                        const paymentDuration = (1 + Math.random() * 9) * 60 * 1000;
                        const paidAt = new Date(paymentCreatedAt.getTime() + paymentDuration);
                        
                        payment.paid_at = paidAt;
                        payment.transaction_date = paidAt;
                        payment.apv = generateAPV();
                        payment.gateway_fee_amount = calculateGatewayFee(totalPrice);
                        payment.last_checked_at = paidAt;
                        payment.updatedAt = paidAt;
                        
                        // Update booking updatedAt to reflect payment completion
                        booking.updatedAt = paidAt;
                        break;
                    }

                    case 'pending': {
                        // Payment still pending - QR generated, waiting for user to pay
                        // last_checked_at should be recent if booking hasn't expired yet
                        const checkInterval = Math.random() * 5 * 60 * 1000; // Checked within last 5 mins
                        payment.last_checked_at = new Date(Math.min(
                            paymentCreatedAt.getTime() + checkInterval,
                            now.getTime()
                        ));
                        break;
                    }

                    case 'cancelled': {
                        // Cancelled before payment - user never paid
                        const cancelDuration = (5 + Math.random() * 55) * 60 * 1000; // 5-60 mins after booking
                        const cancelledAt = new Date(bookingCreatedAt.getTime() + cancelDuration);
                        
                        booking.cancellation_reason = getRandomCancellationReason();
                        booking.cancelled_at = cancelledAt;
                        booking.cancelled_by = customerId;
                        booking.cancellation_requested_at = new Date(cancelledAt.getTime() - (Math.random() * 5 * 60 * 1000));
                        booking.updatedAt = cancelledAt;
                        
                        payment.last_checked_at = cancelledAt;
                        payment.updatedAt = cancelledAt;
                        
                        // Clear QR data since payment was never initiated/completed
                        payment.qr_string = null;
                        payment.qr_image = null;
                        payment.abapay_deeplink = null;
                        break;
                    }

                    case 'refunded': {
                        // Booking was paid, then cancelled and refunded
                        // First, payment was completed
                        const paymentDuration = (1 + Math.random() * 9) * 60 * 1000;
                        const paidAt = new Date(paymentCreatedAt.getTime() + paymentDuration);
                        
                        payment.paid_at = paidAt;
                        payment.transaction_date = paidAt;
                        payment.apv = generateAPV();
                        payment.gateway_fee_amount = calculateGatewayFee(totalPrice);
                        
                        // Then, cancellation happened (1 hour to 2 days after payment)
                        const cancelDelay = (1 + Math.random() * 47) * 60 * 60 * 1000;
                        const cancelledAt = new Date(paidAt.getTime() + cancelDelay);
                        
                        const refundPercentage = getRandomRefundPercentage();
                        booking.refund_percentage = refundPercentage;
                        booking.cancellation_reason = getRandomCancellationReason();
                        booking.cancelled_at = cancelledAt;
                        booking.cancelled_by = customerId;
                        booking.cancellation_requested_at = new Date(cancelledAt.getTime() - (Math.random() * 30 * 60 * 1000));
                        
                        // Calculate refund amount
                        payment.refund_amount = parseFloat((totalPrice * refundPercentage / 100).toFixed(2));
                        payment.refund_transaction_id = `REF-${transactionId}`;
                        
                        // Refund processed (1-24 hours after cancellation)
                        const refundDelay = (1 + Math.random() * 23) * 60 * 60 * 1000;
                        const refundedAt = new Date(cancelledAt.getTime() + refundDelay);
                        payment.refunded_at = refundedAt;
                        payment.last_checked_at = refundedAt;
                        payment.updatedAt = refundedAt;
                        
                        booking.updatedAt = refundedAt;
                        
                        // Update cancellation stats
                        customerStats[customerId].total_cancellations++;
                        if (!customerStats[customerId].last_cancellation_at ||
                            cancelledAt > customerStats[customerId].last_cancellation_at) {
                            customerStats[customerId].last_cancellation_at = cancelledAt;
                        }
                        break;
                    }

                    case 'failed': {
                        // Payment failed after attempt
                        const failDuration = (2 + Math.random() * 8) * 60 * 1000; // Failed 2-10 mins after creation
                        const failedAt = new Date(paymentCreatedAt.getTime() + failDuration);
                        
                        payment.last_checked_at = failedAt;
                        payment.updatedAt = failedAt;
                        booking.updatedAt = failedAt;
                        break;
                    }

                    case 'expired': {
                        // Payment expired (15-minute timeout)
                        const expiredAt = new Date(paymentCreatedAt.getTime() + (15 * 60 * 1000));
                        
                        payment.last_checked_at = expiredAt;
                        payment.updatedAt = expiredAt;
                        booking.updatedAt = expiredAt;
                        break;
                    }

                    case 'cancellation_requested': {
                        // Payment was completed, now user is requesting cancellation
                        const paymentDuration = (1 + Math.random() * 9) * 60 * 1000;
                        const paidAt = new Date(paymentCreatedAt.getTime() + paymentDuration);
                        
                        payment.paid_at = paidAt;
                        payment.transaction_date = paidAt;
                        payment.apv = generateAPV();
                        payment.gateway_fee_amount = calculateGatewayFee(totalPrice);
                        
                        // Cancellation requested (1-48 hours after payment)
                        const requestDelay = (1 + Math.random() * 47) * 60 * 60 * 1000;
                        const requestedAt = new Date(paidAt.getTime() + requestDelay);
                        
                        booking.refund_percentage = getRandomRefundPercentage(); // Proposed refund amount
                        booking.cancellation_reason = getRandomCancellationReason();
                        booking.cancellation_requested_at = requestedAt;
                        booking.updatedAt = requestedAt;
                        
                        // Refund amount calculated but not yet processed
                        payment.refund_amount = parseFloat((totalPrice * booking.refund_percentage / 100).toFixed(2));
                        payment.last_checked_at = requestedAt;
                        payment.updatedAt = requestedAt;
                        break;
                    }
                }

                bookings.push(booking);
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
        console.log(`✓ Seeded ${bookings.length} bookings`);

        for (let i = 0; i < payments.length; i += batchSize) {
            const batch = payments.slice(i, i + batchSize);
            await queryInterface.bulkInsert('payments', batch, {});
        }
        console.log(`✓ Seeded ${payments.length} payments`);

        await queryInterface.bulkInsert('user_cancellation_stats', userCancellationStats, {});
        console.log(`✓ Seeded ${userCancellationStats.length} user cancellation stats`);

        // Summary stats
        const statusCounts = bookings.reduce((acc, b) => {
            acc[b.status] = (acc[b.status] || 0) + 1;
            return acc;
        }, {});

        const paymentStatusCounts = payments.reduce((acc, p) => {
            acc[p.payment_status] = (acc[p.payment_status] || 0) + 1;
            return acc;
        }, {});

        const refundStatusCounts = payments.reduce((acc, p) => {
            acc[p.refund_status] = (acc[p.refund_status] || 0) + 1;
            return acc;
        }, {});

        console.log('\n📊 Booking Status Distribution:');
        console.log('   (pending | completed | cancelled | failed | expired | cancellation_requested | refunded)');
        Object.entries(statusCounts).forEach(([status, count]) => {
            console.log(`   ${status}: ${count} (${((count / bookings.length) * 100).toFixed(1)}%)`);
        });

        console.log('\n💳 Payment Status Distribution:');
        console.log('   (pending | completed | failed | expired | cancelled)');
        Object.entries(paymentStatusCounts).forEach(([status, count]) => {
            console.log(`   ${status}: ${count} (${((count / payments.length) * 100).toFixed(1)}%)`);
        });

        console.log('\n💰 Refund Status Distribution:');
        console.log('   (none | pending | completed)');
        Object.entries(refundStatusCounts).forEach(([status, count]) => {
            console.log(`   ${status}: ${count} (${((count / payments.length) * 100).toFixed(1)}%)`);
        });

        const flaggedUsers = userCancellationStats.filter(s => s.is_flagged).length;
        console.log(`\n⚠️  Flagged users (>30% cancellation rate): ${flaggedUsers}/${userCancellationStats.length}`);

        // Data quality checks
        console.log('\n✅ Data Quality Checks:');
        const paymentsWithQR = payments.filter(p => p.qr_string !== null).length;
        const paymentsWithAPV = payments.filter(p => p.apv !== null).length;
        const paymentsWithPaidAt = payments.filter(p => p.paid_at !== null).length;
        const paymentsWithRefund = payments.filter(p => p.refund_amount > 0).length;
        
        console.log(`   Payments with QR data: ${paymentsWithQR}`);
        console.log(`   Payments with APV (completed): ${paymentsWithAPV}`);
        console.log(`   Payments with paid_at: ${paymentsWithPaidAt}`);
        console.log(`   Payments with refund_amount > 0: ${paymentsWithRefund}`);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('payments', null, {});
        await queryInterface.bulkDelete('bookings', null, {});
        await queryInterface.bulkDelete('user_cancellation_stats', null, {});

        console.log('✓ Removed all seeded bookings, payments, and user cancellation stats');
    }
};