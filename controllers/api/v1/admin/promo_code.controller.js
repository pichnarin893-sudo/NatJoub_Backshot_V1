const { promotions, branch_promotions, room_promotions } = require('../../../../models');
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
