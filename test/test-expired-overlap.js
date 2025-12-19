/**
 * Test that expired bookings don't block new bookings
 * This test:
 * 1. Creates an expired booking in a time slot
 * 2. Tries to book the same time slot
 * 3. Verifies the new booking succeeds (expired booking doesn't block)
 */

require('dotenv').config();
const { bookings, sequelize } = require('../models');
const bookingController = require('../controllers/api/v1/user/booking.controller');
const { v4: uuidv4 } = require('uuid');

async function testExpiredOverlap() {
    const transaction = await sequelize.transaction();

    try {
        const customerId = '123e4501-e89b-12d3-a456-426614174000';
        const roomId = '22222222-2222-2222-2222-222222222223';

        // Test time slot: 1 hour from now to 2 hours from now
        const now = new Date();
        const startTime = new Date(now.getTime() + 60 * 60 * 1000);
        const endTime = new Date(now.getTime() + 120 * 60 * 1000);

        console.log('🧪 Test: Expired Bookings Should NOT Block New Bookings\n');
        console.log('══════════════════════════════════════════════════════\n');

        // Step 1: Create an expired booking in this time slot
        const expiredCreatedAt = new Date(now.getTime() - 10 * 60 * 1000); // 10 minutes ago

        const expiredBooking = await bookings.create({
            id: uuidv4(),
            customer_id: customerId,
            room_id: roomId,
            start_time: startTime,
            end_time: endTime,
            total_price: '50.000',
            status: 'expired',
            cancelled_at: now,
            cancellation_reason: 'Test: Auto-expired',
            createdAt: expiredCreatedAt,
            updatedAt: expiredCreatedAt
        }, { transaction });

        console.log('Step 1: Created EXPIRED booking');
        console.log(`   ID: ${expiredBooking.id}`);
        console.log(`   Status: ${expiredBooking.status}`);
        console.log(`   Time slot: ${startTime.toLocaleString('en-US', { timeZone: 'Asia/Phnom_Penh' })}`);
        console.log(`              to ${endTime.toLocaleString('en-US', { timeZone: 'Asia/Phnom_Penh' })}\n`);

        // Step 2: Try to create a new booking in the SAME time slot
        console.log('Step 2: Attempting to book the SAME time slot...\n');

        await transaction.commit(); // Commit the expired booking first

        try {
            const newBooking = await bookingController.createBooking({
                userId: customerId,
                roomId: roomId,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString()
            });

            console.log('✅ ✅ ✅ SUCCESS! New booking created:\n');
            console.log(`   ID: ${newBooking.id}`);
            console.log(`   Status: ${newBooking.status}`);
            console.log(`\n┌─────────────────────────────────────────────┐`);
            console.log(`│  ✅ TEST PASSED                            │`);
            console.log(`│  Expired bookings do NOT block new bookings │`);
            console.log(`└─────────────────────────────────────────────┘\n`);

            // Clean up
            await bookings.destroy({ where: { id: [expiredBooking.id, newBooking.id] } });
            console.log('🧹 Cleaned up test bookings');

            process.exit(0);

        } catch (error) {
            if (error.message.includes('already booked') || error.message.includes('Time slot')) {
                console.log(`❌ ❌ ❌ FAILED: Time slot blocked!\n`);
                console.log(`   Error: ${error.message}\n`);
                console.log(`┌─────────────────────────────────────────────┐`);
                console.log(`│  ❌ TEST FAILED                            │`);
                console.log(`│  Expired booking is blocking new bookings   │`);
                console.log(`│  This should NOT happen!                    │`);
                console.log(`└─────────────────────────────────────────────┘\n`);

                console.log('🔍 Diagnosis:');
                console.log('   The _checkOverlap method is not properly');
                console.log('   excluding expired bookings from the query.\n');

                // Clean up
                await bookings.destroy({ where: { id: expiredBooking.id } });
                console.log('🧹 Cleaned up test booking');

                process.exit(1);
            } else {
                throw error;
            }
        }

    } catch (error) {
        await transaction.rollback();
        console.error('\n❌ Test error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

testExpiredOverlap();
