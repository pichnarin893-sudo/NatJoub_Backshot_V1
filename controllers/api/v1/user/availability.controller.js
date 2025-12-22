const { users, bookings, rooms, branches } = require('../../../../models');
const { Op } = require('sequelize');
const moment = require('moment');

class AvailabilityController {

    async getAvailability(roomId, date = null) {
        const targetDate = date
            ? moment(date).startOf('day')
            : moment().startOf('day');

        const room = await rooms.findByPk(roomId, {
            include: [{
                model: branches,
                as: 'branch',
                attributes: ['id', 'branch_name', 'work_days', 'open_times', 'close_times', 'is_active']
            }]
        });

        if (!room) throw new Error('Room not found');

        const dayOfWeek = targetDate.format('dddd'); // Use moment's format instead
        const isBranchOpen = room.branch.work_days.includes(dayOfWeek);

        if (!isBranchOpen || !room.branch.is_active) {
            return {
                roomId: room.id,
                date: targetDate.format('YYYY-MM-DD'), // Use moment's format
                isOpen: false,
                message: isBranchOpen ? 'Branch not active' : `Closed on ${dayOfWeek}`,
                bookedSlots: [],
            };
        }

        const startOfDay = targetDate.clone().startOf('day').toDate();
        const endOfDay = targetDate.clone().endOf('day').toDate();

        const roomBookings = await bookings.findAll({
            where: {
                room_id: roomId,
                // Only show bookings that actually occupy the room
                // Exclude: cancelled, expired (payment timeout), failed (payment failed)
                status: { [Op.notIn]: ['cancelled', 'expired', 'failed'] },
                start_time: { [Op.between]: [startOfDay, endOfDay] }
            },
            include: [{
                model: users,
                as: 'customer',
                attributes: ['id', 'first_name', 'last_name']
            }],
            order: [['start_time', 'ASC']]
        });

        const bookedSlots = roomBookings.map(booking => ({
            id: booking.id,
            time_slot:`${this._formatTime(booking.start_time)} - ${this._formatTime(booking.end_time)}`,
            status: booking.status
        }));

        return {
            roomId: room.id,
            roomNo: room.room_no,
            date: targetDate.format('YYYY-MM-DD'), // Use moment's format
            isOpen: true,
            booked_time_slots: bookedSlots,
        };
    }

    async checkTimeSlotAvailability(roomId, startTime, endTime) {
        const start = new Date(startTime);
        const end = new Date(endTime);

        if (start >= end) {
            return { available: false, reason: 'Invalid time range' };
        }

        if (start < new Date()) {
            return { available: false, reason: 'Cannot book in the past' };
        }

        const room = await rooms.findByPk(roomId, {
            include: [{ model: branches, as: 'branch' }]
        });

        if (!room) return { available: false, reason: 'Room not found' };
        if (!room.is_available) return { available: false, reason: 'Room unavailable' };

        const overlapping = await bookings.findOne({
            where: {
                room_id: roomId,
                status: { [Op.notIn]: ['cancelled', 'expired', 'failed'] },
                [Op.or]: [
                    { start_time: { [Op.lte]: start }, end_time: { [Op.gt]: start } },
                    { start_time: { [Op.lt]: end }, end_time: { [Op.gte]: end } },
                    { start_time: { [Op.gte]: start }, end_time: { [Op.lte]: end } }
                ]
            }
        });

        if (overlapping) {
            return { available: false, reason: 'Time slot already booked' };
        }

        const durationHours = (end - start) / (1000 * 60 * 60);
        return {
            available: true,
            roomId: room.id,
            durationHours,
            estimatedPrice: room.price_per_hour * durationHours
        };
    }

    _calculateAvailableSlots(date, openTime, closeTime, bookedSlots) {
        const slots = [];
        const [openHour, openMin] = openTime.split(':').map(Number);
        const [closeHour, closeMin] = closeTime.split(':').map(Number);

        let currentTime = new Date(date);
        currentTime.setHours(openHour, openMin, 0, 0);
        const endTime = new Date(date);
        endTime.setHours(closeHour, closeMin, 0, 0);

        const sortedBookings = [...bookedSlots].sort((a, b) =>
            new Date(a.startDateTime) - new Date(b.startDateTime)
        );

        for (const booking of sortedBookings) {
            const bookingStart = new Date(booking.startDateTime);
            if (currentTime < bookingStart) {
                slots.push({
                    startTime: this._formatTime(currentTime),
                    endTime: this._formatTime(bookingStart),
                    durationHours: (bookingStart - currentTime) / (1000 * 60 * 60)
                });
            }
            currentTime = new Date(booking.endDateTime);
        }

        if (currentTime < endTime) {
            slots.push({
                startTime: this._formatTime(currentTime),
                endTime: this._formatTime(endTime),
                durationHours: (endTime - currentTime) / (1000 * 60 * 60)
            });
        }

        return slots;
    }

    _formatTime(dateTime) {
        const date = new Date(dateTime);
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }
}

module.exports = new AvailabilityController();