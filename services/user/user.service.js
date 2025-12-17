const userController = require('../../controllers/api/v1/user/user.controller');
const { successResponse, errorResponse } = require('../../controllers/api/v1/baseApi.controller');
const {validateUserRegistration} = require("../../middlewares/validation.middleware");
const {ValidationError} = require("sequelize");
const {DatabaseError} = require("pg");


/**
 * Create user service with comprehensive validation and error handling
 */
const createUser = [
    ...validateUserRegistration,
    async (req, res) => {
        try {
            const userData = req.body;
            const result = await userController.createUser(userData);

            return successResponse(res, result, 'User created successfully', 201);
        } catch (error) {
            console.error('User registration error:', error);

            if (error instanceof ValidationError) {
                return errorResponse(res, error.message, error.statusCode);
            }

            if (error instanceof DatabaseError) {
                return errorResponse(res, error.message, error.statusCode);
            }

            // Handle Sequelize unique constraint errors
            if (error.name === 'SequelizeUniqueConstraintError') {
                const field = error.errors[0]?.path || 'field';
                return errorResponse(res, `${field} already exists`, 409);
            }

            return errorResponse(res, 'Failed to create user', 500);
        }
    }
];


//Get User name by ID
async function getUserById(req, res) {
    const userId = req.user.id;
    try {
        const user = await userController.getUserById(userId);
        if (!user) {
            return errorResponse(res, 'User not found', 404);
        }
        return successResponse(res, user, 'User retrieved successfully');
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
}

async function verifyRegistrationOTP(req, res) {
    try{
        const { userId, otp } = req.body;
        const result = await userController.verifyRegistrationOTP(userId, otp);
        return successResponse(res, result, 'OTP verified successfully');
    }catch (error){
        return errorResponse(res, error.message, 500);
    }
}

async function resendRegistrationOTP(req, res) {
    try{
        const { userId } = req.body;
        const result = await userController.resendRegistrationOTP(userId);
        return successResponse(res, result, 'OTP resent successfully');
    }catch (error){
        return errorResponse(res, error.message, 500);
    }
}



module.exports = {
    getUserById,
    createUser,
    verifyRegistrationOTP,
    resendRegistrationOTP
};