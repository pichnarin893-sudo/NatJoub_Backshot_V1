const { branches, rooms, booking, photos, sequelize } = require('../../../../models');
const {Op} = require("sequelize");

async function filteringRetrieval(filterParams){
    const {
        priceSort,
        capacitySort,
        minCapacity,
        maxCapacity,
        equipments,
        workDays,
        openTime,
        closeTime,
        latitude: userLat,
        longitude: userLng,
        activeBranchesOnly
    } = filterParams;

    try{
        // Build room filters and branch filters based on provided parameters
        const roomFilter = {};
        const branchFilter = {};

        if (activeBranchesOnly) branchFilter.is_active = true;
        roomFilter.is_available = true;

        // Handle capacity range properly
        if (minCapacity && maxCapacity) {
            roomFilter.people_capacity = {
                [Op.gte]: parseInt(minCapacity),
                [Op.lte]: parseInt(maxCapacity)
            };
        } else if (minCapacity) {
            roomFilter.people_capacity = { [Op.gte]: parseInt(minCapacity) };
        } else if (maxCapacity) {
            roomFilter.people_capacity = { [Op.lte]: parseInt(maxCapacity) };
        }

        if (equipments) roomFilter.equipments = { [Op.contains]: equipments.split(',') };
        if (workDays) branchFilter.work_days = { [Op.contains]: workDays.split(',') };
        if (openTime) branchFilter.open_times = { [Op.lte]: openTime };
        if (closeTime) branchFilter.close_times = { [Op.gte]: closeTime };

        // Sorting
        const order = [];
        if (priceSort) order.push([{ model: rooms, as: 'rooms' }, 'price_per_hour', priceSort]);
        if (capacitySort) order.push([{ model: rooms, as: 'rooms' }, 'people_capacity', capacitySort]);

        let attributes = ['id', 'branch_name', 'room_amount', 'address', 'work_days', 'open_times', 'close_times'];

        // Add distance calculation if user location is provided
        if (userLat !== undefined && userLng !== undefined) {
            const distanceFormula = `(6371 * acos(cos(radians(${userLat})) * cos(radians("branches"."latitude")) * cos(radians("branches"."longitude") - radians(${userLng})) + sin(radians(${userLat})) * sin(radians("branches"."latitude"))))`;
            attributes.push([sequelize.literal(distanceFormula), 'distance']);
            order.unshift(sequelize.literal('distance ASC'));
        }

        //Get branches first, then add photos separately
        const branchesData = await branches.findAll({
            where: branchFilter,
            attributes,
            include: [
                {
                    model: rooms,
                    as: 'rooms',
                    where: roomFilter,
                    required: true,
                    // attributes: ['id', 'room_no', 'people_capacity', 'price_per_hour', 'equipments', 'is_available']
                    attributes: []
                }
            ],
            order
        });

        // get photos for branches and rooms separately
        return await Promise.all(branchesData.map(async branch => {
            // Get branch photos
            const branchPhotos = await photos.findAll({
                where: {
                    entity_type: 'branches',
                    entity_id: branch.id
                },
                attributes: ['id', 'public_url', 'display_order'],
                order: [['display_order', 'ASC'], ['createdAt', 'ASC']]
            });

            // Get room photos for each room
            // const roomsWithPhotos = await Promise.all(
            //     (branch.rooms || []).map(async room => {
            //         const roomPhotos = await photos.findAll({
            //             where: {
            //                 entity_type: 'rooms',
            //                 entity_id: room.id
            //             },
            //             attributes: ['id', 'public_url', 'display_order'],
            //             order: [['display_order', 'ASC'], ['createdAt', 'ASC']]
            //         });
            //
            //         return {
            //             ...room.toJSON(),
            //             photos: roomPhotos
            //         };
            //     })
            // );

            // Calculate remaining rooms
            // const roomCount = await rooms.count({where: {branch_id: branch.id}});

            return {
                ...branch.toJSON(),
                // rooms: roomsWithPhotos,
                branchPhotos: branchPhotos, // Add branch photos
                // remainingRooms: Math.max(branch.room_amount - roomCount, 0)
            };
        }));

    } catch(error){
        console.error('Error retrieving filtered branches and rooms:', error);
        throw error;
    }
}


async function filteringRoomRetrieval(roomId, filterParams){
    const {
        priceSort,
        capacitySort,
        minCapacity,
        maxCapacity,
        equipments,
    } = filterParams || {};

    try{
        // Build room filters and branch filters based on provided parameters
        const roomFilter = { is_available: true };
        if(roomId) roomFilter.id = roomId;


        // Handle capacity range properly
        if (minCapacity && maxCapacity) {
            roomFilter.people_capacity = {
                [Op.gte]: parseInt(minCapacity),
                [Op.lte]: parseInt(maxCapacity)
            };
        } else if (minCapacity) {
            roomFilter.people_capacity = { [Op.gte]: parseInt(minCapacity) };
        } else if (maxCapacity) {
            roomFilter.people_capacity = { [Op.lte]: parseInt(maxCapacity) };
        }

        if (equipments) roomFilter.equipments = { [Op.contains]: equipments.split(',') };

        // Sorting
        const order = [];
        if (priceSort) order.push([{ model: rooms, as: 'rooms' }, 'price_per_hour', priceSort]);
        if (capacitySort) order.push([{ model: rooms, as: 'rooms' }, 'people_capacity', capacitySort]);



        //Get branches first, then add photos separately
        const roomData = await rooms.findAll({
            where: roomFilter,
            attributes: ['id', 'room_no', 'people_capacity', 'price_per_hour', 'equipments','is_available'],
            order
        });

        // get photos for branches and rooms separately
        return await Promise.all(roomData.map(async room => {
            // Get branch photos
            const roomPhotos = await photos.findAll({
                where: {
                    entity_type: 'rooms',
                    entity_id: room.id
                },
                attributes: ['id', 'public_url', 'display_order'],
                order: [['display_order', 'ASC'], ['createdAt', 'ASC']]
            });

            return {
                ...room.toJSON(),
                // rooms: roomsWithPhotos,
                roomPhoto: roomPhotos, // Add branch photos
                // remainingRooms: Math.max(branch.room_amount - roomCount, 0)
            };
        }));

    } catch(error){
        console.error('Error retrieving filtered branches and rooms:', error);
        throw error;
    }
}


module.exports = {
    filteringRetrieval,
    filteringRoomRetrieval
}