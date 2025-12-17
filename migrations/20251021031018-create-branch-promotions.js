'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('branch_promotions', {
        id:{
            allowNull: false,
            primaryKey: true,
            type: Sequelize.UUID,
            defaultValue: Sequelize.literal('uuid_generate_v4()')
        },
        branch_id:{
            type: Sequelize.UUID,
            allowNull: false,
            references: {
                model: 'branches',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT'
        },
        promotion_id:{
            type: Sequelize.UUID,
            allowNull: false,
            references: {
                model: 'promotions',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT'
        },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('branch_promotions');
  }
};