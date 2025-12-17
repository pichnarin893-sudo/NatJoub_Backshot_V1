'use strict';

/**
 * Refund Utility
 * Handles refund calculations and business logic for booking cancellations
 */

// Gateway fee percentage (e.g., 2% of transaction amount)
const GATEWAY_FEE_PERCENTAGE = 2;

// Minimum cancellation window in hours
const MINIMUM_CANCELLATION_HOURS = 2;

// Cancellation rate threshold for flagging users
const ABUSE_THRESHOLD_PERCENTAGE = 30;

/**
 * Calculate refund percentage based on time until check-in
 * @param {Date} checkInTime - Booking check-in time
 * @param {Date} currentTime - Current time (defaults to now)
 * @returns {Object} { allowed: boolean, percentage: number, hoursUntilCheckIn: number }
 */
function calculateRefundPercentage(checkInTime, currentTime = new Date()) {
    const checkIn = new Date(checkInTime);
    const now = new Date(currentTime);

    // Calculate hours until check-in
    const millisecondsUntilCheckIn = checkIn - now;
    const hoursUntilCheckIn = millisecondsUntilCheckIn / (1000 * 60 * 60);

    // Already past check-in time - no cancellation allowed
    if (hoursUntilCheckIn <= 0) {
        return {
            allowed: false,
            percentage: 0,
            hoursUntilCheckIn: hoursUntilCheckIn,
            reason: 'Check-in time has passed. Cancellation not allowed.'
        };
    }

    // Less than minimum cancellation window - no cancellation allowed
    if (hoursUntilCheckIn < MINIMUM_CANCELLATION_HOURS) {
        return {
            allowed: false,
            percentage: 0,
            hoursUntilCheckIn: hoursUntilCheckIn,
            reason: `Cancellation requires at least ${MINIMUM_CANCELLATION_HOURS} hours notice.`
        };
    }

    // Determine refund percentage based on tiered policy
    let percentage;
    if (hoursUntilCheckIn > 48) {
        percentage = 100; // More than 48 hours - full refund
    } else if (hoursUntilCheckIn >= 24) {
        percentage = 75; // 24-48 hours - 75% refund
    } else if (hoursUntilCheckIn >= 6) {
        percentage = 50; // 6-24 hours - 50% refund
    } else {
        percentage = 25; // 2-6 hours - 25% refund
    }

    return {
        allowed: true,
        percentage: percentage,
        hoursUntilCheckIn: hoursUntilCheckIn,
        reason: null
    };
}

/**
 * Calculate actual refund amount after deducting gateway fees
 * @param {number} totalAmount - Total booking amount
 * @param {number} refundPercentage - Percentage of refund (0-100)
 * @returns {Object} { refundAmount: number, gatewayFee: number, totalRefund: number }
 */
function calculateRefundAmount(totalAmount, refundPercentage) {
    // Calculate base refund amount
    const baseRefund = (totalAmount * refundPercentage) / 100;

    // Calculate gateway fee (customer pays this)
    const gatewayFee = (totalAmount * GATEWAY_FEE_PERCENTAGE) / 100;

    // Total refund after deducting gateway fee
    const totalRefund = Math.max(0, baseRefund - gatewayFee);

    return {
        refundAmount: parseFloat(baseRefund.toFixed(2)),
        gatewayFee: parseFloat(gatewayFee.toFixed(2)),
        totalRefund: parseFloat(totalRefund.toFixed(2))
    };
}

/**
 * Check if user should be flagged for abuse based on cancellation rate
 * @param {number} totalBookings - Total number of bookings
 * @param {number} totalCancellations - Total number of cancellations
 * @returns {Object} { shouldFlag: boolean, rate: number }
 */
function shouldFlagUserForAbuse(totalBookings, totalCancellations) {
    if (totalBookings === 0) {
        return { shouldFlag: false, rate: 0 };
    }

    const rate = (totalCancellations / totalBookings) * 100;
    const shouldFlag = rate > ABUSE_THRESHOLD_PERCENTAGE;

    return {
        shouldFlag: shouldFlag,
        rate: parseFloat(rate.toFixed(2))
    };
}

/**
 * Get user-friendly cancellation policy message
 * @returns {string} Policy description
 */
function getCancellationPolicyMessage() {
    return `
Cancellation Policy:
- More than 48 hours before check-in: 100% refund
- 24-48 hours before check-in: 75% refund
- 6-24 hours before check-in: 50% refund
- 2-6 hours before check-in: 25% refund
- Less than 2 hours before check-in: Cancellation not allowed

Note: A ${GATEWAY_FEE_PERCENTAGE}% payment gateway fee will be deducted from all refunds.
    `.trim();
}

/**
 * Validate if cancellation is allowed for a booking
 * @param {Object} booking - Booking object with start_time and status
 * @returns {Object} { allowed: boolean, reason: string }
 */
function validateCancellation(booking) {
    // Already cancelled
    if (booking.status === 'cancelled') {
        return {
            allowed: false,
            reason: 'Booking is already cancelled.'
        };
    }

    // Failed or expired - nothing to cancel
    if (booking.status === 'failed' || booking.status === 'expired') {
        return {
            allowed: false,
            reason: `Booking with status '${booking.status}' cannot be cancelled.`
        };
    }

    // Cancellation already in process
    if (booking.status === 'cancellation_requested') {
        return {
            allowed: false,
            reason: 'Cancellation is already in process for this booking.'
        };
    }

    // Only 'pending' and 'completed' can be cancelled
    if (booking.status !== 'pending' && booking.status !== 'completed') {
        return {
            allowed: false,
            reason: `Booking with status '${booking.status}' cannot be cancelled.`
        };
    }

    // Pending = no payment yet, just cancel (no refund)
    if (booking.status === 'pending') {
        return {
            allowed: true,
            reason: null,
            refundPercentage: 0,
            hasPayment: false
        };
    }

    // Completed = already paid, check refund time window
    if (booking.status === 'completed') {
        const refundCalc = calculateRefundPercentage(booking.start_time);

        if (!refundCalc.allowed) {
            return {
                allowed: false,
                reason: refundCalc.reason
            };
        }

        return {
            allowed: true,
            reason: null,
            refundPercentage: refundCalc.percentage,  // 100%, 75%, 50%, etc.
            hasPayment: true
        };
    }
}

module.exports = {
    calculateRefundPercentage,
    calculateRefundAmount,
    shouldFlagUserForAbuse,
    getCancellationPolicyMessage,
    validateCancellation,
    MINIMUM_CANCELLATION_HOURS,
    GATEWAY_FEE_PERCENTAGE,
    ABUSE_THRESHOLD_PERCENTAGE
};
