'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('promotions', {
        id:{
            allowNull: false,
            primaryKey: true,
            type: Sequelize.UUID,
            defaultValue: Sequelize.literal('uuid_generate_v4()')
        },
        title:{
            type: Sequelize.STRING,
            allowNull: false
        },
        description:{
            type: Sequelize.TEXT,
            allowNull: true
        },
        discount_percent :{
            type: Sequelize.DECIMAL(5,2),
            allowNull: false
        },
        start_date :{
            type: Sequelize.DATE,
            allowNull: false
        },
        end_date:{
            type: Sequelize.DATE,
            allowNull: false
        },
        creator_id:{
            type: Sequelize.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT'
        },
        target_type :{
            type: Sequelize.ENUM('branch', 'room', 'global'),
            allowNull: false
        },
        is_active :{
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true
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
    await queryInterface.dropTable('promotions');
  }
};