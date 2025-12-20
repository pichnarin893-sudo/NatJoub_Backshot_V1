const { promotions, branch_promotions, room_promotions, branches, rooms, photos } = require('../../../../models');
const { Op, where } = require('sequelize');

async function createPromoCode(data, creatorId) {
    let {
        promo_code,
        title,
        description,
        discount_percent,
        start_date,
        end_date,
        target_type = "global"
    } = data;

    promo_code = promo_code?.trim().toUpperCase();

    const now = new Date();
    const startDate = start_date ? new Date(start_date) : now;
    const endDate = new Date(end_date);

    if (!endDate || isNaN(endDate)) {
        throw new Error("End date is required and must be valid");
    }

    if (startDate >= endDate) {
        throw new Error("Start date must be before end date");
    }

    const promotion = await promotions.create({
        title,
        description,
        discount_percent,
        start_date: startDate,
        end_date: endDate,
        target_type,
        promo_code,
        creator_id: creatorId,
        is_active: true
    });

    return promotion;
}


async function getAllPromoCode() {
    return await promotions.findAll({
        where: {
            promo_code: { [Op.ne]: null } 
        }
    });
}

async function getPromoCodeById(promotionId) {
    const promotion = await promotions.findByPk(promotionId, {
        include: [
            {
                model: branch_promotions,
                as: 'branch_promotions',
                include: [
                    {
                        model: branches,
                        as: 'branch',
                        attributes: ['id', 'branch_name', 'work_days', 'open_times', 'close_times', 'descriptions', 'address', 'location_url']
                    }
                ]
            },
            {
                model: room_promotions,
                as: 'room_promotions',
                include: [
                    {
                        model: rooms,
                        as: 'room',
                        attributes: ['id', 'room_no', 'people_capacity', 'price_per_hour', 'equipments', 'is_available']
                    }
                ]
            }
        ]
    });

    if (!promotion) throw new Error('Promo Code not found');

    // Fetch photos for all branches
    const branchIds = promotion.branch_promotions?.map(bp => bp.branch_id) || [];
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

    // Fetch photos for all rooms
    const roomIds = promotion.room_promotions?.map(rp => rp.room_id) || [];
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

    // Add photos to the response
    const promotionData = promotion.toJSON();

    if (promotionData.branch_promotions) {
        promotionData.branch_promotions = promotionData.branch_promotions.map(bp => ({
            ...bp,
            branch: bp.branch ? {
                ...bp.branch,
                branchPhotos: branchPhotosMap[bp.branch_id] || []
            } : null
        }));
    }

    if (promotionData.room_promotions) {
        promotionData.room_promotions = promotionData.room_promotions.map(rp => ({
            ...rp,
            room: rp.room ? {
                ...rp.room,
                roomPhotos: roomPhotosMap[rp.room_id] || []
            } : null
        }));
    }

    return promotionData;
}

async function updatePromoCode(promotionId, data) {
    const promotion = await promotions.findByPk(promotionId);
    if (!promotion) throw new Error('Promo Code not found');

    await promotion.update(data);

    return promotion;
}

async function deletePromoCode(promotionId) {
    const promotion = await promotions.findByPk(promotionId);
    if (!promotion) throw new Error('Promo Code not found');

    await promotion.destroy();

    return { message: 'Promo Code deleted successfully' };
}

module.exports = {
    createPromoCode,
    getAllPromoCode,
    getPromoCodeById,
    updatePromoCode,
    deletePromoCode,
};
