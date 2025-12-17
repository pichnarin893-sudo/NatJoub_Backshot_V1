const { promotions, branch_promotions, room_promotions } = require('../../../../models');
const { Op, where } = require('sequelize');

async function createPromoCode(data, creatorId) {
    const { promo_code,title, description, discount_percent, start_date, end_date, target_type = "global"} = data;

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
        promo_code,
        creator_id: creatorId
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
            { model: branch_promotions, as: 'branch_promotions' },
            { model: room_promotions, as: 'room_promotions' }
        ]
    });

    if (!promotion) throw new Error('Promo Code not found');

    return promotion;
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
