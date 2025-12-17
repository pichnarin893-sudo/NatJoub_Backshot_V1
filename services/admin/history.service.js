const bookingHistoryController = require('../../controllers/api/v1/admin/history.controller');

class HistoryService {

    /**
     *
     * - branch_id (optional): UUID - Filter by specific branch
     * - room_id (optional): UUID - Filter by specific room
     * - limit (optional): Number - Number of results (default: 10)
     * - duration (optional): String - 'current'|'week'|'month'|'year' (default: 'current')
     * - payment_status (optional): Array - Payment statuses to filter
     *
     * @param {Object} req
     * @param {Object} res
     */
    async getAdminBookingHistory(req, res) {
        try {
            const { branch_id, room_id, limit, duration, payment_status } = req.query;

            let parsedPaymentStatus = payment_status;
            if (typeof payment_status === 'string') {
                parsedPaymentStatus = payment_status.split(',').map(s => s.trim());
            }

            const data = await bookingHistoryController.getAdminBookingHistory({
                branch_id,
                room_id,
                limit: limit ? parseInt(limit) : undefined,
                duration,
                payment_status: parsedPaymentStatus
            });

            res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            console.error('Error in getAdminBookingHistory:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve booking history',
                error: error.message
            });
        }
    }


    /**
     * @param {Object} req
     * @param {Object} res
     */
    async getOwnerBookingHistory(req, res) {
        try {
            const ownerId = req.user.id;
            const { branch_id, room_id, limit, duration, payment_status } = req.query;

            let parsedPaymentStatus = payment_status;
            if (typeof payment_status === 'string') {
                parsedPaymentStatus = payment_status.split(',').map(s => s.trim());
            }

            const data = await bookingHistoryController.getOwnerBookingHistory(ownerId, {
                branch_id,
                room_id,
                limit: limit ? parseInt(limit) : undefined,
                duration,
                payment_status: parsedPaymentStatus
            });

            res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            console.error('Error in getOwnerBookingHistory:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve booking history',
                error: error.message
            });
        }
    }
}

module.exports = new HistoryService();
