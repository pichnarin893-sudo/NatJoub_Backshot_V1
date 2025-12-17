const { successResponse, errorResponse } = require('../../controllers/api/v1/baseApi.controller');
const filteringController = require('../../controllers/api/v1/user/filtering.controller');
const { ValidationError, DatabaseError } = require('../../utils/errors');
const { validateBranch } = require('../../middlewares/validation.middleware');

async function getFilteringRetrievalOptions(req, res) {
    try {
        const options = req.query;
        const result = await filteringController.filteringRetrieval(options);
        return successResponse(res, result, 'Filtered data fetched successfully');
    } catch (error) {
        console.error('Error in getFilteringRetrievalOptions:', error);
        return errorResponse(res, 'Failed to fetch data', 500);
    }
}

async function getRoomFilteringRetrievalOptions(req, res) {
    try {
        const { roomId } = req.query;
        const options = { ...(req.query || {}) };
        delete options.roomId;
        delete options.id;

        const result = await filteringController.filteringRoomRetrieval(roomId, options);
        return successResponse(res, result, 'Filtered data fetched successfully');
    } catch (error) {
        console.error('Error in getRoomFilteringRetrievalOptions:', error);
        return errorResponse(res, 'Failed to fetch data', 500);
    }
}


module.exports = {
    getFilteringRetrievalOptions,
    getRoomFilteringRetrievalOptions
}
