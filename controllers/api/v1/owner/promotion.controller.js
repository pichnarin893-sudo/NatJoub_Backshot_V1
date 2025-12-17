const { promotions, branch_promotions, room_promotions } = require('../../../../models');
const { Op } = require('sequelize');

async function createPromotion(data, creatorId) {
    const { title, description, discount_percent, start_date, end_date, target_type } = data;

    // Optional: validate dates
    if (new Date(start_date) >= new Date(end_date)) {
        throw new Error("Start date must be before end date");
    }

    // Create promotion
    const promotion = await promotions.create({
        title,
        description,
        discount_percent,
        start_date,
        end_date,
        target_type,
        creator_id: creatorId
    });

    return promotion;
}

async function getAllPromotions() {
    return await promotions.findAll({
        order: [['createdAt', 'DESC']]
    });
}

async function getPromotionById(promotionId) {
    const promotion = await promotions.findByPk(promotionId, {
        include: [
            { model: branch_promotions, as: 'branch_promotions' },
            { model: room_promotions, as: 'room_promotions' }
        ]
    });

    if (!promotion) throw new Error('Promotion not found');

    return promotion;
}

async function updatePromotion(promotionId, data) {
    const promotion = await promotions.findByPk(promotionId);
    if (!promotion) throw new Error('Promotion not found');

    await promotion.update(data);

    return promotion;
}

async function attachPromotion(promotionId, data) {
    const { branchIds = [], roomIds = [] } = data;

    // 1. Check promotion exists
    const promotion = await promotions.findByPk(promotionId);
    if (!promotion) throw new Error("Promotion not found");

    // 2. If target_type = branch → only allow branchIds
    if (promotion.target_type === "branch" && branchIds.length === 0) {
        throw new Error("This promotion targets branches. Provide branchIds.");
    }

    // 3. If target_type = room → only allow roomIds
    if (promotion.target_type === "room" && roomIds.length === 0) {
        throw new Error("This promotion targets rooms. Provide roomIds.");
    }

    // 4. Attach to branches
    if (branchIds.length > 0) {
        for (const branchId of branchIds) {
            const exists = await branch_promotions.findOne({
                where: { branch_id: branchId, promotion_id: promotionId }
            });

            if (!exists) {
                await branch_promotions.create({
                    branch_id: branchId,
                    promotion_id: promotionId
                });
            }
        }
    }

    // 5. Attach to rooms
    if (roomIds.length > 0) {
        for (const roomId of roomIds) {
            const exists = await room_promotions.findOne({
                where: { room_id: roomId, promotion_id: promotionId }
            });

            if (!exists) {
                await room_promotions.create({
                    room_id: roomId,
                    promotion_id: promotionId
                });
            }
        }
    }

    if(branchIds.length > 0 ){
        return { message: "Promotion successfully attached to branch" };
    }else{
        return { message: "Promotion successfully attached to room" };
    }

}

async function deletePromotion(promotionId) {
    const promotion = await promotions.findByPk(promotionId);
    if (!promotion) throw new Error('Promotion not found');

    await promotion.destroy();

    return { message: 'Promotion deleted successfully' };
}

module.exports = {
    createPromotion,
    getAllPromotions,
    getPromotionById,
    updatePromotion,
    deletePromotion,
    attachPromotion
};
