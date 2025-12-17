const { successResponse, errorResponse } = require('../../controllers/api/v1/baseApi.controller');
const roomController = require('../../controllers/api/v1/admin/room.controller');
const { ValidationError, DatabaseError } = require('../../utils/errors');
const { roomValidation, roomUpdateValidation, validateBranch, validateUpdateBranch} = require('../../middlewares/validation.middleware');
const branchController = require("../../controllers/api/v1/admin/branch.controller");

const createRoom = [
    ...roomValidation,
    async (req, res) => {
        try{
            const {branch_id} = req.query;
            const branchData = req.body;
            const result = await roomController.createRoom(branch_id, branchData);

            return successResponse(res, result, 'Room created successfully', 201);

        }catch (error){
            console.error('Admin create room error:', error);

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

            return errorResponse(res, 'Failed to create room', 500);
        }
    }
]

const getAllRooms = async (req, res) => {
    try {
        const rooms = await roomController.getRooms();
        return successResponse(res, rooms, 'Rooms retrieved successfully');
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
}

const getRoomById = async (req, res) => {
    const { id } = req.query;
    try {
        const room = await roomController.getRoomById(id);
        if (!room) {
            return errorResponse(res, 'Room not found', 404);
        }
        return successResponse(res, room, 'Room retrieved successfully');
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
}

const updateRoom = [
    ...roomUpdateValidation,
    async (req, res) => {
        const { id } = req.query;
        const roomData = req.body;
        try {
            const result = await roomController.updateRoom(id, roomData);
            return successResponse(res, result, 'Room updated successfully');
        }catch (error){
            console.error('Admin update room error:', error);}
    }
]

const deleteRoom = async (req, res) => {
    const { id } = req.query;
    try {
        const result = await roomController.deleteRoom(id);
        return successResponse(res, result, 'Room deleted successfully');
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
}


module.exports = {
    createRoom,
    getAllRooms,
    getRoomById,
    updateRoom,
    deleteRoom
}