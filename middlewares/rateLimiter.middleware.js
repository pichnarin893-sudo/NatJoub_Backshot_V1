const rateLimit = require('express-rate-limit');
const { errorResponse } = require('../controllers/api/v1/baseApi.controller');

/**
 * Rate limiter for authentication endpoints
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // Limit each IP to 5 requests per windowMs
    message: 'Too many authentication attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        return errorResponse(res, 'Too many authentication attempts, please try again later', 429);
    }
});

/**
 * Rate limiter for OTP verification (more restrictive)
 */
const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // Limit each IP to 3 OTP attempts per windowMs
    message: 'Too many OTP attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        return errorResponse(res, 'Too many OTP verification attempts, please try again later', 429);
    }
});

/**
 * Rate limiter for general API endpoints
 */
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        return errorResponse(res, 'Too many requests, please try again later', 429);
    }
});

/*
* Owner create branch requested limit
*/

const requestBranchLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 1000, // Limit each IP to 1 requests per windowMs
    message: 'Too many branch creation requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        return errorResponse(res, 'Too many branch creation requests, please try again later', 429);
    }
});


/**
 * Owner room create requested limit
 */
const requestRoomLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Limit each IP to 5 requests per windowMs
    message: 'Too many room creation requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        return errorResponse(res, 'Too many room creation requests, please try again later', 429);
    }
});


module.exports = {
    authLimiter,
    otpLimiter,
    generalLimiter,
    requestBranchLimiter,
    requestRoomLimiter
};