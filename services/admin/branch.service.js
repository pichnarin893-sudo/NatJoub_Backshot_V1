const { successResponse, errorResponse } = require('../../controllers/api/v1/baseApi.controller');
const branchController = require('../../controllers/api/v1/admin/branch.controller');
const { ValidationError, DatabaseError } = require('../../utils/errors');
const { validateBranch, validateUpdateBranch } = require('../../middlewares/validation.middleware');

const createBranch = [
    ...validateBranch,
    async (req, res) => {
    try{
        const branchData = req.body;
        const result = await branchController.createBranch(branchData);

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

const getAllBranches = async (req, res) => {
    try {
        const branches = await branchController.getBranches();
        return successResponse(res, branches, 'Branches retrieved successfully');
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
}

const getBranchById = async (req, res) => {
    const { id } = req.query;
    try {
        const branch = await branchController.getBranchById(id);
        if (!branch) {
            return errorResponse(res, 'Branch not found', 404);
        }
        return successResponse(res, branch, 'Branch retrieved successfully');
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
}

const updateBranch = [
    ...validateUpdateBranch,
    async (req, res) => {
    const { id } = req.query;
    const branchData = req.body;
    try {
        const result = await branchController.updateBranch(id, branchData);
        return successResponse(res, result, 'Branch updated successfully');
    }catch (error){
    console.error('Admin update branch error:', error);}
    }
]

const deleteBranch = async (req, res) => {
    const { id } = req.query;
    try {
        const result = await branchController.deleteBranch(id);
        return successResponse(res, result, 'Branch deleted successfully');
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
}

const viewRoomsInBranch = async (req, res) => {
    const { branchId } = req.query;
    try {
        const branch = await branchController.viewRoomsInBranch(branchId);
        if (!branch) {
            return errorResponse(res, 'Branch/Rooms not found', 404);
        }
        return successResponse(res, branch, 'Branch/Rooms retrieved successfully');
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
}

module.exports = {
    createBranch,
    getAllBranches,
    getBranchById,
    updateBranch,
    deleteBranch,
    viewRoomsInBranch
}