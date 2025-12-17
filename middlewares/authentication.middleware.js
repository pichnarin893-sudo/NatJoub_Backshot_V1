const { verifyToken } = require('../utils/jwt.util');
const { users, roles } = require('../models');
const { errorResponse } = require('../controllers/api/v1/baseApi.controller');
const tokenStore = require('../utils/secureStore');

// Define role constants for Nat Joub
const ROLES = {
    ADMIN: 'admin',
    OWNER: 'owner',
    CUSTOMER: 'customer',
};

/**
 * Authentication middleware that verifies if the user has the required role
 * @param {string} roleName - The required role name ('admin', 'user')
 * @returns {Function} Express middleware function
 */
const authMiddleware = (roleName) => {
    return async (req, res, next) => {
        try {
            // Extract token from headers
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return errorResponse(res, 'Access denied. No valid token provided.', 401);
            }

            const token = authHeader.replace('Bearer ', '');

            // Check if token has been blacklisted
            if (tokenStore.isTokenInvalid(token)) {
                return errorResponse(res, 'Token has been revoked', 401);
            }

            // Verify token
            let decoded;
            try {
                decoded = verifyToken(token);
            } catch (err) {
                if (err.message === 'Token has expired') {
                    return errorResponse(res, 'Token has expired', 401);
                } else if (err.message === 'Invalid token') {
                    return errorResponse(res, 'Invalid token format', 401);
                }
                return errorResponse(res, 'Authentication failed', 401);
            }

            // Find user in database with their role information
            const user = await users.findByPk(decoded.id, {
                attributes: ['id', 'first_name', 'last_name', 'role_id'],
                include: [
                    {
                        model: roles,
                        as: 'role',
                        attributes: ['id', 'name']
                    }
                ]
            });

            if (!user) {
                return errorResponse(res, 'User not found', 401);
            }

            // Check if user has required role
            if (roleName && user.role && user.role.name !== roleName) {
                return errorResponse(res, 'Insufficient permissions', 403);
            }

            // Attach user info to request
            req.user = decoded;
            req.userDetails = user;
            next();
        } catch (err) {
            return errorResponse(res, 'Authentication error: ' + err.message, 500);
        }
    };
};

module.exports = {
    authenticate: authMiddleware(), // General authentication without role check
    authenticateAdmin: authMiddleware(ROLES.ADMIN),
    authenticateOwner: authMiddleware(ROLES.OWNER),
    authenticateCustomer: authMiddleware(ROLES.CUSTOMER),
    ROLES // Export roles for use elsewhere
};