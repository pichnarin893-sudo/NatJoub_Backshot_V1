const { successResponse, errorResponse } = require('../../controllers/api/v1/baseApi.controller');
const authController = require('../../controllers/api/v1/user/auth.controller');
const { refreshTokenUtil } = require('../../utils/jwt.util');
const { sendOTPEmail } = require('../../utils/email.util');
const { AuthError } = require('../../utils/errors');
const { security } = require('../../config/auth.config');
const tokenStore = require('../../utils/secureStore');
const jwt = require('jsonwebtoken');

/**
 * Initial login step - validate credentials and send OTP
 */
const initiateLogin = async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await authController.initiateLogin(username, password);

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
            role: result.role,
            requiresOTP: true,
            otpExpiresInMinutes: 5
        };

        // Only expose OTP in development if explicitly configured
        if (security.exposeOTPInDev) {
            responseData.otp = result.otp;
        }

        return successResponse(res, responseData, 'OTP sent successfully');
    } catch (error) {
        console.error('User login error:', error);

        if (error instanceof AuthError) {
            return errorResponse(res, error.message, error.statusCode);
        }

        return errorResponse(res, 'Authentication failed', 500);
    }
};

/**
 * Verify OTP and complete login process
 */
const verifyOTP = async (req, res) => {
    const { username, otp } = req.body;

    try {
        const result = await authController.verifyUserOTP(username, otp);
        return successResponse(res, result, 'Login successful');
    } catch (error) {
        console.error('User OTP verification error:', error);

        if (error instanceof AuthError) {
            return errorResponse(res, error.message, error.statusCode);
        }

        return errorResponse(res, 'OTP verification failed', 500);
    }
};

/**
 * Handle token refresh with enhanced validation
 */
const handleRefreshToken = async (req, res) => {
    const { token } = req.body;

    try {
        // Check if token is blacklisted
        if (tokenStore.isTokenInvalid(token)) {
            throw new AuthError('Token has been revoked', 401);
        }

        // Decode the token payload (without verifying expiration)
        const decoded = jwt.decode(token);
        if (!decoded || !decoded.id) {
            throw new AuthError('Invalid token payload', 401);
        }

        // Get user data from database
        const user = await authController.getUserById(decoded.id);
        if (!user) {
            throw new AuthError('User not found', 404);
        }

        // Generate a new token
        const newToken = refreshTokenUtil(token);

        return successResponse(res, {
            user: {
                id: user.id,
                email: user.credential ? user.credential.email : null,
                username: user.credential ? user.credential.username : null,
                role: decoded.role || 'user'
            },
            token: newToken
        }, 'Token refreshed successfully');
    } catch (error) {
        console.error('User token refresh error:', error);

        if (error instanceof AuthError) {
            return errorResponse(res, error.message, error.statusCode);
        }

        return errorResponse(res, 'Failed to refresh token', 500);
    }
};

/**
 * User logout with proper token invalidation
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
        console.error('User logout error:', error);
        return errorResponse(res, 'Logout failed', 500);
    }
};

module.exports = {
    initiateLogin,
    verifyOTP,
    refreshToken: handleRefreshToken,
    logout
}