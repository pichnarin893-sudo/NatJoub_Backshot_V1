const {rooms, branches, favorite_rooms, sequelize, photos} = require('../../../../models');
const {Op} = require("sequelize");

async function getAllRooms(userId){
    try {
        const userBranch = await branches.findAll({
            where: { owner_id: userId }
        });

        if (!userBranch || userBranch.length === 0) {
            throw new Error("You don't have a branch or it is not approved yet");
        }

        // Extract all branch IDs
        const branchIds = userBranch.map(branch => branch.id);

        console.log("User's branch IDs:", branchIds);

        return await rooms.findAll({
            where: {
                branch_id: {
                    [Op.in]: branchIds
                }
            },
            attributes: [
                'id',
                'room_no',
                'people_capacity',
                'price_per_hour',
                'equipments',
                'is_available',
                'branch_id',
                'createdAt',
                'updatedAt'
            ]
        });

    } catch(error) {
        console.error('Error in getAllRooms:', error);
        throw error;
    }
}

async function toggleFavoriteRoom(userId, roomId){
    const transaction = await sequelize.transaction();
    try {

        const room = await rooms.findByPk(roomId);
        if (!room) {
            console.log(room);
            throw new Error('Room not found');
        }

        //get branch_id that room belongs to
        const branchId = room.branch_id;

        const isExisting = await favorite_rooms.findOne({
            where: {
                user_id: userId,
                room_id: roomId
            }
        });

       if(isExisting){
           throw new Error('Room is already in favorites');
       }

       console.log('Adding room to favorites:', {userId, roomId, branchId});

        const favoriteRoom = await favorite_rooms.create(
            {
                user_id: userId,
                room_id: roomId,
                branch_id: branchId
            },
            {transaction}
        );

       await transaction.commit();

       return favoriteRoom;
    }catch(error){
        transaction.rollback();
        console.error('Error in toggleFavoriteRoom:', error);
        throw error;
    }
}

async function getFavoriteRooms(userId) {
    try {
        const favoriteRooms = await favorite_rooms.findAll({
            where: { user_id: userId },
            include: [
                {
                    model: rooms,
                    as: 'room',
                    attributes: [
                        'room_no',
                        'people_capacity',
                        'price_per_hour',
                        'equipments',
                        'is_available'
                    ],
                    include: [
                        {
                            model: branches,
                            as: 'branch',
                            attributes: [
                                'branch_name',
                                'work_days',
                                'open_times',
                                'close_times',
                                'address',
                                'location_url'
                            ]
                        }
                    ]
                }
            ],
            attributes: [
                'id',
                'user_id',
                'room_id',
                'branch_id',
                'createdAt',
                'updatedAt'
            ]
        });

        // flatten response
        return favoriteRooms.map(fav => ({
            id: fav.id,
            user_id: fav.user_id,
            room_id: fav.room_id,
            branch_id: fav.branch_id,
            createdAt: fav.createdAt,
            updatedAt: fav.updatedAt,
            room_no: fav.room?.room_no,
            people_capacity: fav.room?.people_capacity,
            price_per_hour: fav.room?.price_per_hour,
            equipments: fav.room?.equipments,
            is_available: fav.room?.is_available,
            branch_name: fav.room?.branch?.branch_name,
            work_days: fav.room?.branch?.work_days,
            open_times: fav.room?.branch?.open_times,
            close_times: fav.room?.branch?.close_times,
            address: fav.room?.branch?.address,
            location_url: fav.room?.branch?.location_url
        }));
    } catch (error) {
        console.error('Error in getFavoriteRooms:', error);
        throw error;
    }
}

async function removeFavoriteRoom(userId, roomId) {
    const transaction = await sequelize.transaction();
    try {
        const favoriteRoom = await favorite_rooms.findOne({
            where: {
                user_id: userId,
                room_id: roomId
            },
            transaction
        });

        if (!favoriteRoom) {
            throw new Error('Favorite room not found');
        }

        await favoriteRoom.destroy({ transaction });

        await transaction.commit();

        return {
            message: 'Room removed from favorites successfully'
        };
    } catch (error) {
        await transaction.rollback();
        console.error('Error in removeFavoriteRoom:', error);
        throw error;
    }
}


async function getRoomsByBranch(branchId, userId) {
    try {
        if (!branchId) {
            throw new Error('branchId is required');
        }

        const roomsData = await rooms.findAll({
            where: {
                branch_id: branchId
            },
            attributes: [
                'id',
                'room_no',
                'people_capacity',
                'price_per_hour',
                'equipments',
                'is_available',
            ]
        });

        const favoriteRooms = await favorite_rooms.findAll({
            where: { user_id: userId },
            attributes: ['room_id']
        });

        const favoriteRoomIds = favoriteRooms.map(fav => fav.room_id);

        return roomsData.map(room => ({
            id: room.id,
            room_no: room.room_no,
            people_capacity: room.people_capacity,
            price_per_hour: room.price_per_hour,
            equipments: room.equipments,
            is_available: room.is_available,
            is_favorite: favoriteRoomIds.includes(room.id)
        }));
    } catch (error) {
        console.error('Error in getRoomsByBranch:', error);
        throw error;
    }
}


async function getRoomDetails(roomId){
    try{
        const room = await rooms.findByPk(roomId,{
            attributes: ['id', 'room_no', 'people_capacity', 'price_per_hour', 'equipments','is_available']
            }
        )

        if(!room){
            throw new Error('Room is not found')
        }

        const roomPhotos = await photos.findAll({
            where: {
                entity_type: 'rooms',
                entity_id: roomId
            },
            attributes: ['id', 'public_url', 'display_order'],
            order: [['display_order', 'ASC'], ['createdAt', 'ASC']]
        });


        return {
            ...room.toJSON(),
            roomPhoto: roomPhotos
        };

    }catch(error){
        console.error("Failed to fetch room detail", error)
        throw error;
    }
}

module.exports ={
    toggleFavoriteRoom,
    getFavoriteRooms,
    getAllRooms,
    getRoomsByBranch,
    getRoomDetails,
    removeFavoriteRoom
}