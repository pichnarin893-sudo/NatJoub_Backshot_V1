/**
 * Manual test script for booking cleanup
 * Run this to manually trigger the cleanup process and see results
 */

require('dotenv').config();
const { cancelExpiredPendingBookings, getPendingBookingsNearExpiry } = require('../utils/booking.cleanup');

async function runCleanupTest() {
    console.log('🧪 Testing Booking Cleanup');
    console.log('========================\n');

    try {
        // Show current time
        console.log(`⏰ Current time: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Phnom_Penh' })}`);
        console.log(`   (${new Date().toISOString()})\n`);

        // Check bookings near expiry
        console.log('📊 Checking pending bookings (will expire in next 10 minutes)...');
        const nearExpiry = await getPendingBookingsNearExpiry(10);

        if (nearExpiry.count > 0) {
            console.log(`   Found ${nearExpiry.count} pending booking(s):\n`);
            nearExpiry.bookings.forEach(b => {
                console.log(`   - Booking ${b.id}`);
                console.log(`     Room: ${b.roomId}`);
                console.log(`     Created: ${new Date(b.createdAt).toLocaleString('en-US', { timeZone: 'Asia/Phnom_Penh' })}`);
                console.log(`     Expires: ${new Date(b.expiresAt).toLocaleString('en-US', { timeZone: 'Asia/Phnom_Penh' })}`);
                console.log(`     Time until expiry: ${b.minutesUntilExpiry}m ${b.secondsUntilExpiry % 60}s`);
                console.log(`     Booking start time: ${new Date(b.startTime).toLocaleString('en-US', { timeZone: 'Asia/Phnom_Penh' })}`);
                console.log('');
            });
        } else {
            console.log('   No pending bookings approaching expiry\n');
        }

        // Run cleanup
        console.log('🧹 Running cleanup process...');
        const result = await cancelExpiredPendingBookings();

        if (result.cancelled > 0) {
            console.log(`\n✅ Successfully cancelled ${result.cancelled} booking(s):`);
            result.details.forEach(detail => {
                console.log(`\n   📦 Booking: ${detail.bookingId}`);
                console.log(`      Room: ${detail.roomId}`);
                console.log(`      Customer: ${detail.customerId}`);
                console.log(`      Booking start time: ${new Date(detail.startTime).toLocaleString('en-US', { timeZone: 'Asia/Phnom_Penh' })}`);
                console.log(`      Price: $${detail.totalPrice}`);
                console.log(`      Reason: Payment not received within 5 minutes of booking creation`);
            });
        } else {
            console.log('   ℹ️  No expired bookings to cancel (all pending bookings are within 5-minute payment window)');
        }

        console.log('\n✅ Test completed successfully');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Test failed:', error);
        process.exit(1);
    }
}

runCleanupTest();
