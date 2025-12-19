/**
 * Creates a test booking to verify auto-expiration logic
 * Usage: node create-test-booking.js [minutes-old]
 * Example: node create-test-booking.js 6  (creates booking that's 6 minutes old - should expire immediately)
 */

require('dotenv').config();
const { bookings } = require('../models');
const { v4: uuidv4 } = require('uuid');

const minutesOld = parseInt(process.argv[2]) || 1;

async function createTestBooking() {
    try {
        // Use existing valid UUIDs from your data
        const customerId = '123e4501-e89b-12d3-a456-426614174000';
        const roomId = '22222222-2222-2222-2222-222222222223';

        const now = new Date();
        const createdAt = new Date(now.getTime() - minutesOld * 60 * 1000); // X minutes ago
        const startTime = new Date(now.getTime() + 30 * 60 * 1000);         // 30 minutes from now
        const endTime = new Date(now.getTime() + 90 * 60 * 1000);           // 1.5 hours from now

        const booking = await bookings.create({
            id: uuidv4(),
            customer_id: customerId,
            room_id: roomId,
            start_time: startTime,
            end_time: endTime,
            total_price: '50.000',
            status: 'pending',
            createdAt: createdAt,
            updatedAt: createdAt
        });

        const expiryTime = new Date(createdAt.getTime() + 5 * 60 * 1000);

        console.log('✅ Test booking created:');
        console.log(`   ID: ${booking.id}`);
        console.log(`   Status: ${booking.status}`);
        console.log(`   Created: ${createdAt.toLocaleString('en-US', { timeZone: 'Asia/Phnom_Penh' })} (${minutesOld} minutes ago)`);
        console.log(`   Expires: ${expiryTime.toLocaleString('en-US', { timeZone: 'Asia/Phnom_Penh' })}`);
        console.log(`   Start time: ${startTime.toLocaleString('en-US', { timeZone: 'Asia/Phnom_Penh' })}`);

        const shouldBeExpired = now > expiryTime;
        console.log(`\n${shouldBeExpired ? '⚠️' : '✅'}  ${shouldBeExpired ? 'SHOULD BE EXPIRED' : 'Within 5-minute payment window'}`);

        if (shouldBeExpired) {
            console.log('\n💡 Run `node test-cleanup.js` to expire this booking');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

createTestBooking();
