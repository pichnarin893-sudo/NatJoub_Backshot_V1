const { successResponse, errorResponse } = require('../../controllers/api/v1/baseApi.controller');
const roomController = require('../../controllers/api/v1/user/room.controller');
const { ValidationError, DatabaseError } = require('../../utils/errors');
const {upload, cloudinaryPhotoUtil} = require("../../utils/cloudinary.util");
const {validatePhoto} = require("../../middlewares/validation.middleware");
const multer = require("multer");

const uploadRoomPhotos = [
    upload.array('photos', 10), // Accept up to 10 photos
    ...validatePhoto,
    async (req, res) => {
        try{
            const { id } = req.query;
            const photos = req.files;

            console.log('Room ID:', id);
            console.log('Photos received:', photos ? photos.length : 0);
            console.log('Photo details:', photos?.map(f => ({
                filename: f.filename,
                path: f.path,
                size: f.size
            })));

            if (!id) {
                return errorResponse(res, 'Room ID is required', 400);
            }

            if (!photos || photos.length === 0) {
                return errorResponse(res, 'No photos provided', 400);
            }

            const result = await cloudinaryPhotoUtil.uploadRoomPhotos(id, photos);

            return successResponse(res, result, 'Photos uploaded successfully', 201);

        }catch (error){
            console.error('Upload room photos error:', error);

            if (error instanceof ValidationError) {
                return errorResponse(res, error.message, error.statusCode);
            }

            if (error instanceof DatabaseError) {
                return errorResponse(res, error.message, error.statusCode);
            }

            if (error.name === 'SequelizeUniqueConstraintError') {
                const field = error.errors[0]?.path || 'field';
                return errorResponse(res, `${field} already exists`, 409);
            }

            // Handle Multer file upload errors
            if (error instanceof multer.MulterError) {
                return errorResponse(res, error.message, 400);
            }

            return errorResponse(res, error.message, error.statusCode);
        }
    }
]


async function getAllRooms(req, res){
    try {
        const userId = req.user.id;
        const rooms = await roomController.getAllRooms(userId);
        return successResponse(res, rooms, 'Rooms retrieved successfully');
    }catch(error){
        return errorResponse(res, error.message || 'Failed to fetch rooms', 500);
    }
}

async function toggleFavoriteRoom(req, res) {
    try{
        const userId = req.user.id;
        const { roomId } = req.body;
        const favoriteRoom = await roomController.toggleFavoriteRoom(userId, roomId);
        return successResponse(res, favoriteRoom, 'Room added to favorites successfully');
    }catch (error){
        console.error('Error in toggleFavoriteRoom:', error);
        return errorResponse(res, error.message || 'Failed to toggle favorite room', 500);
    }
}

async function removeFavoriteRoom(req, res) {
    try{
        const userId = req.user.id;
        const { roomId } = req.body;
        const favoriteRoom = await roomController.removeFavoriteRoom(userId, roomId);
        return successResponse(res, favoriteRoom, 'Room removed successfully');
    }catch (error){
        console.error('Error in removeFavoriteRoom:', error);
        return errorResponse(res, error.message || 'Failed to removed favorite room', 500);
    }
}



async function getFavoriteRooms(req, res) {
    try{
        const userId = req.user.id;
        const favoriteRooms = await roomController.getFavoriteRooms(userId);
        return successResponse(res, favoriteRooms, 'Favorite rooms fetched successfully');
    }catch(error){
        console.error('Error in getFavoriteRooms:', error);
        return errorResponse(res, error.message || 'Failed to fetch favorite rooms', 500);
    }
}

async function getRoomsByBranch(req, res){
    try{
        const { branchId } = req.query;
        const user_id = req.user.id;
        const rooms = await roomController.getRoomsByBranch(branchId, user_id);
        return successResponse(res, rooms, 'Rooms by branch retrieved successfully');
    }catch (error){
        console.error('Error in getRoomsByBranch:', error);
        return errorResponse(res, error.message || 'Failed to fetch rooms by branch', 500);
    }
}

async function getRoomDetails(req, res){
    try{
        const { roomId } = req.query;
        const rooms = await roomController.getRoomDetails(roomId);
        return successResponse(res, rooms, 'Room detail retrieved successfully')
    }catch (error){
        console.error('Error in getRoomDetails:', error);
        return errorResponse(res, error.message || 'Failed to fetch room detail', 500);
    }
}

module.exports = {
    uploadRoomPhotos,
    toggleFavoriteRoom,
    getFavoriteRooms,
    getAllRooms,
    getRoomsByBranch,
    getRoomDetails,
    removeFavoriteRoom
}