const crypto = require('crypto');
const { credentials } = require('../models');
const { Op } = require('sequelize');
const { otp: otpConfig } = require('../config/auth.config');
const { DatabaseError } = require('./errors');
// const {credential} = require("firebase-admin");

/**
 * Generate a cryptographically secure numeric OTP
 * @param {number} length - Length of OTP
 * @returns {string} - Generated OTP
 */
function generateOTP(length = otpConfig.length) {
    // Use crypto.randomInt for better security
    let OTP = '';
    for (let i = 0; i < length; i++) {
        OTP += crypto.randomInt(0, 10).toString();
    }
    return OTP;
}

/**
 * Save OTP to the user's credential record with optimized query
 * @param {string} userId - User ID
 * @param {string} otp - Generated OTP
 * @param {number} expiryMinutes - OTP expiry time in minutes
 */
async function saveOTP(userId, otp, expiryMinutes = otpConfig.expiryMinutes) {
    try {
        const expiryTime = new Date();
        expiryTime.setMinutes(expiryTime.getMinutes() + expiryMinutes);

        const [affectedRows] = await credentials.update({
            otp,
            otp_expiry: expiryTime
        }, {
            where: { user_id: userId }
        });

        if (affectedRows === 0) {
            throw new DatabaseError('User credential not found');
        }

        return true;
    } catch (error) {
        console.error('Error saving OTP:', error);
        if (error instanceof DatabaseError) {
            throw error;
        }
        throw new DatabaseError('Failed to save OTP');
    }
}

/**
 * Verify OTP and clear it if valid with optimized query
 * @param {string} userId - User ID
 * @param {string} otpToVerify - OTP to verify
 * @returns {boolean} - Verification result
 */
async function verifyOTP(userId, otpToVerify) {
    try {
        const credential = await credentials.findOne({
            where: {
                user_id: userId,
                otp: otpToVerify,
                otp_expiry: {
                    [Op.gt]: new Date()
                }
            }
        });

        if (!credential) {
            return false;
        }

        // Clear OTP after successful verification using atomic operation
        const [affectedRows] = await credentials.update({
            otp: null,
            otp_expiry: null
        }, {
            where: {
                user_id: userId,
                otp: otpToVerify // Ensure we're updating the same OTP
            }
        });

        return affectedRows > 0;
    } catch (error) {
        console.error('Error verifying OTP:', error);
        throw new DatabaseError('Failed to verify OTP');
    }
}

/**
 * Clean up expired OTPs (can be called periodically)
 */
async function cleanupExpiredOTPs() {
    try {
        const now = new Date();
        const [affectedRows] = await credentials.update({
            otp: null,
            otp_expiry: null
        }, {
            where: {
                otp_expiry: {
                    [Op.lt]: now
                }
            }
        });

        console.log(`Cleaned up ${affectedRows} expired OTPs`);
        return affectedRows;
    } catch (error) {
        console.error('Error cleaning up expired OTPs:', error);
        throw new DatabaseError('Failed to cleanup expired OTPs');
    }
}

module.exports = {
    generateOTP,
    saveOTP,
    verifyOTP,
    cleanupExpiredOTPs
};