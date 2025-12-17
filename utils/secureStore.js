/**
 * Simple in-memory token store for blacklisting tokens
 * Note: For production use, consider using Redis or a database
 */

const invalidatedTokens = new Map(); // token hash -> expiry time

/**
 * Add a token to the invalidated tokens list
 * @param {string} token - The token to invalidate
 * @param {number} expiry - The token expiry timestamp
 */
function invalidateToken(token, expiry) {
    const tokenHash = require('crypto').createHash('sha256').update(token).digest('hex');
    invalidatedTokens.set(tokenHash, expiry);

    // Cleanup expired tokens occasionally
    if (Math.random() < 0.1) { // 10% chance to run cleanup on each add
        cleanupExpiredTokens();
    }
}

/**
 * Check if a token is in the invalidated list
 * @param {string} token - The token to check
 * @returns {boolean} - True if token is invalidated
 */
function isTokenInvalid(token) {
    const tokenHash = require('crypto').createHash('sha256').update(token).digest('hex');
    return invalidatedTokens.has(tokenHash);
}

/**
 * Remove expired tokens from memory
 */
function cleanupExpiredTokens() {
    const now = Math.floor(Date.now() / 1000);
    for (const [hash, expiry] of invalidatedTokens.entries()) {
        if (expiry < now) {
            invalidatedTokens.delete(hash);
        }
    }
}

module.exports = {
    invalidateToken,
    isTokenInvalid
};