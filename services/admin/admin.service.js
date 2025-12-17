const { successResponse, errorResponse } = require('../../controllers/api/v1/baseApi.controller');
const adminController = require('../../controllers/api/v1/admin/admin.controller');
const { ValidationError, DatabaseError } = require('../../utils/errors');
const { validateUserCreation } = require('../../middlewares/validation.middleware');

/**
 * Create user service with comprehensive validation and error handling
 */
const createUser = [
    ...validateUserCreation,
    async (req, res) => {
        try {
            const userData = req.body;
            const result = await adminController.createUser(userData);

            return successResponse(res, result, 'User created successfully', 201);
        } catch (error) {
            console.error('Admin create user error:', error);

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

async function getAllUesrs(req, res){
    try{
        const result = await adminController.getAllUsers();
        return successResponse(res, result, 'All users', 201);

    }catch (error){
        console.error('Admin getAllUsers error:', error);
        return errorResponse(res, 'Failed to get all users', 500);
    }
}

module.exports = {
    createUser,
    getAllUesrs
};