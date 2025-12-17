const { successResponse, errorResponse } = require('../../controllers/api/v1/baseApi.controller');
const smsAuthController = require('../../controllers/api/v1/user/sms.auth.controller');
const { refreshTokenUtil, verifyToken } = require('../../utils/jwt.util');
const tokenStore = require('../../utils/secureStore');
const jwt = require('jsonwebtoken');

/**
 * initial login step - validate phone number and send OTP
 */

const initialSmsLogin = async (req, res) => {
    const { phone_number } = req.body;

    if (!phone_number) {
        return errorResponse(res, 'Phone number is required', 400);
    }

    try{
        const result = await smsAuthController.initialSmsLogin(phone_number);
        if(!result){
            return errorResponse(res, 'Phone number not registered', 404);
        }

        const otpSent = result.verificationTo === phone_number;
        if(!otpSent){
            console.error('Failed to send OTP to:', phone_number);
            // continue process but log the failure
        }

        return successResponse(res, {
            userId: result.userId,
            phoneNumber: result.phoneNumber,
            role: result.role,
            requiresOTP: true,
            verificationTo: result.verificationTo,
            verificationStatus: result.verificationStatus
        }, 'OTP sent successfully');

    }catch(error){
        console.error('SMS Login error:', error);
        if (error.message.includes('Invalid phone number format')) {
            return errorResponse(res, error.message, 400);
        } else if (error.message.includes('Phone number not registered')) {
            return errorResponse(res, error.message, 404);
        } else if (error.message.includes('Unauthorized role for SMS login')) {
            return errorResponse(res, error.message, 403);
        }
    }
}


/**
 * verify OTP and complete login process
 */

const verifySmsOTP = async (req, res) => {
    const { phone_number, otp } = req.body;

    if (!phone_number || !otp) {
        return errorResponse(res, 'Phone number and OTP are required', 400);
    }

    try{
        const result = await smsAuthController.verifySmsOTP(phone_number, otp);
        return successResponse(res, result, 'Login successful');
    }catch(error){
        return errorResponse(res, error.message || 'OTP verification failed',
            error.message.includes('Invalid') ? 401 : 500);
    }
}

/**
 * handle refresh token
 */

const handleRefreshToken = async (req, res) => {
    const { token } = req.body;

    if(!token){
        return errorResponse(res, 'Refresh token is required', 400);
    }

    try{
        //decode token payload without verification expiration
        const decoded = jwt.decode(token);
        if(!decoded || !decoded.id){
            return errorResponse(res, 'Invalid token payload', 401);
        }

        //get user data from database
        const user = await smsAuthController.getUserById(decoded.id);
        if(!user){
            return errorResponse(res, 'User not found', 404);
        }

        //generate new token a refresh token
        let newToken;
        try{
             newToken = refreshTokenUtil(token);
        }catch(err){
            return errorResponse(res, 'Failed to refresh token', 401);
        }

        return successResponse(res, { user, token: newToken}, 'Token refreshed successfully');

    }catch(error){
        return errorResponse(res, 'Failed to refresh token', 500);
    }
}

/**
 * logout user by blacklisting their token
 */
const logout = async (req, res) => {
    try{
        const token = req.headers.authorization?.replace('Bearer ', '');
        if(token){
            let decoded;
            try{
                decoded = jwt.decode(token);
                if(!decoded){
                    tokenStore.invalidateToken(token, decoded.exp);
                }
            }catch (err){
                // if token can't be decoded, just continue
            }
        }
    }catch(error){
        return errorResponse(res,  'Failed to logout', 500);
    }
}


module.exports = {
    initialSmsLogin,
    verifySmsOTP,
    handleRefreshToken,
    logout
}