const { Op, fn, col, literal } = require('sequelize');
const { users, branches, rooms, bookings, roles, sequelize } = require('../../../../models');

class AnalyticsController {
    /**
     * ===========================================
     * ADMIN ANALYTICS
     * ===========================================
     */

    /**
     * Get platform-wide overview statistics
     * UPDATED: Now supports optional filtering by branch_id or room_id
     * @param {Object} filters - { startDate, endDate, branch_id, room_id }
     */
    async getAdminOverview(filters = {}) {
        const { startDate, endDate, branch_id, room_id } = filters;
        const dateFilter = this._buildDateFilter(startDate, endDate);

        // ADDED: Build branch/room filter for bookings queries
        const bookingFilter = this._buildBranchRoomFilter(branch_id, room_id);

        const [
            totalRevenue,
            totalBookings,
            totalBranches,
            totalRooms,
            totalCustomers,
            activeOwners,
            averageBookingValue,
            completionRate
        ] = await Promise.all([
            // Total Revenue - UPDATED: Added branch/room filtering via includes
            this._getSumWithFilter('total_price', {
                status: 'completed',
                ...dateFilter
            }, bookingFilter),

            // Total Bookings - UPDATED: Added branch/room filtering
            this._getCountWithFilter(dateFilter, bookingFilter),

            // Total Branches - UPDATED: Filter to specific branch if provided
            branches.count({
                where: {
                    is_active: true,
                    ...(branch_id && { id: branch_id })
                }
            }),

            // Total Rooms - UPDATED: Filter by branch_id or room_id if provided
            rooms.count({
                where: {
                    is_available: true,
                    ...(room_id && { id: room_id }),
                    ...(branch_id && !room_id && { branch_id })
                }
            }),

            // Total Customers - UPDATED: Added branch/room filtering
            this._getDistinctCustomerCount(dateFilter, bookingFilter),

            // Active Store Owners - UPDATED: Filter to specific branch's owner if provided
            branches.count({
                distinct: true,
                col: 'owner_id',
                where: {
                    is_active: true,
                    ...(branch_id && { id: branch_id })
                }
            }),

            // Average Booking Value - UPDATED: Added branch/room filtering
            this._getAvgWithFilter('total_price', {
                status: 'completed',
                ...dateFilter
            }, bookingFilter),

            // Completion Rate - UPDATED: Added branch/room filtering
            this._getCompletionRate(dateFilter, bookingFilter)
        ]);

        return {
            revenue: {
                total: parseFloat(totalRevenue) || 0,
                average: parseFloat(averageBookingValue) || 0
            },
            bookings: {
                total: totalBookings,
                completionRate: completionRate
            },
            platform: {
                branches: totalBranches,
                rooms: totalRooms,
                customers: totalCustomers,
                activeOwners: activeOwners
            }
        };
    }

    /**
     * Get revenue trends over time
     * UPDATED: Now supports optional filtering by branch_id or room_id
     * @param {Object} filters - { startDate, endDate, groupBy: 'day'|'week'|'month', branch_id, room_id }
     */
    async getAdminRevenueTrends(filters = {}) {
        const { startDate, endDate, groupBy = 'day', branch_id, room_id } = filters;
        const dateFilter = this._buildDateFilter(startDate, endDate);

        // ADDED: Validate and sanitize groupBy parameter
        const validGroupByValues = ['day', 'week', 'month', 'year'];
        const sanitizedGroupBy = validGroupByValues.includes(groupBy?.toLowerCase())
            ? groupBy.toLowerCase()
            : 'day';

        // ADDED: Build include clause for branch/room filtering
        const include = this._buildIncludeForBranchRoomFilter(branch_id, room_id);

        const trends = await bookings.findAll({
            attributes: [
                [fn('DATE_TRUNC', sanitizedGroupBy, col('bookings.start_time')), 'period'],
                [fn('SUM', col('bookings.total_price')), 'revenue'],
                [fn('COUNT', col('bookings.id')), 'bookingCount'],
                [fn('AVG', col('bookings.total_price')), 'avgBookingValue']
            ],
            where: {
                status: 'completed',
                ...dateFilter
            },
            // ADDED: Include rooms/branches for filtering
            include,
            group: [literal(`DATE_TRUNC('${sanitizedGroupBy}', bookings.start_time)`)],
            order: [[literal('period'), 'ASC']],
            raw: true,
            subQuery: false
        });

        return trends.map(trend => ({
            period: trend.period,
            revenue: parseFloat(trend.revenue),
            bookingCount: parseInt(trend.bookingCount),
            avgBookingValue: parseFloat(trend.avgBookingValue)
        }));
    }

    /**
     * Get top performing branches
     * @param {Object} filters - { startDate, endDate, limit: 10 }
     */
    async getTopBranches(filters = {}) {
        const { startDate, endDate, limit = 10 } = filters;

        // Build date condition for subquery
        let dateCondition = '';
        if (startDate && endDate) {
            dateCondition = `AND bookings.start_time BETWEEN '${startDate}' AND '${endDate}'`;
        } else if (startDate) {
            dateCondition = `AND bookings.start_time >= '${startDate}'`;
        } else if (endDate) {
            dateCondition = `AND bookings.start_time <= '${endDate}'`;
        }

        const query = `
            SELECT
                b.id as "branchId",
                b.branch_name as "branchName",
                b.address,
                u.first_name || ' ' || u.last_name as "ownerName",
                COUNT(bk.id) as "totalBookings",
                COALESCE(SUM(bk.total_price), 0) as "totalRevenue",
                COALESCE(AVG(bk.total_price), 0) as "avgBookingValue"
            FROM branches b
            INNER JOIN users u ON b.owner_id = u.id
            LEFT JOIN rooms r ON b.id = r.branch_id
            LEFT JOIN bookings bk ON r.id = bk.room_id
                AND bk.status = 'completed'
                ${dateCondition}
            WHERE b.is_active = true
            GROUP BY b.id, b.branch_name, b.address, u.first_name, u.last_name
            HAVING COUNT(bk.id) > 0
            ORDER BY "totalRevenue" DESC
            LIMIT :limit
        `;

        const results = await sequelize.query(query, {
            replacements: { limit },
            type: sequelize.QueryTypes.SELECT
        });

        return results.map(branch => ({
            branchId: branch.branchId,
            branchName: branch.branchName,
            address: branch.address,
            ownerName: branch.ownerName,
            metrics: {
                totalBookings: parseInt(branch.totalBookings),
                totalRevenue: parseFloat(branch.totalRevenue),
                avgBookingValue: parseFloat(branch.avgBookingValue)
            }
        }));
    }

    /**
     * Get booking status distribution
     * UPDATED: Now supports optional filtering by branch_id or room_id
     * @param {Object} filters - { startDate, endDate, branch_id, room_id }
     */
    async getBookingStatusDistribution(filters = {}) {
        const { startDate, endDate, branch_id, room_id } = filters;
        const dateFilter = this._buildDateFilter(startDate, endDate);

        // ADDED: Build include clause for branch/room filtering
        const include = this._buildIncludeForBranchRoomFilter(branch_id, room_id);

        const distribution = await bookings.findAll({
            attributes: [
                'status',
                [fn('COUNT', col('bookings.id')), 'count'],
                [fn('SUM', col('bookings.total_price')), 'revenue']
            ],
            where: dateFilter,
            // ADDED: Include rooms/branches for filtering
            include,
            group: ['bookings.status'],
            raw: true,
            subQuery: false
        });

        return distribution.map(item => ({
            status: item.status,
            count: parseInt(item.count),
            revenue: parseFloat(item.revenue) || 0
        }));
    }

    /**
     * Get customer analytics
     * UPDATED: Now supports optional filtering by branch_id or room_id
     * @param {Object} filters - { startDate, endDate, limit: 10, branch_id, room_id }
     */
    async getTopCustomers(filters = {}) {
        const { startDate, endDate, limit = 10, branch_id, room_id } = filters;
        const dateFilter = this._buildDateFilter(startDate, endDate);

        // ADDED: Build nested include for branch/room filtering
        const bookingInclude = {
            model: bookings,
            as: 'customer_bookings',
            attributes: [],
            where: {
                status: 'completed',
                ...dateFilter
            },
            required: true
        };

        // ADDED: If filtering by branch or room, add nested includes
        if (branch_id || room_id) {
            bookingInclude.include = [{
                model: rooms,
                as: 'room',
                attributes: [],
                where: {
                    ...(room_id && { id: room_id }),
                    ...(branch_id && !room_id && { branch_id })
                },
                required: true,
                // ADDED: If filtering by branch_id only, include branch relation
                ...(branch_id && !room_id && {
                    include: [{
                        model: branches,
                        as: 'branch',
                        attributes: [],
                        where: { id: branch_id },
                        required: true
                    }]
                })
            }];
        }

        const topCustomers = await users.findAll({
            attributes: [
                'id',
                'first_name',
                'last_name',
                [fn('COUNT', col('customer_bookings.id')), 'totalBookings'],
                [fn('SUM', col('customer_bookings.total_price')), 'totalSpent'],
                [fn('AVG', col('customer_bookings.total_price')), 'avgSpent']
            ],
            include: [bookingInclude],
            group: ['users.id'],
            order: [[literal('"totalSpent"'), 'DESC']],
            limit: limit,
            subQuery: false,
            raw: true
        });

        return topCustomers.map(customer => ({
            customerId: customer.id,
            name: `${customer.first_name} ${customer.last_name}`,
            totalBookings: parseInt(customer.totalBookings),
            totalSpent: parseFloat(customer.totalSpent),
            avgSpent: parseFloat(customer.avgSpent)
        }));
    }

    /**
     * Get room utilization rates
     * UPDATED: Now supports optional filtering by branch_id or room_id
     * @param {Object} filters - { startDate, endDate, branch_id, room_id }
     */
    async getRoomUtilization(filters = {}) {
        const { startDate, endDate, branch_id, room_id } = filters;

        // Calculate total available hours for the period
        const daysDiff = this._getDaysDifference(startDate, endDate);

        // Build date condition
        let dateCondition = '';
        if (startDate && endDate) {
            dateCondition = `AND bk.start_time BETWEEN '${startDate}' AND '${endDate}'`;
        } else if (startDate) {
            dateCondition = `AND bk.start_time >= '${startDate}'`;
        } else if (endDate) {
            dateCondition = `AND bk.start_time <= '${endDate}'`;
        }

        // ADDED: Build branch/room filter conditions
        let branchCondition = '';
        if (branch_id) {
            branchCondition = `AND b.id = '${branch_id}'`;
        }

        let roomCondition = '';
        if (room_id) {
            roomCondition = `AND r.id = '${room_id}'`;
        }

        const query = `
            SELECT
                r.id as "roomId",
                r.room_no as "roomNo",
                b.branch_name as "branchName",
                b.open_times as "openTimes",
                b.close_times as "closeTimes",
                COUNT(bk.id) as "totalBookings",
                COALESCE(SUM(EXTRACT(EPOCH FROM (bk.end_time - bk.start_time))/3600), 0) as "totalHoursBooked"
            FROM rooms r
            INNER JOIN branches b ON r.branch_id = b.id
            LEFT JOIN bookings bk ON r.id = bk.room_id
                AND bk.status = 'completed'
                ${dateCondition}
            WHERE r.is_available = true
                ${branchCondition}
                ${roomCondition}
            GROUP BY r.id, r.room_no, b.branch_name, b.open_times, b.close_times
            ORDER BY "totalHoursBooked" DESC
        `;

        const results = await sequelize.query(query, {
            type: sequelize.QueryTypes.SELECT
        });

        return results.map(room => {
            const hoursPerDay = this._calculateDailyHours(room.openTimes, room.closeTimes);
            const totalAvailableHours = hoursPerDay * daysDiff;
            const utilizationRate = totalAvailableHours > 0
                ? (room.totalHoursBooked / totalAvailableHours) * 100
                : 0;

            return {
                roomId: room.roomId,
                roomNo: room.roomNo,
                branchName: room.branchName,
                totalBookings: parseInt(room.totalBookings),
                hoursBooked: parseFloat(room.totalHoursBooked),
                totalAvailableHours: totalAvailableHours,
                utilizationRate: Math.min(utilizationRate, 100).toFixed(2)
            };
        });
    }

    /**
     * ===========================================
     * STORE OWNER ANALYTICS
     * ===========================================
     */

    /**
     * Get owner dashboard overview
     * @param {String} ownerId - Owner user ID
     * @param {Object} filters - { startDate, endDate, branch_id, room_id }
     */
    async getOwnerOverview(ownerId, filters = {}) {
        const { startDate, endDate, branch_id, room_id } = filters;

        // Build date condition
        let dateCondition = '';
        if (startDate && endDate) {
            dateCondition = `AND bk.start_time BETWEEN '${startDate}' AND '${endDate}'`;
        } else if (startDate) {
            dateCondition = `AND bk.start_time >= '${startDate}'`;
        } else if (endDate) {
            dateCondition = `AND bk.start_time <= '${endDate}'`;
        }

        // ADDED: Build branch/room filter conditions
        let branchCondition = '';
        if (branch_id) {
            branchCondition = `AND b.id = '${branch_id}'`;
        }

        let roomCondition = '';
        if (room_id) {
            roomCondition = `AND r.id = '${room_id}'`;
        }

        const overviewQuery = `
            SELECT
                COALESCE(SUM(CASE WHEN bk.status = 'completed' THEN bk.total_price ELSE 0 END), 0) as "totalRevenue",
                COALESCE(AVG(CASE WHEN bk.status = 'completed' THEN bk.total_price ELSE NULL END), 0) as "avgBookingValue",
                COUNT(bk.id) as "totalBookings",
                COUNT(CASE WHEN bk.status = 'completed' THEN 1 END) as "completedBookings",
                COUNT(DISTINCT bk.customer_id) FILTER (WHERE bk.status = 'completed') as "uniqueCustomers"
            FROM branches b
            LEFT JOIN rooms r ON b.id = r.branch_id
                ${roomCondition}
            LEFT JOIN bookings bk ON r.id = bk.room_id
                ${dateCondition}
            WHERE b.owner_id = :ownerId AND b.is_active = true
                ${branchCondition}
        `;

        const countsQuery = `
            SELECT
                COUNT(DISTINCT b.id) FILTER (WHERE b.is_active = true) as "totalBranches",
                COUNT(DISTINCT r.id) FILTER (WHERE r.is_available = true) as "totalRooms"
            FROM branches b
            LEFT JOIN rooms r ON b.id = r.branch_id
                ${roomCondition}
            WHERE b.owner_id = :ownerId
                ${branchCondition}
        `;

        const [overviewResults, countsResults] = await Promise.all([
            sequelize.query(overviewQuery, {
                replacements: { ownerId },
                type: sequelize.QueryTypes.SELECT
            }),
            sequelize.query(countsQuery, {
                replacements: { ownerId },
                type: sequelize.QueryTypes.SELECT
            })
        ]);

        const overview = overviewResults[0];
        const counts = countsResults[0];
        const completionRate = overview.totalBookings > 0
            ? ((overview.completedBookings / overview.totalBookings) * 100).toFixed(2)
            : 0;

        return {
            revenue: {
                total: parseFloat(overview.totalRevenue),
                average: parseFloat(overview.avgBookingValue)
            },
            bookings: {
                total: parseInt(overview.totalBookings),
                completionRate: completionRate
            },
            business: {
                branches: parseInt(counts.totalBranches),
                rooms: parseInt(counts.totalRooms),
                uniqueCustomers: parseInt(overview.uniqueCustomers)
            }
        };
    }

    /**
     * Get owner revenue trends
     * @param {String} ownerId - Owner user ID
     * @param {Object} filters - { startDate, endDate, groupBy, branch_id, room_id }
     */
    async getOwnerRevenueTrends(ownerId, filters = {}) {
        const { startDate, endDate, groupBy = 'day', branch_id, room_id } = filters;

        // ADDED: Validate and sanitize groupBy parameter
        const validGroupByValues = ['day', 'week', 'month', 'year'];
        const sanitizedGroupBy = validGroupByValues.includes(groupBy?.toLowerCase())
            ? groupBy.toLowerCase()
            : 'day';

        let dateCondition = '';
        if (startDate && endDate) {
            dateCondition = `AND bk.start_time BETWEEN '${startDate}' AND '${endDate}'`;
        } else if (startDate) {
            dateCondition = `AND bk.start_time >= '${startDate}'`;
        } else if (endDate) {
            dateCondition = `AND bk.start_time <= '${endDate}'`;
        }

        // ADDED: Build branch/room filter conditions
        let branchCondition = '';
        if (branch_id) {
            branchCondition = `AND b.id = '${branch_id}'`;
        }

        let roomCondition = '';
        if (room_id) {
            roomCondition = `AND r.id = '${room_id}'`;
        }

        const query = `
            SELECT
                DATE_TRUNC('${sanitizedGroupBy}', bk.start_time) as period,
                SUM(bk.total_price) as revenue,
                COUNT(bk.id) as "bookingCount",
                AVG(bk.total_price) as "avgBookingValue"
            FROM branches b
            INNER JOIN rooms r ON b.id = r.branch_id
                ${roomCondition}
            INNER JOIN bookings bk ON r.id = bk.room_id
            WHERE b.owner_id = :ownerId
                AND bk.status = 'completed'
                ${dateCondition}
                ${branchCondition}
            GROUP BY DATE_TRUNC('${sanitizedGroupBy}', bk.start_time)
            ORDER BY period ASC
        `;

        const trends = await sequelize.query(query, {
            replacements: { ownerId },
            type: sequelize.QueryTypes.SELECT
        });

        return trends.map(trend => ({
            period: trend.period,
            revenue: parseFloat(trend.revenue),
            bookingCount: parseInt(trend.bookingCount),
            avgBookingValue: parseFloat(trend.avgBookingValue)
        }));
    }

    /**
     * Get branch performance comparison for owner
     * @param {String} ownerId - Owner user ID
     * @param {Object} filters - { startDate, endDate, branch_id }
     */
    async getOwnerBranchPerformance(ownerId, filters = {}) {
        const { startDate, endDate, branch_id } = filters;

        let dateCondition = '';
        if (startDate && endDate) {
            dateCondition = `AND bk.start_time BETWEEN '${startDate}' AND '${endDate}'`;
        } else if (startDate) {
            dateCondition = `AND bk.start_time >= '${startDate}'`;
        } else if (endDate) {
            dateCondition = `AND bk.start_time <= '${endDate}'`;
        }

        // ADDED: Build branch filter condition
        let branchCondition = '';
        if (branch_id) {
            branchCondition = `AND b.id = '${branch_id}'`;
        }

        const query = `
            SELECT
                b.id as "branchId",
                b.branch_name as "branchName",
                b.address,
                b.room_amount as "roomCount",
                COUNT(bk.id) FILTER (WHERE bk.status = 'completed') as "totalBookings",
                COALESCE(SUM(bk.total_price) FILTER (WHERE bk.status = 'completed'), 0) as "totalRevenue",
                COALESCE(AVG(bk.total_price) FILTER (WHERE bk.status = 'completed'), 0) as "avgBookingValue"
            FROM branches b
            LEFT JOIN rooms r ON b.id = r.branch_id
            LEFT JOIN bookings bk ON r.id = bk.room_id
                ${dateCondition}
            WHERE b.owner_id = :ownerId AND b.is_active = true
                ${branchCondition}
            GROUP BY b.id, b.branch_name, b.address, b.room_amount
            ORDER BY "totalRevenue" DESC
        `;

        const results = await sequelize.query(query, {
            replacements: { ownerId },
            type: sequelize.QueryTypes.SELECT
        });

        return results.map(branch => ({
            branchId: branch.branchId,
            branchName: branch.branchName,
            address: branch.address,
            roomCount: parseInt(branch.roomCount),
            metrics: {
                totalBookings: parseInt(branch.totalBookings),
                totalRevenue: parseFloat(branch.totalRevenue),
                avgBookingValue: parseFloat(branch.avgBookingValue)
            }
        }));
    }

    /**
     * Get room performance for specific branch
     * @param {String} branchId - Branch ID
     * @param {Object} filters - { startDate, endDate, room_id }
     */
    async getBranchRoomPerformance(branchId, filters = {}) {
        const { startDate, endDate, room_id } = filters;

        let dateCondition = '';
        if (startDate && endDate) {
            dateCondition = `AND bk.start_time BETWEEN '${startDate}' AND '${endDate}'`;
        } else if (startDate) {
            dateCondition = `AND bk.start_time >= '${startDate}'`;
        } else if (endDate) {
            dateCondition = `AND bk.start_time <= '${endDate}'`;
        }

        // ADDED: Build room filter condition
        let roomCondition = '';
        if (room_id) {
            roomCondition = `AND r.id = '${room_id}'`;
        }

        const query = `
            SELECT
                r.id as "roomId",
                r.room_no as "roomNo",
                r.people_capacity as capacity,
                r.price_per_hour as "pricePerHour",
                COUNT(bk.id) FILTER (WHERE bk.status = 'completed') as "totalBookings",
                COALESCE(SUM(bk.total_price) FILTER (WHERE bk.status = 'completed'), 0) as "totalRevenue",
                COALESCE(SUM(EXTRACT(EPOCH FROM (bk.end_time - bk.start_time))/3600) FILTER (WHERE bk.status = 'completed'), 0) as "hoursBooked"
            FROM rooms r
            LEFT JOIN bookings bk ON r.id = bk.room_id
                ${dateCondition}
            WHERE r.branch_id = :branchId
                ${roomCondition}
            GROUP BY r.id, r.room_no, r.people_capacity, r.price_per_hour
            ORDER BY "totalRevenue" DESC
        `;

        const results = await sequelize.query(query, {
            replacements: { branchId },
            type: sequelize.QueryTypes.SELECT
        });

        return results.map(room => ({
            roomId: room.roomId,
            roomNo: room.roomNo,
            capacity: parseInt(room.capacity),
            pricePerHour: parseFloat(room.pricePerHour),
            metrics: {
                totalBookings: parseInt(room.totalBookings),
                totalRevenue: parseFloat(room.totalRevenue),
                hoursBooked: parseFloat(room.hoursBooked)
            }
        }));
    }

    /**
     * Get peak hours analysis for owner
     * @param {String} ownerId - Owner user ID
     * @param {Object} filters - { startDate, endDate, branch_id, room_id }
     */
    async getOwnerPeakHours(ownerId, filters = {}) {
        const { startDate, endDate, branch_id, room_id } = filters;

        let dateCondition = '';
        if (startDate && endDate) {
            dateCondition = `AND bk.start_time BETWEEN '${startDate}' AND '${endDate}'`;
        } else if (startDate) {
            dateCondition = `AND bk.start_time >= '${startDate}'`;
        } else if (endDate) {
            dateCondition = `AND bk.start_time <= '${endDate}'`;
        }

        // ADDED: Build branch/room filter conditions
        let branchCondition = '';
        if (branch_id) {
            branchCondition = `AND b.id = '${branch_id}'`;
        }

        let roomCondition = '';
        if (room_id) {
            roomCondition = `AND r.id = '${room_id}'`;
        }

        const query = `
            SELECT
                EXTRACT(HOUR FROM bk.start_time) as hour,
                COUNT(bk.id) as "bookingCount",
                SUM(bk.total_price) as revenue
            FROM branches b
            INNER JOIN rooms r ON b.id = r.branch_id
                ${roomCondition}
            INNER JOIN bookings bk ON r.id = bk.room_id
            WHERE b.owner_id = :ownerId
                AND bk.status = 'completed'
                ${dateCondition}
                ${branchCondition}
            GROUP BY EXTRACT(HOUR FROM bk.start_time)
            ORDER BY hour ASC
        `;

        const results = await sequelize.query(query, {
            replacements: { ownerId },
            type: sequelize.QueryTypes.SELECT
        });

        return results.map(item => ({
            hour: parseInt(item.hour),
            bookingCount: parseInt(item.bookingCount),
            revenue: parseFloat(item.revenue)
        }));
    }

    /**
     * Get customer insights for owner
     * @param {String} ownerId - Owner user ID
     * @param {Object} filters - { startDate, endDate, limit: 20, branch_id, room_id }
     */
    async getOwnerCustomerInsights(ownerId, filters = {}) {
        const { startDate, endDate, limit = 20, branch_id, room_id } = filters;

        let dateCondition = '';
        if (startDate && endDate) {
            dateCondition = `AND bk.start_time BETWEEN '${startDate}' AND '${endDate}'`;
        } else if (startDate) {
            dateCondition = `AND bk.start_time >= '${startDate}'`;
        } else if (endDate) {
            dateCondition = `AND bk.start_time <= '${endDate}'`;
        }

        // ADDED: Build branch/room filter conditions
        let branchCondition = '';
        if (branch_id) {
            branchCondition = `AND b.id = '${branch_id}'`;
        }

        let roomCondition = '';
        if (room_id) {
            roomCondition = `AND r.id = '${room_id}'`;
        }

        const query = `
            SELECT
                u.id as "customerId",
                u.first_name || ' ' || u.last_name as name,
                COUNT(bk.id) as "totalBookings",
                SUM(bk.total_price) as "totalSpent",
                AVG(bk.total_price) as "avgSpent",
                MAX(bk.start_time) as "lastBooking"
            FROM branches b
            INNER JOIN rooms r ON b.id = r.branch_id
                ${roomCondition}
            INNER JOIN bookings bk ON r.id = bk.room_id
            INNER JOIN users u ON bk.customer_id = u.id
            WHERE b.owner_id = :ownerId
                AND bk.status = 'completed'
                ${dateCondition}
                ${branchCondition}
            GROUP BY u.id, u.first_name, u.last_name
            ORDER BY "totalSpent" DESC
            LIMIT :limit
        `;

        const results = await sequelize.query(query, {
            replacements: { ownerId, limit },
            type: sequelize.QueryTypes.SELECT
        });

        return results.map(customer => ({
            customerId: customer.customerId,
            name: customer.name,
            totalBookings: parseInt(customer.totalBookings),
            totalSpent: parseFloat(customer.totalSpent),
            avgSpent: parseFloat(customer.avgSpent),
            lastBooking: customer.lastBooking
        }));
    }

    /**
     * ===========================================
     * HELPER METHODS
     * ===========================================
     */

    _buildDateFilter(startDate, endDate) {
        const filter = {};

        if (startDate && endDate) {
            filter.start_time = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        } else if (startDate) {
            filter.start_time = {
                [Op.gte]: new Date(startDate)
            };
        } else if (endDate) {
            filter.start_time = {
                [Op.lte]: new Date(endDate)
            };
        }

        return filter;
    }

    /**
     * ADDED: Build filter object for branch_id or room_id
     * Returns an object to be used in booking queries
     * @param {String} branch_id - Optional branch ID
     * @param {String} room_id - Optional room ID
     * @returns {Object} Filter object with room_id if needed
     */
    _buildBranchRoomFilter(branch_id, room_id) {
        const filter = {};

        // If room_id is provided, filter by room_id directly
        if (room_id) {
            filter.room_id = room_id;
        }
        // If branch_id is provided (and no room_id), we'll need to join with rooms table
        // This is handled in the include, so we return empty filter here
        else if (branch_id) {
            // Will be handled via include in queries that need it
            return { _needsBranchFilter: true, branch_id };
        }

        return filter;
    }

    /**
     * ADDED: Build Sequelize include clause for branch/room filtering
     * Used in queries that need to join rooms/branches for filtering
     * @param {String} branch_id - Optional branch ID
     * @param {String} room_id - Optional room ID
     * @returns {Array} Array of include objects or empty array
     */
    _buildIncludeForBranchRoomFilter(branch_id, room_id) {
        if (!branch_id && !room_id) {
            return [];
        }

        const include = [];

        // If room_id is provided, filter by room directly
        if (room_id) {
            include.push({
                model: rooms,
                as: 'room',
                attributes: [],
                where: { id: room_id },
                required: true
            });
        }
        // If branch_id is provided, join through rooms to branches
        else if (branch_id) {
            include.push({
                model: rooms,
                as: 'room',
                attributes: [],
                where: { branch_id },
                required: true
            });
        }

        return include;
    }

    /**
     * ADDED: Get sum of a column with branch/room filtering
     * @param {String} column - Column to sum
     * @param {Object} whereCondition - Where conditions
     * @param {Object} branchRoomFilter - Branch/room filter from _buildBranchRoomFilter
     * @returns {Promise<Number>} Sum result
     */
    async _getSumWithFilter(column, whereCondition, branchRoomFilter) {
        const queryOptions = {
            where: whereCondition
        };

        // If filtering by room_id directly, add to where clause
        if (branchRoomFilter.room_id) {
            queryOptions.where.room_id = branchRoomFilter.room_id;
        }
        // If filtering by branch_id, add include
        else if (branchRoomFilter._needsBranchFilter) {
            queryOptions.include = [{
                model: rooms,
                as: 'room',
                attributes: [],
                where: { branch_id: branchRoomFilter.branch_id },
                required: true
            }];
        }

        return await bookings.sum(column, queryOptions);
    }

    /**
     * ADDED: Get count with branch/room filtering
     * @param {Object} whereCondition - Where conditions
     * @param {Object} branchRoomFilter - Branch/room filter from _buildBranchRoomFilter
     * @returns {Promise<Number>} Count result
     */
    async _getCountWithFilter(whereCondition, branchRoomFilter) {
        const queryOptions = {
            where: whereCondition
        };

        // If filtering by room_id directly, add to where clause
        if (branchRoomFilter.room_id) {
            queryOptions.where.room_id = branchRoomFilter.room_id;
        }
        // If filtering by branch_id, add include
        else if (branchRoomFilter._needsBranchFilter) {
            queryOptions.include = [{
                model: rooms,
                as: 'room',
                attributes: [],
                where: { branch_id: branchRoomFilter.branch_id },
                required: true
            }];
        }

        return await bookings.count(queryOptions);
    }

    /**
     * ADDED: Get distinct customer count with branch/room filtering
     * @param {Object} whereCondition - Where conditions
     * @param {Object} branchRoomFilter - Branch/room filter from _buildBranchRoomFilter
     * @returns {Promise<Number>} Distinct customer count
     */
    async _getDistinctCustomerCount(whereCondition, branchRoomFilter) {
        const queryOptions = {
            distinct: true,
            col: 'customer_id',
            where: whereCondition
        };

        // If filtering by room_id directly, add to where clause
        if (branchRoomFilter.room_id) {
            queryOptions.where.room_id = branchRoomFilter.room_id;
        }
        // If filtering by branch_id, add include
        else if (branchRoomFilter._needsBranchFilter) {
            queryOptions.include = [{
                model: rooms,
                as: 'room',
                attributes: [],
                where: { branch_id: branchRoomFilter.branch_id },
                required: true
            }];
        }

        return await bookings.count(queryOptions);
    }

    /**
     * ADDED: Get average of a column with branch/room filtering
     * @param {String} column - Column to average
     * @param {Object} whereCondition - Where conditions
     * @param {Object} branchRoomFilter - Branch/room filter from _buildBranchRoomFilter
     * @returns {Promise<Number>} Average result
     */
    async _getAvgWithFilter(column, whereCondition, branchRoomFilter) {
        const queryOptions = {
            attributes: [
                [fn('AVG', col(`bookings.${column}`)), 'avgValue']
            ],
            where: whereCondition,
            raw: true
        };

        // If filtering by room_id directly, add to where clause
        if (branchRoomFilter.room_id) {
            queryOptions.where.room_id = branchRoomFilter.room_id;
        }
        // If filtering by branch_id, add include
        else if (branchRoomFilter._needsBranchFilter) {
            queryOptions.include = [{
                model: rooms,
                as: 'room',
                attributes: [],
                where: { branch_id: branchRoomFilter.branch_id },
                required: true
            }];
        }

        const result = await bookings.findOne(queryOptions);
        return parseFloat(result?.avgValue) || 0;
    }

    /**
     * UPDATED: Modified to support branch/room filtering
     * @param {Object} dateFilter - Date filter conditions
     * @param {Object} branchRoomFilter - Branch/room filter from _buildBranchRoomFilter
     * @returns {Promise<String>} Completion rate percentage
     */
    async _getCompletionRate(dateFilter, branchRoomFilter = {}) {
        const queryOptions = {
            attributes: [
                [fn('COUNT', col('bookings.id')), 'total'],
                [fn('SUM', literal("CASE WHEN bookings.status = 'completed' THEN 1 ELSE 0 END")), 'completed']
            ],
            where: dateFilter,
            raw: true
        };

        // If filtering by room_id directly, add to where clause
        if (branchRoomFilter.room_id) {
            queryOptions.where.room_id = branchRoomFilter.room_id;
        }
        // If filtering by branch_id, add include
        else if (branchRoomFilter._needsBranchFilter) {
            queryOptions.include = [{
                model: rooms,
                as: 'room',
                attributes: [],
                where: { branch_id: branchRoomFilter.branch_id },
                required: true
            }];
        }

        const result = await bookings.findOne(queryOptions);

        if (!result || result.total === 0) return "0.00";
        return ((result.completed / result.total) * 100).toFixed(2);
    }

    _getDaysDifference(startDate, endDate) {
        if (!startDate || !endDate) return 30; // Default to 30 days
        const start = new Date(startDate);
        const end = new Date(endDate);
        return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    }

    _calculateDailyHours(openTime, closeTime) {
        if (!openTime || !closeTime) return 12; // Default to 12 hours

        const open = new Date(`1970-01-01T${openTime}`);
        const close = new Date(`1970-01-01T${closeTime}`);
        return (close - open) / (1000 * 60 * 60);
    }
}

module.exports = new AnalyticsController();