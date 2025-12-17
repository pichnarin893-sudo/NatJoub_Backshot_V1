/**
 * Authentication configuration settings
 */

module.exports = {
    // JWT Configuration
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        maxRefreshAge: 7 * 24 * 60 * 60, // 7 days in seconds
        // secret: process.env.JWT_SECRET,
        // expiresIn: '30s', // Token expires in 30 seconds for testing
        // refreshExpiresIn: '1m', // Refresh token expires in 1 minute for testing
        // maxRefreshAge: 60, // 1 minute in seconds
    },

    // OTP Configuration
    otp: {
        length: parseInt(process.env.OTP_LENGTH) || 6,
        expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES) || 5,
        cleanupChance: parseFloat(process.env.OTP_CLEANUP_CHANCE) || 0.1,
    },

    // Password Configuration
    password: {
        saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12,
    },

    // Rate Limiting Configuration
    rateLimit: {
        auth: {
            windowMs: parseInt(process.env.AUTH_RATE_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
            // max: parseInt(process.env.AUTH_RATE_MAX) || 5,
            max: parseInt(process.env.AUTH_RATE_MAX) || 10000, // Increased for testing purposes
        },
        otp: {
            windowMs: parseInt(process.env.OTP_RATE_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
            // max: parseInt(process.env.OTP_RATE_MAX) || 3,
            max: parseInt(process.env.OTP_RATE_MAX) || 10000, // Increased for testing purposes
        },
        general: {
            windowMs: parseInt(process.env.GENERAL_RATE_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
            max: parseInt(process.env.GENERAL_RATE_MAX) || 10000,
        },
    },

    // Security Configuration
    security: {
        exposeOTPInDev: process.env.EXPOSE_OTP_IN_DEV === 'true' && process.env.NODE_ENV === 'development',
    },
};