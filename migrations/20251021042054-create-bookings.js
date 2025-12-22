'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('bookings', {
        id:{
            type: Sequelize.UUID,
            allowNull: false,
            primaryKey: true,
            defaultValue: Sequelize.literal('uuid_generate_v4()')
        },
        customer_id:{
            type: Sequelize.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        room_id:{
            type: Sequelize.UUID,
            allowNull: false,
            references: {
                model: 'rooms',
                key: 'id'
            }
        },
        start_time:{
            type: Sequelize.DATE,
            allowNull: false
        },
        end_time:{
            type: Sequelize.DATE,
            allowNull: false
        },
        total_price:{
            type: Sequelize.DECIMAL(10,3),
            allowNull: false
        },
        promotion_id:{
            type: Sequelize.UUID,
            allowNull: true,
            references: {
                model: 'promotions',
                key: 'id'
            }
        },
        status:{
            type: Sequelize.ENUM('pending', 'cancelled', 'completed', 'failed', 'expired', 'refunded'),
            allowNull: false,
            defaultValue: 'pending'
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
    await queryInterface.dropTable('bookings');
  }
};