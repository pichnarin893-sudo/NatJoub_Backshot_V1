const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { jwt: jwtConfig } = require('../config/auth.config');
const { AuthError } = require('./errors');

// Generate a secure secret key if not provided in environment
const secretKey = jwtConfig.secret || crypto.randomBytes(64).toString('hex');
if (!jwtConfig.secret) {
    console.warn('WARNING: Using auto-generated JWT secret key. Set JWT_SECRET in production.');
}

/**
 * Generate a JWT token with enhanced payload
 * @param {Object} payload - Token payload
 * @param {string} expiresIn - Token expiry time
 * @returns {string} - Generated JWT token
 */
function generateToken(payload, expiresIn = jwtConfig.expiresIn) {
    try {
        const tokenPayload = {
            ...payload,
            iat: Math.floor(Date.now() / 1000)
        };

        // Ensure we include a role claim in the token if available
        if (tokenPayload.role_id && !tokenPayload.role) {
            // This is a simplified logic - in a real app, you might look up the role name
            tokenPayload.role = tokenPayload.role_id === 1 ? 'admin' : 'customer';
        }

        return jwt.sign(tokenPayload, secretKey, { expiresIn });
    } catch (error) {
        console.error('Error generating token:', error);
        throw new AuthError('Failed to generate authentication token');
    }
}

/**
 * Verify a JWT token with enhanced error handling
 * @param {string} token - JWT token to verify
 * @returns {Object} - Decoded token payload
 */
function verifyToken(token) {
    try {
        return jwt.verify(token, secretKey);
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            throw new AuthError('Token has expired');
        } else if (err.name === 'JsonWebTokenError') {
            throw new AuthError('Invalid token format');
        } else if (err.name === 'NotBeforeError') {
            throw new AuthError('Token not active yet');
        }
        throw new AuthError('Invalid or malformed token');
    }
}

/**
 * Refresh token utility with configurable max age
 * @param {string} token - Token to refresh
 * @returns {string} - New JWT token
 */
function refreshTokenUtil(token) {
    try {
        const decoded = jwt.verify(token, secretKey, { ignoreExpiration: true });

        // Check if token is too old for refreshing
        const currentTimestamp = Math.floor(Date.now() / 1000);
        if (decoded.exp < currentTimestamp - jwtConfig.maxRefreshAge) {
            throw new AuthError('Token is too old for refreshing');
        }

        // Remove timing-sensitive claims
        const { iat, exp, ...refreshPayload } = decoded;

        // Generate new token with preserved claims
        return generateToken(refreshPayload, jwtConfig.refreshExpiresIn);
    } catch (err) {
        if (err instanceof AuthError) {
            throw err;
        }
        throw new AuthError('Invalid token for refresh');
    }
}

/**
 * Decode token without verification (for getting payload info)
 * @param {string} token - JWT token
 * @returns {Object|null} - Decoded payload or null
 */
function decodeToken(token) {
    try {
        return jwt.decode(token);
    } catch (error) {
        return null;
    }
}

module.exports = {
    generateToken,
    verifyToken,
    refreshTokenUtil,
    decodeToken
};