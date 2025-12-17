'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('promotions', 'promo_code', {
      type: Sequelize.STRING,
      allowNull: true,       // can be null for automatic/global promotions
      unique: true        
    });

    await queryInterface.addColumn('promotions', 'per_user_limit', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1        // default: user can use this promo only once
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('promotions', 'promo_code');
    await queryInterface.removeColumn('promotions', 'per_user_limit');
  }
};
