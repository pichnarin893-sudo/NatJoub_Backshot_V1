const promotionController = require('../../controllers/api/v1/owner/promotion.controller');
const { successResponse, errorResponse } = require('../../controllers/api/v1/baseApi.controller');

const createPromotion = async (req, res) => {
    try {
        const creatorId = req.user.id;
        const promotionData = req.body;

        const promotion = await promotionController.createPromotion(promotionData, creatorId);

        return successResponse(res, promotion, 'Promotion created successfully', 201);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

const getAllPromotions = async (req, res) => {
    try {
        const promotions = await promotionController.getAllPromotions();
        return successResponse(res, promotions, 'Promotions retrieved successfully');
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

const getPromotionById = async (req, res) => {
    try {
        const { id } = req.params;
        const promotion = await promotionController.getPromotionById(id);
        return successResponse(res, promotion, 'Promotion retrieved successfully');
    } catch (error) {
        return errorResponse(res, error.message, 404);
    }
};

const updatePromotion = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const updatedPromotion = await promotionController.updatePromotion(id, data);

        return successResponse(res, updatedPromotion, 'Promotion updated successfully');
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

const deletePromotion = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await promotionController.deletePromotion(id);
        return successResponse(res, result, 'Promotion deleted successfully');
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

const attachPromotionHandler = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const result = await promotionController.attachPromotion(id, data);

        return successResponse(res, result, "Promotion attached successfully");
    } catch (error) {
        return errorResponse(res, error.message, 400);
    }
};

module.exports = {
    createPromotion,
    getAllPromotions,
    getPromotionById,
    updatePromotion,
    deletePromotion,
    attachPromotionHandler
};
