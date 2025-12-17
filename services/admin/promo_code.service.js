const promoCodeController = require('../../controllers/api/v1/admin/promo_code.controller');
const { successResponse, errorResponse } = require('../../controllers/api/v1/baseApi.controller');

// CREATE PROMO CODE (Admin only)
const createPromoCode = async (req, res) => {
    try {
        const creatorId = req.user.id;
        const promoData = req.body;

        const promo_code = await promoCodeController.createPromoCode(promoData, creatorId);

        return successResponse(res, promo_code, 'Promo code created successfully', 201);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

// GET ALL PROMO CODES
const getAllPromoCode = async (req, res) => {
    try {
        const promoCodes = await promoCodeController.getAllPromoCode();
        return successResponse(res, promoCodes, 'Promo codes retrieved successfully');
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

// GET A SINGLE PROMO CODE
const getPromoCodeById = async (req, res) => {
    try {
        const { id } = req.params;
        const promo_code = await promoCodeController.getPromoCodeById(id);
        return successResponse(res, promo_code, 'Promo code retrieved successfully');
    } catch (error) {
        return errorResponse(res, error.message, 404);
    }
};

// UPDATE PROMO CODE
const updatePromoCode = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const updatedPromo = await promoCodeController.updatePromoCode(id, data);

        return successResponse(res, updatedPromo, 'Promo code updated successfully');
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

// DELETE PROMO CODE
const deletePromoCode = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await promoCodeController.deletePromoCode(id);
        return successResponse(res, result, 'Promo code deleted successfully');
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

module.exports = {
    createPromoCode,
    getAllPromoCode,
    getPromoCodeById,
    updatePromoCode,
    deletePromoCode
};
