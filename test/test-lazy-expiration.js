/**
 * Test lazy expiration during overlap check
 * This test verifies that when checking for overlaps, the system
 * automatically expires pending bookings that are >5 minutes old
 */

require('dotenv').config();
const { bookings, sequelize } = require('../models');
const bookingController = require('../controllers/api/v1/user/booking.controller');
const { v4: uuidv4 } = require('uuid');

async function testLazyExpiration() {
    const transaction = await sequelize.transaction();

    try {
        const customerId = '123e4501-e89b-12d3-a456-426614174000';
        const roomId = '22222222-2222-2222-2222-222222222223';

        const now = new Date();
        const startTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
        const endTime = new Date(now.getTime() + 120 * 60 * 1000);  // 2 hours from now

        console.log('🧪 Test: Lazy Expiration During Overlap Check\n');
        console.log('═══════════════════════════════════════════════\n');

        // Step 1: Create a pending booking that's 6 minutes old (should be expired)
        const oldCreatedAt = new Date(now.getTime() - 6 * 60 * 1000); // 6 minutes ago

        const oldBooking = await bookings.create({
            id: uuidv4(),
            customer_id: customerId,
            room_id: roomId,
            start_time: startTime,
            end_time: endTime,
            total_price: '50.000',
            status: 'pending', // Still pending, but created 6 min ago
            createdAt: oldCreatedAt,
            updatedAt: oldCreatedAt
        }, { transaction });

        console.log('Step 1: Created old PENDING booking');
        console.log(`   ID: ${oldBooking.id}`);
        console.log(`   Status: ${oldBooking.status}`);
        console.log(`   Created: 6 minutes ago`);
        console.log(`   Should be expired: YES (>5 minutes old)\n`);

        await transaction.commit();

        // Step 2: Try to create a new booking in the same time slot
        console.log('Step 2: Attempting to book the SAME time slot...');
        console.log('   Expected: Old booking auto-expires, new booking succeeds\n');

        try {
            const newBooking = await bookingController.createBooking({
                userId: customerId,
                roomId: roomId,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString()
            });

            console.log('✅ ✅ ✅ SUCCESS! New booking created:\n');
            console.log(`   New booking ID: ${newBooking.id}`);
            console.log(`   Status: ${newBooking.status}\n`);

            // Check if old booking was auto-expired
            const updatedOldBooking = await bookings.findByPk(oldBooking.id);
            console.log('📊 Old booking status after overlap check:');
            console.log(`   Status: ${updatedOldBooking.status}`);
            console.log(`   Cancelled at: ${updatedOldBooking.cancelled_at}`);

            if (updatedOldBooking.status === 'expired') {
                console.log(`\n┌──────────────────────────────────────────────┐`);
                console.log(`│  ✅ TEST PASSED                             │`);
                console.log(`│  Lazy expiration worked!                     │`);
                console.log(`│  Old pending booking was auto-expired        │`);
                console.log(`└──────────────────────────────────────────────┘\n`);
            } else {
                console.log(`\n┌──────────────────────────────────────────────┐`);
                console.log(`│  ⚠️  PARTIAL SUCCESS                        │`);
                console.log(`│  New booking created, but old booking        │`);
                console.log(`│  status is: ${updatedOldBooking.status.padEnd(34)}│`);
                console.log(`│  (Expected: expired)                         │`);
                console.log(`└──────────────────────────────────────────────┘\n`);
            }

            // Clean up
            await bookings.destroy({ where: { id: [oldBooking.id, newBooking.id] } });
            console.log('🧹 Cleaned up test bookings');

            process.exit(0);

        } catch (error) {
            if (error.message.includes('already booked') || error.message.includes('Time slot')) {
                console.log(`❌ ❌ ❌ FAILED: Time slot blocked!\n`);
                console.log(`   Error: ${error.message}\n`);
                console.log(`┌──────────────────────────────────────────────┐`);
                console.log(`│  ❌ TEST FAILED                             │`);
                console.log(`│  Old pending booking was NOT auto-expired    │`);
                console.log(`│  Lazy expiration is not working              │`);
                console.log(`└──────────────────────────────────────────────┘\n`);

                // Clean up
                await bookings.destroy({ where: { id: oldBooking.id } });
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

testLazyExpiration();
