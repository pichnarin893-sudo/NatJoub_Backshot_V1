const {rooms, branches, sequelize} = require("../../../../models");


async function createRoom(branch_id ,roomData){
    const {
        room_no,
        people_capacity,
        price_per_hour,
        equipments,
        is_available,
    } = roomData;

    const transaction = await sequelize.transaction();
    try {

        const [existing, branch, roomCount] = await Promise.all([
            rooms.findOne({
                where:{
                    room_no
                },
                attributes: ['id', 'room_no', 'branch_id', 'price_per_hour', 'is_available', 'equipments', 'people_capacity'],
            }),
            branch_id ? branches.findByPk(branch_id): Promise.resolve(null),
            branch_id ? rooms.count({
                where:{
                    branch_id
                }
            }): Promise.resolve(0)
        ]);

        if (branch_id && !branches){
            throw new Error('Branch with this ID does not exist');
        }

        if (existing){
            if (existing.room_no === room_no){
                throw new Error('Room with this number already exists');
            }
        }

        if (branch && roomCount >= branch.room_amount){
            throw new Error(`Branch cannot have more than ${branch.room_amount} rooms`);
        }

        const remainingRooms = branch ? branch.room_amount - roomCount -1 : 0;

        const newRoom = await rooms.create({
            branch_id,
            room_no,
            people_capacity,
            price_per_hour,
            equipments,
            is_available,
        }, {transaction});

        await transaction.commit();

        return {
            id: newRoom.id,
            branch_id: newRoom.branch_id,
            room_no: newRoom.room_no,
            people_capacity: newRoom.people_capacity,
            price_per_hour: newRoom.price_per_hour,
            equipments: newRoom.equipments,
            is_available: newRoom.is_available,
            remainingRooms: remainingRooms > 0 ? remainingRooms : 0
        }

    }catch (error){
        await transaction.rollback();
        console.error('Error creating room:', error);
        throw error;
    }
}

async function getRooms() {
    try {
        return await rooms.findAll({
            order: [['createdAt', 'DESC']]
        });
    } catch (error) {
        console.error('Error fetching rooms:', error);
        throw error;
    }
}

async function getRoomById(roomId) {
    try {
        return await rooms.findByPk(roomId);
    }catch (error){
        console.error('Error fetching room by ID:', error);
        throw error;
    }
}

async function updateRoom(roomId, updateData){
    const {
        room_no,
        people_capacity,
        price_per_hour,
        equipments,
        is_available,
    } = updateData;

    const transaction = await sequelize.transaction();
    try{
        const room = await rooms.findByPk(roomId, { transaction });
        if (!room){
            throw new Error('Room with this ID does not exist');
        }

        await room.update({
            room_no,
            people_capacity,
            price_per_hour,
            equipments,
            is_available,
        }, { transaction });

        await transaction.commit();
        return {
            id: room.id,
            branch_id: room.branch_id,
            room_no: room.room_no,
            people_capacity: room.people_capacity,
            price_per_hour: room.price_per_hour,
            equipments: room.equipments,
            is_available: room.is_available,
        }

    }catch(error){
        await transaction.rollback();
        console.error('Error updating room:', error);
        throw error;
    }
}

async function deleteRoom(roomId) {
    const transaction = await sequelize.transaction();
    try {
        const room = await rooms.findByPk(roomId, { transaction });
        if (!room) {
            throw new Error('Room not found');
        }

        // Delete the room instance
        await room.destroy({ transaction });

        await transaction.commit();

        return {
            message: 'Room deleted successfully'
        };
    } catch (error) {
        await transaction.rollback();
        console.error('Error deleting room:', error);
        throw error;
    }
}



module.exports = {
    createRoom,
    getRooms,
    getRoomById,
    updateRoom,
    deleteRoom
}