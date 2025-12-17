const {payments, bookings, users, sequelize } = require('../../../../models');

class HistoryController {

    /**
     * Build duration filter for booking history
     * Converts duration string to SQL date range filter
     *
     * @param {String} duration - 'current' | 'week' | 'month' | 'year'
     * @returns {String} SQL date condition
     */
    _buildDurationFilter(duration) {
        const now = new Date();
        let startDate, endDate;

        switch (duration) {
            case 'current':
                // Current day (today from 00:00:00 to 23:59:59)
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
                break;

            case 'week':
                // Current week (Monday to Sunday)
                const dayOfWeek = now.getDay();
                const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6);
                endDate.setHours(23, 59, 59);
                break;

            case 'month':
                // Current month (1st day to last day)
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
                break;

            case 'year':
                // Current year (Jan 1 to Dec 31)
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
                break;

            default:
                // Default to current day if invalid duration provided
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        }

        // Format dates for SQL (ISO format)
        const formatDate = (date) => date.toISOString();
        return `AND bk.start_time BETWEEN '${formatDate(startDate)}' AND '${formatDate(endDate)}'`;
    }


    /**
     * Get booking history for Admin (global or filtered)
     *
     * Admins can view all bookings across the platform with optional filtering
     * by branch, room, duration, payment status, date range, amount range, and discount status.
     *
     * @param {Object} filters - Query filters
     * @param {String} filters.branch_id - Optional: Filter by specific branch UUID
     * @param {String} filters.room_id - Optional: Filter by specific room UUID
     * @param {Number|String} filters.limit - Number of results (default: 10, use 'all' or 0 for no limit)
     * @param {Number} filters.offset - Optional: Number of records to skip (for pagination)
     * @param {String} filters.duration - Time period: 'all'|'current'|'week'|'month'|'year' (default: 'all')
     * @param {Array<String>} filters.payment_status - Optional: Array of payment statuses to filter
     * @param {Array<String>} filters.booking_status - Optional: Array of booking statuses to filter
     * @param {String} filters.start_date - Optional: Filter bookings from this date (YYYY-MM-DD)
     * @param {String} filters.end_date - Optional: Filter bookings until this date (YYYY-MM-DD)
     * @param {Number} filters.amount_min - Optional: Minimum payment amount
     * @param {Number} filters.amount_max - Optional: Maximum payment amount
     * @param {Boolean} filters.has_discount - Optional: Filter bookings with discount (true) or without (false)
     * @param {String} filters.sort_by - Optional: Sort field ('createdAt'|'startTime'|'amount'|'totalPrice') default: 'createdAt'
     * @param {String} filters.sort_order - Optional: Sort direction ('ASC'|'DESC') default: 'DESC'
     * @returns {Promise<Object>} Object containing bookings array and pagination info
     */
    async getAdminBookingHistory(filters = {}) {
        const {
            branch_id,
            room_id,
            limit = 10,
            offset = 0,
            duration = 'all',
            payment_status,
            booking_status,
            start_date,
            end_date,
            amount_min,
            amount_max,
            has_discount,
            sort_by = 'createdAt',
            sort_order = 'DESC'
        } = filters;

        const replacements = {};

        // Duration filter - only apply if NOT 'all'
        let durationFilter = '';
        if (duration && duration !== 'all') {
            durationFilter = this._buildDurationFilter(duration);
        }

        // Branch filter
        let branchCondition = '';
        if (branch_id) {
            branchCondition = `AND b.id = :branchId`;
            replacements.branchId = branch_id;
        }

        // Room filter
        let roomCondition = '';
        if (room_id) {
            roomCondition = `AND r.id = :roomId`;
            replacements.roomId = room_id;
        }

        // Payment status filter
        let paymentStatusFilter = '';
        if (payment_status && Array.isArray(payment_status) && payment_status.length > 0) {
            const validStatuses = ['pending', 'completed', 'failed', 'expired', 'cancelled', 'refunded'];
            const sanitizedStatuses = payment_status.filter(status => validStatuses.includes(status));

            if (sanitizedStatuses.length > 0) {
                paymentStatusFilter = `AND p.payment_status IN (:paymentStatuses)`;
                replacements.paymentStatuses = sanitizedStatuses;
            }
        }

        // Booking status filter
        let bookingStatusFilter = '';
        if (booking_status && Array.isArray(booking_status) && booking_status.length > 0) {
            const validStatuses = ['pending', 'completed', 'cancelled', 'failed', 'expired'];
            const sanitizedStatuses = booking_status.filter(status => validStatuses.includes(status));

            if (sanitizedStatuses.length > 0) {
                bookingStatusFilter = `AND bk.status IN (:bookingStatuses)`;
                replacements.bookingStatuses = sanitizedStatuses;
            }
        }

        // Date range filter (by booking start_time)
        let dateFilter = '';
        if (start_date) {
            dateFilter += `AND bk.start_time >= :startDate`;
            replacements.startDate = `${start_date}T00:00:00.000Z`;
        }
        if (end_date) {
            dateFilter += ` AND bk.start_time <= :endDate`;
            replacements.endDate = `${end_date}T23:59:59.999Z`;
        }

        // Amount range filter
        let amountFilter = '';
        if (amount_min !== undefined && amount_min !== null && !isNaN(amount_min)) {
            amountFilter += `AND p.amount >= :amountMin`;
            replacements.amountMin = parseFloat(amount_min);
        }
        if (amount_max !== undefined && amount_max !== null && !isNaN(amount_max)) {
            amountFilter += ` AND p.amount <= :amountMax`;
            replacements.amountMax = parseFloat(amount_max);
        }

        // Discount filter
        let discountFilter = '';
        if (has_discount === true || has_discount === 'true') {
            discountFilter = `AND p.discount_amount > 0`;
        } else if (has_discount === false || has_discount === 'false') {
            discountFilter = `AND (p.discount_amount = 0 OR p.discount_amount IS NULL)`;
        }

        // Sort validation
        const validSortFields = {
            'createdAt': 'bk."createdAt"',
            'startTime': 'bk.start_time',
            'amount': 'p.amount',
            'totalPrice': 'bk.total_price'
        };
        const sortField = validSortFields[sort_by] || 'bk."createdAt"';
        const sortDirection = sort_order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        // Limit and Offset - handle 'all' or 0 for no limit
        let limitClause = '';
        let offsetClause = '';

        const parsedLimit = limit === 'all' || limit === 0 || limit === '0' ? null : parseInt(limit);
        const parsedOffset = parseInt(offset) || 0;

        if (parsedLimit && parsedLimit > 0) {
            limitClause = `LIMIT :limit`;
            replacements.limit = parsedLimit;
        }

        if (parsedOffset > 0) {
            offsetClause = `OFFSET :offset`;
            replacements.offset = parsedOffset;
        }

        // Build WHERE clause
        const whereClause = `
        WHERE 1=1
            ${durationFilter}
            ${branchCondition}
            ${roomCondition}
            ${paymentStatusFilter}
            ${bookingStatusFilter}
            ${dateFilter}
            ${amountFilter}
            ${discountFilter}
    `;

        // Count query for pagination
        const countQuery = `
            SELECT COUNT(*) as total
            FROM bookings bk
                     INNER JOIN payments p ON bk.id = p.booking_id
                     INNER JOIN users u ON bk.customer_id = u.id
                     INNER JOIN rooms r ON bk.room_id = r.id
                     INNER JOIN branches b ON r.branch_id = b.id
                ${whereClause}
        `;

        // Main query
        const query = `
            SELECT
                bk.id as "bookingId",
                p.transaction_id as "transactionId",
                bk.start_time as "startTime",
                bk.end_time as "endTime",
                p.payment_status as "paymentStatus",
                p.amount as "amount",
                p.refund_amount as "refundAmount",
                p.discount_amount as "discountAmount",
                p.payment_method as "paymentMethod",
                p.transaction_date as "transactionDate",
                u.first_name || ' ' || u.last_name as "customerName",
                r.room_no as "roomNo",
                b.branch_name as "branchName",
                bk.status as "bookingStatus",
                bk.total_price as "totalPrice",
                bk."createdAt" as "createdAt"
            FROM bookings bk
                     INNER JOIN payments p ON bk.id = p.booking_id
                     INNER JOIN users u ON bk.customer_id = u.id
                     INNER JOIN rooms r ON bk.room_id = r.id
                     INNER JOIN branches b ON r.branch_id = b.id
                ${whereClause}
            ORDER BY ${sortField} ${sortDirection}
                     ${limitClause}
                     ${offsetClause}
        `;

        // Execute both queries
        const [countResult, results] = await Promise.all([
            sequelize.query(countQuery, {
                replacements,
                type: sequelize.QueryTypes.SELECT
            }),
            sequelize.query(query, {
                replacements,
                type: sequelize.QueryTypes.SELECT
            })
        ]);

        const total = parseInt(countResult[0]?.total) || 0;

        const bookings = results.map(booking => ({
            bookingId: booking.bookingId,
            transactionId: booking.transactionId,
            startTime: booking.startTime,
            endTime: booking.endTime,
            paymentStatus: booking.paymentStatus,
            amount: parseFloat(booking.amount),
            refundAmount: parseFloat(booking.refundAmount) || 0,
            discountAmount: parseFloat(booking.discountAmount) || 0,
            paymentMethod: booking.paymentMethod,
            transactionDate: booking.transactionDate,
            customerName: booking.customerName,
            roomNo: booking.roomNo,
            branchName: booking.branchName,
            bookingStatus: booking.bookingStatus,
            totalPrice: parseFloat(booking.totalPrice),
            createdAt: booking.createdAt
        }));

        // Flattened response - pagination at same level as bookings
        return {
            bookings,
            total,
            limit: parsedLimit,
            offset: parsedOffset,
            hasMore: parsedLimit ? (parsedOffset + bookings.length) < total : false
        };
    }


    /**
     * Get booking history for Owner (scoped to owner's branches)
     *
     * Owners can only view bookings from their own branches, with optional
     * filtering by specific branch, room, duration, payment status, date range,
     * amount range, and discount status.
     *
     * @param {String} ownerId - Owner user ID (from authentication)
     * @param {Object} filters - Query filters
     * @param {String} filters.branch_id - Optional: Filter by specific branch UUID (must be owned by this owner)
     * @param {String} filters.room_id - Optional: Filter by specific room UUID (must be in owner's branches)
     * @param {Number|String} filters.limit - Number of results (default: 10, use 'all' or 0 for no limit)
     * @param {Number} filters.offset - Optional: Number of records to skip (for pagination)
     * @param {String} filters.duration - Time period: 'all'|'current'|'week'|'month'|'year' (default: 'all')
     * @param {Array<String>} filters.payment_status - Optional: Array of payment statuses to filter
     * @param {Array<String>} filters.booking_status - Optional: Array of booking statuses to filter
     * @param {String} filters.start_date - Optional: Filter bookings from this date (YYYY-MM-DD)
     * @param {String} filters.end_date - Optional: Filter bookings until this date (YYYY-MM-DD)
     * @param {Number} filters.amount_min - Optional: Minimum payment amount
     * @param {Number} filters.amount_max - Optional: Maximum payment amount
     * @param {Boolean} filters.has_discount - Optional: Filter bookings with discount (true) or without (false)
     * @param {String} filters.sort_by - Optional: Sort field ('createdAt'|'startTime'|'amount'|'totalPrice') default: 'createdAt'
     * @param {String} filters.sort_order - Optional: Sort direction ('ASC'|'DESC') default: 'DESC'
     * @returns {Promise<Object>} Object containing bookings array and pagination info
     */
    async getOwnerBookingHistory(ownerId, filters = {}) {
        const {
            branch_id,
            room_id,
            limit = 10,
            offset = 0,
            duration = 'all',
            payment_status,
            booking_status,
            start_date,
            end_date,
            amount_min,
            amount_max,
            has_discount,
            sort_by = 'createdAt',
            sort_order = 'DESC'
        } = filters;

        const replacements = { ownerId };

        // Duration filter - only apply if NOT 'all'
        let durationFilter = '';
        if (duration && duration !== 'all') {
            durationFilter = this._buildDurationFilter(duration);
        }

        // Branch filter
        let branchCondition = '';
        if (branch_id) {
            branchCondition = `AND b.id = :branchId`;
            replacements.branchId = branch_id;
        }

        // Room filter
        let roomCondition = '';
        if (room_id) {
            roomCondition = `AND r.id = :roomId`;
            replacements.roomId = room_id;
        }

        // Payment status filter
        let paymentStatusFilter = '';
        if (payment_status && Array.isArray(payment_status) && payment_status.length > 0) {
            const validStatuses = ['pending', 'completed', 'failed', 'expired', 'cancelled', 'refunded'];
            const sanitizedStatuses = payment_status.filter(status => validStatuses.includes(status));

            if (sanitizedStatuses.length > 0) {
                paymentStatusFilter = `AND p.payment_status IN (:paymentStatuses)`;
                replacements.paymentStatuses = sanitizedStatuses;
            }
        }

        // Booking status filter
        let bookingStatusFilter = '';
        if (booking_status && Array.isArray(booking_status) && booking_status.length > 0) {
            const validStatuses = ['pending', 'completed', 'cancelled', 'failed', 'expired'];
            const sanitizedStatuses = booking_status.filter(status => validStatuses.includes(status));

            if (sanitizedStatuses.length > 0) {
                bookingStatusFilter = `AND bk.status IN (:bookingStatuses)`;
                replacements.bookingStatuses = sanitizedStatuses;
            }
        }

        // Date range filter (by booking start_time)
        let dateFilter = '';
        if (start_date) {
            dateFilter += `AND bk.start_time >= :startDate`;
            replacements.startDate = `${start_date}T00:00:00.000Z`;
        }
        if (end_date) {
            dateFilter += ` AND bk.start_time <= :endDate`;
            replacements.endDate = `${end_date}T23:59:59.999Z`;
        }

        // Amount range filter
        let amountFilter = '';
        if (amount_min !== undefined && amount_min !== null && !isNaN(amount_min)) {
            amountFilter += `AND p.amount >= :amountMin`;
            replacements.amountMin = parseFloat(amount_min);
        }
        if (amount_max !== undefined && amount_max !== null && !isNaN(amount_max)) {
            amountFilter += ` AND p.amount <= :amountMax`;
            replacements.amountMax = parseFloat(amount_max);
        }

        // Discount filter
        let discountFilter = '';
        if (has_discount === true || has_discount === 'true') {
            discountFilter = `AND p.discount_amount > 0`;
        } else if (has_discount === false || has_discount === 'false') {
            discountFilter = `AND (p.discount_amount = 0 OR p.discount_amount IS NULL)`;
        }

        // Sort validation
        const validSortFields = {
            'createdAt': 'bk."createdAt"',
            'startTime': 'bk.start_time',
            'amount': 'p.amount',
            'totalPrice': 'bk.total_price'
        };
        const sortField = validSortFields[sort_by] || 'bk."createdAt"';
        const sortDirection = sort_order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        // Limit and Offset - handle 'all' or 0 for no limit
        let limitClause = '';
        let offsetClause = '';

        const parsedLimit = limit === 'all' || limit === 0 || limit === '0' ? null : parseInt(limit);
        const parsedOffset = parseInt(offset) || 0;

        if (parsedLimit && parsedLimit > 0) {
            limitClause = `LIMIT :limit`;
            replacements.limit = parsedLimit;
        }

        if (parsedOffset > 0) {
            offsetClause = `OFFSET :offset`;
            replacements.offset = parsedOffset;
        }

        // Build WHERE clause
        const whereClause = `
        WHERE b.owner_id = :ownerId
            ${durationFilter}
            ${branchCondition}
            ${roomCondition}
            ${paymentStatusFilter}
            ${bookingStatusFilter}
            ${dateFilter}
            ${amountFilter}
            ${discountFilter}
    `;

        // Count query for pagination
        const countQuery = `
            SELECT COUNT(*) as total
            FROM bookings bk
                     INNER JOIN payments p ON bk.id = p.booking_id
                     INNER JOIN users u ON bk.customer_id = u.id
                     INNER JOIN rooms r ON bk.room_id = r.id
                     INNER JOIN branches b ON r.branch_id = b.id
                ${whereClause}
        `;

        // Main query
        const query = `
            SELECT
                bk.id as "bookingId",
                p.transaction_id as "transactionId",
                bk.start_time as "startTime",
                bk.end_time as "endTime",
                p.payment_status as "paymentStatus",
                p.amount as "amount",
                p.refund_amount as "refundAmount",
                p.discount_amount as "discountAmount",
                p.payment_method as "paymentMethod",
                p.transaction_date as "transactionDate",
                u.first_name || ' ' || u.last_name as "customerName",
                r.room_no as "roomNo",
                b.branch_name as "branchName",
                bk.status as "bookingStatus",
                bk.total_price as "totalPrice",
                bk."createdAt" as "createdAt"
            FROM bookings bk
                     INNER JOIN payments p ON bk.id = p.booking_id
                     INNER JOIN users u ON bk.customer_id = u.id
                     INNER JOIN rooms r ON bk.room_id = r.id
                     INNER JOIN branches b ON r.branch_id = b.id
                ${whereClause}
            ORDER BY ${sortField} ${sortDirection}
                     ${limitClause}
                     ${offsetClause}
        `;

        // Execute both queries
        const [countResult, results] = await Promise.all([
            sequelize.query(countQuery, {
                replacements,
                type: sequelize.QueryTypes.SELECT
            }),
            sequelize.query(query, {
                replacements,
                type: sequelize.QueryTypes.SELECT
            })
        ]);

        const total = parseInt(countResult[0]?.total) || 0;

        const bookings = results.map(booking => ({
            bookingId: booking.bookingId,
            transactionId: booking.transactionId,
            startTime: booking.startTime,
            endTime: booking.endTime,
            paymentStatus: booking.paymentStatus,
            amount: parseFloat(booking.amount),
            refundAmount: parseFloat(booking.refundAmount) || 0,
            discountAmount: parseFloat(booking.discountAmount) || 0,
            paymentMethod: booking.paymentMethod,
            transactionDate: booking.transactionDate,
            customerName: booking.customerName,
            roomNo: booking.roomNo,
            branchName: booking.branchName,
            bookingStatus: booking.bookingStatus,
            totalPrice: parseFloat(booking.totalPrice),
            createdAt: booking.createdAt
        }));

        // Flattened response - pagination at same level as bookings
        return {
            bookings,
            total,
            limit: parsedLimit,
            offset: parsedOffset,
            hasMore: parsedLimit ? (parsedOffset + bookings.length) < total : false
        };
    }
}

module.exports = new HistoryController();
