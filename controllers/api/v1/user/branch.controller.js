const {users, branches,rooms, sequelize, photos} = require('../../../../models');
const {Op} = require("sequelize");
const {getLatLong} = require("../../../../utils/map.util");


async function requestBranchCreation(ownerId, branchData){

    const{
        branch_name,
        work_days,
        open_times,
        close_times,
        room_amount,
        descriptions,
        address,
        location_url,
        is_active= false
    } = branchData;

    const transaction = await sequelize.transaction();
    try{
        const [existing] = await Promise.all([
            branches.findOne({
                where: {
                    [Op.or]: [
                        { branch_name },
                        { location_url }
                    ]
                }
            }),
        ]);

        const { latitude, longitude } = await getLatLong(location_url);

        console.log(`https://www.google.com/maps?q=${latitude},${longitude}`);

        if (existing) {
            if (existing.branch_name === branch_name) {
                throw new Error('Branch with this name already exists');
            }
            if (existing.location_url === location_url) {
                throw new Error('Branch with this location already exists');
            }
        }

        const newBranch = await branches.create({
            owner_id: ownerId,
            branch_name,
            work_days,
            open_times,
            close_times,
            room_amount,
            descriptions,
            address,
            location_url,
            is_active,
            latitude: latitude,
            longitude: longitude,
            lat_long_base_url: 'https://www.google.com/maps?q=' + latitude + ',' + longitude
        }, { transaction });

        await transaction.commit();

        return {
            id: newBranch.id,
            owner_id: ownerId,
            branch_name: newBranch.branch_name,
            work_days: newBranch.work_days,
            open_times: newBranch.open_times,
            close_times: newBranch.close_times,
            room_amount: newBranch.room_amount,
            descriptions: newBranch.descriptions,
            address: newBranch.address,
            location_url: newBranch.location_url,
            is_active: newBranch.is_active,
            latitude: newBranch.latitude,
            longitude: newBranch.longitude,
            lat_long_base_url: newBranch.lat_long_base_url
        };

    }catch (error){
        await transaction.rollback();
        console.error('Error creating branch:', error);
        throw error;
    }
}

async function getBranchesByOwner(ownerId){
    try{
        const ownerBranches = await branches.findAll({
            where:{
                owner_id: ownerId
            },
            attributes:['id', 'branch_name', 'work_days', 'open_times', 'close_times', 'room_amount', 'descriptions', 'address', 'location_url', 'is_active', 'latitude', 'longitude', 'lat_long_base_url']
        });

        if (!ownerBranches || ownerBranches.length === 0) {
            throw new Error("You don't have a branch or it is not approved yet");
        }

        const branchIds = ownerBranches.map(branch => branch.id);

        console.log("User's branch IDs:", branchIds);

        // Fetch photos for all branches
        const branchPhotosMap = {};
        if (branchIds.length > 0) {
            const branchPhotos = await photos.findAll({
                where: {
                    entity_type: 'branches',
                    entity_id: branchIds
                },
                attributes: ['id', 'public_url', 'display_order', 'entity_id'],
                order: [['display_order', 'ASC'], ['createdAt', 'ASC']]
            });

            branchPhotos.forEach(photo => {
                if (!branchPhotosMap[photo.entity_id]) {
                    branchPhotosMap[photo.entity_id] = [];
                }
                branchPhotosMap[photo.entity_id].push({
                    id: photo.id,
                    public_url: photo.public_url,
                    display_order: photo.display_order
                });
            });
        }

        // Add photos to branches
        return ownerBranches.map(branch => ({
            ...branch.toJSON(),
            branchPhotos: branchPhotosMap[branch.id] || []
        }));

    }catch(error){
        console.error('Error retrieving branches by owner:', error);
        throw error;
    }
}

async function getRoomByBranch(ownerId, branchId) {
    try {
        // Verify the branch belongs to the user
        const branch = await branches.findOne({
            where: {
                id: branchId,
                owner_id: ownerId
            }
        });

        if (!branch) {
            throw new Error("You do not own this branch or it doesn't exist.");
        }

        const roomsData = await rooms.findAll({
            where: {branch_id: branchId},
            attributes: [
                'id',
                'room_no',
                'people_capacity',
                'price_per_hour',
                'equipments',
                'is_available'
            ]
        });

        // Fetch photos for all rooms
        const roomIds = roomsData.map(room => room.id);
        const roomPhotosMap = {};

        if (roomIds.length > 0) {
            const roomPhotos = await photos.findAll({
                where: {
                    entity_type: 'rooms',
                    entity_id: roomIds
                },
                attributes: ['id', 'public_url', 'display_order', 'entity_id'],
                order: [['display_order', 'ASC'], ['createdAt', 'ASC']]
            });

            roomPhotos.forEach(photo => {
                if (!roomPhotosMap[photo.entity_id]) {
                    roomPhotosMap[photo.entity_id] = [];
                }
                roomPhotosMap[photo.entity_id].push({
                    id: photo.id,
                    public_url: photo.public_url,
                    display_order: photo.display_order
                });
            });
        }

        // Add photos to rooms
        return roomsData.map(room => ({
            ...room.toJSON(),
            roomPhotos: roomPhotosMap[room.id] || []
        }));

    } catch (error) {
        console.error('Error retrieving rooms by branch:', error);
        throw error;
    }
}

async function getBranchDetails(branchId) {
    try {
        if (!branchId) {
            throw new Error('branchId is required');
        }

        // Fetch single branch
        const branchData = await branches.findByPk(branchId, {
            attributes: [
                'id', 'branch_name', 'work_days', 'open_times', 'close_times',
                'room_amount', 'descriptions', 'address', 'location_url'
            ]
        });

        if (!branchData) {
            throw new Error('Branch not found');
        }

        // Fetch branch photos
        const branchPhotos = await photos.findAll({
            where: {
                entity_type: 'branches',
                entity_id: branchId
            },
            attributes: ['id', 'public_url', 'display_order'],
            order: [['display_order', 'ASC'], ['createdAt', 'ASC']]
        });

        return {
            ...branchData.toJSON(),
            branchPhotos: branchPhotos
        };

    } catch (error) {
        console.error('Error retrieving branch details:', error);
        throw error;
    }
}



module.exports={
    requestBranchCreation,
    getBranchesByOwner,
    getRoomByBranch,
    getBranchDetails
}