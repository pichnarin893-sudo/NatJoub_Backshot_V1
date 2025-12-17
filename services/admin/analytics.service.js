const analyticsController = require('../../controllers/api/v1/admin/analytics.controller');
const { branches } = require('../../models');

class AnalyticsService {
    /**
     * ===========================================
     * ADMIN ENDPOINTS
     * ===========================================
     */

    /**
     * GET /api/admin/analytics/overview
     * Get platform-wide overview statistics
     * UPDATED: Now accepts optional branch_id and room_id query parameters for filtering
     */
    async getAdminOverview(req, res) {
        try {
            const { startDate, endDate, branch_id, room_id } = req.query;

            const data = await analyticsController.getAdminOverview({
                startDate,
                endDate,
                branch_id,
                room_id
            });

            res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            console.error('Error in getAdminOverview:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve admin overview',
                error: error.message
            });
        }
    }

    /**
     * GET /api/admin/analytics/revenue-trends
     * Get revenue trends over time
     * UPDATED: Now accepts optional branch_id and room_id query parameters for filtering
     */
    async getAdminRevenueTrends(req, res) {
        try {
            const { startDate, endDate, groupBy, branch_id, room_id } = req.query;

            const data = await analyticsController.getAdminRevenueTrends({
                startDate,
                endDate,
                groupBy,
                branch_id,
                room_id
            });

            res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            console.error('Error in getAdminRevenueTrends:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve revenue trends',
                error: error.message
            });
        }
    }

    /**
     * GET /api/admin/analytics/top-branches
     * Get top performing branches
     */
    async getTopBranches(req, res) {
        try {
            const { startDate, endDate, limit } = req.query;

            const data = await analyticsController.getTopBranches({
                startDate,
                endDate,
                limit: parseInt(limit) || 10
            });

            res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            console.error('Error in getTopBranches:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve top branches',
                error: error.message
            });
        }
    }

    /**
     * GET /api/admin/analytics/booking-status
     * Get booking status distribution
     * UPDATED: Now accepts optional branch_id and room_id query parameters for filtering
     */
    async getBookingStatusDistribution(req, res) {
        try {
            const { startDate, endDate, branch_id, room_id } = req.query;

            const data = await analyticsController.getBookingStatusDistribution({
                startDate,
                endDate,
                branch_id,
                room_id
            });

            res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            console.error('Error in getBookingStatusDistribution:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve booking status distribution',
                error: error.message
            });
        }
    }

    /**
     * GET /api/admin/analytics/top-customers
     * Get top customers by spending
     * UPDATED: Now accepts optional branch_id and room_id query parameters for filtering
     */
    async getTopCustomers(req, res) {
        try {
            const { startDate, endDate, limit, branch_id, room_id } = req.query;

            const data = await analyticsController.getTopCustomers({
                startDate,
                endDate,
                limit: parseInt(limit) || 10,
                branch_id,
                room_id
            });

            res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            console.error('Error in getTopCustomers:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve top customers',
                error: error.message
            });
        }
    }

    /**
     * GET /api/admin/analytics/room-utilization
     * Get room utilization rates across platform
     * UPDATED: Now accepts optional branch_id and room_id query parameters for filtering
     */
    async getRoomUtilization(req, res) {
        try {
            const { startDate, endDate, branch_id, room_id } = req.query;

            const data = await analyticsController.getRoomUtilization({
                startDate,
                endDate,
                branch_id,
                room_id
            });

            res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            console.error('Error in getRoomUtilization:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve room utilization',
                error: error.message
            });
        }
    }

    /**
     * ===========================================
     * STORE OWNER ENDPOINTS
     * ===========================================
     */

    /**
     * GET /api/owner/analytics/overview
     * Get owner dashboard overview
     */
    async getOwnerOverview(req, res) {
        try {
            const ownerId = req.user.id; // From authentication middleware
            const { startDate, endDate, branch_id, room_id } = req.query;

            const data = await analyticsController.getOwnerOverview(ownerId, {
                startDate,
                endDate,
                branch_id,
                room_id
            });

            res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            console.error('Error in getOwnerOverview:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve owner overview',
                error: error.message
            });
        }
    }

    /**
     * GET /api/owner/analytics/revenue-trends
     * Get owner revenue trends
     */
    async getOwnerRevenueTrends(req, res) {
        try {
            const ownerId = req.user.id;
            const { startDate, endDate, groupBy, branch_id, room_id } = req.query;

            const data = await analyticsController.getOwnerRevenueTrends(ownerId, {
                startDate,
                endDate,
                groupBy,
                branch_id,
                room_id
            });

            res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            console.error('Error in getOwnerRevenueTrends:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve revenue trends',
                error: error.message
            });
        }
    }

    /**
     * GET /api/owner/analytics/branch-performance
     * Get branch performance comparison
     */
    async getOwnerBranchPerformance(req, res) {
        try {
            const ownerId = req.user.id;
            const { startDate, endDate, branch_id } = req.query;

            const data = await analyticsController.getOwnerBranchPerformance(ownerId, {
                startDate,
                endDate,
                branch_id,
            });

            res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            console.error('Error in getOwnerBranchPerformance:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve branch performance',
                error: error.message
            });
        }
    }

    /**
     * GET /api/owner/analytics/branch/:branchId/rooms
     * Get room performance for specific branch
     */
    async getBranchRoomPerformance(req, res) {
        try {
            const { branchId } = req.params;
            const { startDate, endDate, room_id } = req.query;

            // Verify branch belongs to owner
            const branch = await branches.findOne({
                where: {
                    id: branchId,
                    owner_id: req.user.id
                }
            });

            if (!branch) {
                return res.status(403).json({
                    success: false,
                    message: 'Unauthorized access to branch'
                });
            }

            const data = await analyticsController.getBranchRoomPerformance(branchId, {
                startDate,
                endDate,
                room_id
            });

            res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            console.error('Error in getBranchRoomPerformance:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve room performance',
                error: error.message
            });
        }
    }

    /**
     * GET /api/owner/analytics/peak-hours
     * Get peak hours analysis
     */
    async getOwnerPeakHours(req, res) {
        try {
            const ownerId = req.user.id;
            const { startDate, endDate, branch_id, room_id } = req.query;

            const data = await analyticsController.getOwnerPeakHours(ownerId, {
                startDate,
                endDate,
                branch_id,
                room_id
            });

            res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            console.error('Error in getOwnerPeakHours:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve peak hours',
                error: error.message
            });
        }
    }

    /**
     * GET /api/owner/analytics/customers
     * Get customer insights
     */
    async getOwnerCustomerInsights(req, res) {
        try {
            const ownerId = req.user.id;
            const { startDate, endDate, limit, branch_id, room_id } = req.query;

            const data = await analyticsController.getOwnerCustomerInsights(ownerId, {
                startDate,
                endDate,
                limit: parseInt(limit) || 20,
                branch_id,
                room_id
            });

            res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            console.error('Error in getOwnerCustomerInsights:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve customer insights',
                error: error.message
            });
        }
    }
}

module.exports = new AnalyticsService();