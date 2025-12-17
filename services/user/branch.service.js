const { successResponse, errorResponse } = require('../../controllers/api/v1/baseApi.controller');
const branchController = require('../../controllers/api/v1/user/branch.controller');
const { ValidationError, DatabaseError } = require('../../utils/errors');
const { validateBranch, validatePhoto} = require('../../middlewares/validation.middleware');
const branchService = require("../../controllers/api/v1/user/branch.controller");
const multer = require('multer');
const {cloudinaryPhotoUtil, upload} = require("../../utils/cloudinary.util");

const requestCreateBranch = [
    ...validateBranch,
    async (req, res) => {
        try{
            const branchData = req.body;
            const userId = req.user.id;

            console.log(userId);

            const result = await branchController.requestBranchCreation(userId,branchData);

            return successResponse(res, result, 'Branch created successfully', 201);

        }catch (error){
            console.error('Admin create branch error:', error);

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

            return errorResponse(res, 'Failed to create branch', 500);
        }
    }
]

const uploadBranchPhotos = [
    upload.array('photos', 10), // Accept up to 10 photos
    ...validatePhoto,
    async (req, res) => {
    try{
        const { id } = req.query;
        const photos = req.files;


        console.log('Branch ID:', id);
        console.log('Photos received:', photos ? photos.length : 0);
        console.log('Photo details:', photos?.map(f => ({
            filename: f.filename,
            path: f.path,
            size: f.size
        })));

        if (!id) {
            return errorResponse(res, 'Branch ID is required', 400);
        }

        if (!photos || photos.length === 0) {
            return errorResponse(res, 'No photos provided', 400);
        }

        const result = await cloudinaryPhotoUtil.uploadBranchPhotos(id, photos);

        return successResponse(res, result, 'Photos uploaded successfully', 201);

    }catch (error){
        console.error('Upload branch photos error:', error);

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

async function deletePhoto(req, res){
    try{
        const { imageId } = req.query;
        const result = await cloudinaryPhotoUtil.deletePhoto(imageId);
        return successResponse(res, result, 'Photo deleted successfully');

    }catch (error){
        return errorResponse(res, error.message || 'Failed to delete photo', 500);
    }
}

async function getBranchPhotos(req, res){
    try{
        const { branchId } = req.query;
        const photos = await cloudinaryPhotoUtil.getBranchPhotos(branchId);
        return successResponse(res, photos, 'Branch photos retrieved successfully');
    }catch (error){
        return errorResponse(res, error.message || 'Failed to fetch branch photos', 500);
    }
}

async function getBranchByOwner(req, res){
    try{
        const ownerId = req.user.id;
        const branch = await branchService.getBranchesByOwner(ownerId);
        return successResponse(res, branch, 'Branch retrieved successfully');
    }catch(error){
        return errorResponse(res, error.message || 'Failed to fetch branch', 500);
    }
}

async function getRoomByBranch(req, res){
    try{
        const ownerId = req.user.id;
        const { branchId } = req.query;
        const rooms = await branchService.getRoomByBranch(ownerId, branchId);
        return successResponse(res, rooms, 'Rooms retrieved successfully');
    }catch(error){
        return errorResponse(res, error.message || 'Failed to fetch rooms for branch', 500);
    }
}

async function getBranchDetails(req, res){
    try{
        const { branchId } = req.query;
        const branchDetails = await branchService.getBranchDetails(branchId);
        return successResponse(res, branchDetails, 'Branch details retrieved successfully');
    }catch (error){
        console.error('Admin getBranchDetails error:', error);
        return errorResponse(res, error.message || 'Failed to fetch branch details', 500);
    }
}


module.exports = {
    requestCreateBranch,
    uploadBranchPhotos,
    getBranchByOwner,
    getRoomByBranch,
    getBranchPhotos,
    getBranchDetails,
    deletePhoto
}