const { successResponse, errorResponse } = require('../../controllers/api/v1/baseApi.controller');
const adminAuthController = require('../../controllers/api/v1/admin/auth.controller');
const jwt = require('jsonwebtoken');
const { refreshTokenUtil } = require('../../utils/jwt.util');
const { sendOTPEmail } = require('../../utils/email.util');
const { AuthError, ValidationError } = require('../../utils/errors');
const { security } = require('../../config/auth.config');
const tokenStore = require('../../utils/secureStore');

/**
 * Initial admin login - validate credentials and generate OTP
 */
const initiateLogin = async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await adminAuthController.initiateLogin(username, password);

        // Send OTP via email
        try {
            await sendOTPEmail(result.email, result.otp);
        } catch (emailError) {
            console.error('Failed to send OTP email to:', result.email, emailError);
            // Continue process but log the failure
        }

        const responseData = {
            userId: result.userId,
            email: result.email,
            username: result.username,
            requiresOTP: true,
            otpExpiresInMinutes: 5
        };

        // Only expose OTP in development if explicitly configured
        if (security.exposeOTPInDev) {
            responseData.otp = result.otp;
        }

        return successResponse(res, responseData, 'OTP sent successfully');
    } catch (error) {
        console.error('Admin login error:', error);

        if (error instanceof AuthError) {
            return errorResponse(res, error.message, error.statusCode);
        }

        // Don't expose internal error details
        return errorResponse(res, 'Authentication failed', 500);
    }
};

/**
 * Verify OTP endpoint handler with enhanced security
 */
const verifyOTP = async (req, res) => {
    const { username, otp } = req.body;

    try {
        const result = await adminAuthController.verifyAdminOTP(username, otp);
        return successResponse(res, result, 'Login successful');
    } catch (error) {
        console.error('Admin OTP verification error:', error);

        if (error instanceof AuthError) {
            return errorResponse(res, error.message, error.statusCode);
        }

        return errorResponse(res, 'OTP verification failed', 500);
    }
};

/**
 * Refresh admin token with enhanced validation
 */
const refreshToken = async (req, res) => {
    const { token } = req.body;

    try {
        // Check if token is blacklisted
        if (tokenStore.isTokenInvalid(token)) {
            throw new AuthError('Token has been revoked', 401);
        }

        // Use refreshTokenUtil which handles expired tokens properly
        const newToken = refreshTokenUtil(token);

        // Decode the original token to get user info
        const decoded = jwt.decode(token);
        if (!decoded || !decoded.id) {
            throw new AuthError('Invalid token payload', 401);
        }

        // Get user data from database
        const user = await adminAuthController.getUserById(decoded.id);
        if (!user) {
            throw new AuthError('Admin user not found', 404);
        }

        return successResponse(res, {
            user: {
                id: user.id,
                email: user.credential ? user.credential.email : null,
                role: 'admin'
            },
            token: newToken
        }, 'Token refreshed successfully');
    } catch (error) {
        console.error('Admin token refresh error:', error);

        if (error instanceof AuthError) {
            return errorResponse(res, error.message, error.statusCode);
        }

        return errorResponse(res, 'Failed to refresh token', 500);
    }
};

/**
 * Admin logout - invalidate token with proper cleanup
 */
const logout = async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (token) {
            try {
                const decoded = jwt.decode(token);
                if (decoded && decoded.exp) {
                    tokenStore.invalidateToken(token, decoded.exp);
                }
            } catch (err) {
                // Token decode failed, but continue with logout
                console.warn('Failed to decode token during logout:', err.message);
            }
        }

        return successResponse(res, null, 'Logged out successfully');
    } catch (error) {
        console.error('Admin logout error:', error);
        return errorResponse(res, 'Logout failed', 500);
    }
};

module.exports = {
    initiateLogin,
    verifyOTP,
    refreshToken,
    logout
};