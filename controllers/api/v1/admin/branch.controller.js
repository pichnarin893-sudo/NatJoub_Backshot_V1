const {users, branches,rooms, sequelize, photos} = require('../../../../models');
const {Op} = require("sequelize");
const {getLatLong} = require("../../../../utils/map.util");

async function createBranch(branchData){
    const{
        owner_id,
        branch_name,
        work_days,
        open_times,
        close_times,
        room_amount,
        descriptions,
        address,
        location_url,
        is_active
    } = branchData;

    const transaction = await sequelize.transaction();

    try {
       const [existing, owner] = await Promise.all([
           branches.findOne({
               where: {
                   [Op.or]: [
                       { branch_name },
                       { location_url }
                   ]
               }
           }),
           owner_id ? users.findByPk(owner_id) : Promise.resolve(null)
       ]);

       if (owner_id && !owner) {
           throw new Error('Owner with this ID does not exist');
       }

       if (existing) {
           if (existing.branch_name === branch_name) {
               throw new Error('Branch with this name already exists');
           }
           if (existing.location_url === location_url) {
               throw new Error('Branch with this location already exists');
           }
       }

       const isActive = is_active !== undefined ? is_active : false;

        const { latitude, longitude } = await getLatLong(location_url);

        const newBranch = await branches.create({
            owner_id,
            branch_name,
            work_days,
            open_times,
            close_times,
            room_amount,
            descriptions,
            address,
            location_url,
            is_active: isActive,
            latitude: longitude,
            longitude: longitude,
            lat_long_base_url: 'https://www.google.com/maps?q=' + latitude + ',' + longitude
        }, { transaction });

        await transaction.commit();

        return {
            id: newBranch.id,
            owner_id: newBranch.owner_id,
            branch_name: newBranch.branch_name,
            work_days: newBranch.work_days,
            open_times: newBranch.open_times,
            close_times: newBranch.close_times,
            room_amount: newBranch.room_amount,
            descriptions: newBranch.descriptions,
            address: newBranch.address,
            location_url: newBranch.location_url,
            is_active: newBranch.isActive,
            latitude: newBranch.latitude,
            longitude: newBranch.longitude,
            lat_long_base_url: newBranch.lat_long_base_url
        };
    }catch(error){
        await transaction.rollback();
        console.error('Error creating branch:', error);
        throw error;
    }
}

async function getBranches() {
    try {
        const allBranches = await branches.findAll({
            order: [['createdAt', 'DESC']]
        });

        if (!allBranches || allBranches.length === 0) {
            return [];
        }

        const branchIds = allBranches.map(branch => branch.id);

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
        return allBranches.map(branch => ({
            ...branch.toJSON(),
            branchPhotos: branchPhotosMap[branch.id] || []
        }));
    } catch (error) {
        console.error('Error fetching branches:', error);
        throw error;
    }
}

async function getBranchById(branchId) {
    try {
        return await branches.findByPk(branchId);
    }catch (error){
        console.error('Error fetching branch by ID:', error);
        throw error;
    }
}

async function deleteBranch(branchId) {
    const transaction = await sequelize.transaction();
    try {
        const branch = await branches.findByPk(branchId, { transaction });
        if (!branch) {
            throw new Error('Branch not found');
        }

        await branch.destroy({ transaction });

        await transaction.commit();

        return {
            message: 'Branch deleted successfully'
        };
    } catch (error) {
        // Rollback on error
        await transaction.rollback();
        console.error('Error deleting branch:', error);
        throw error;
    }
}

async function updateBranch(branchId, updateData) {
    const {
        branch_name,
        work_days,
        open_times,
        close_times,
        room_amount,
        descriptions,
        address,
        location_url,
        is_active
    } = updateData;

    const transaction = await sequelize.transaction();
    try {
        const branch = await branches.findByPk(branchId, {transaction});
        if (!branch) {
            throw new Error('Branch not found');
        }

        await branch.update(
            {
                branch_name,
                work_days,
                open_times,
                close_times,
                room_amount,
                descriptions,
                address,
                location_url,
                is_active
            },
            { transaction }
        );

        await transaction.commit();

        return {
            id: branch.id,
            owner_id: branch.owner_id,
            branch_name: branch.branch_name,
            work_days: branch.work_days,
            open_times: branch.open_times,
            close_times: branch.close_times,
            room_amount: branch.room_amount,
            descriptions: branch.descriptions,
            address: branch.address,
            location_url: branch.location_url,
            is_active: branch.is_active
        };
    } catch (error) {
        await transaction.rollback();
        console.error('Error updating branch:', error);
        throw error;
    }
}

async function viewRoomsInBranch(branchId){
    try{
        return await branches.findByPk(branchId, {
            include: [{
                model: rooms,
                as: 'rooms',
            }]
        });
    }catch (error){
        throw error;
    }
}

module.exports={
    createBranch,
    getBranches,
    getBranchById,
    deleteBranch,
    updateBranch,
    viewRoomsInBranch
}