'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('rooms', {
        id:{
            allowNull: false,
            primaryKey: true,
            type: Sequelize.UUID,
            defaultValue: Sequelize.literal('uuid_generate_v4()')
        },
        room_no:{
            type: Sequelize.STRING,
            allowNull: false
        },
        people_capacity:{
            type: Sequelize.INTEGER,
            allowNull: false
        },
        price_per_hour:{
            type: Sequelize.DECIMAL(10,3),
            allowNull: false
        },
        equipments:{
            type: Sequelize.ARRAY(Sequelize.STRING),
        },
        is_available:{
            type: Sequelize.BOOLEAN,
            allowNull: false,
        },
        branch_id:{
            type: Sequelize.UUID,
            allowNull: false,
            references: {
                model: 'branches',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
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
    await queryInterface.dropTable('rooms');
  }
};