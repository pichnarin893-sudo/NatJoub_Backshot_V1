'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notification_credentials', {
        id: {
            allowNull: false,
            primaryKey: true,
            type: Sequelize.UUID,
            defaultValue: Sequelize.literal('uuid_generate_v4()')
        },
        fcm_token:{
            type: Sequelize.TEXT,
            allowNull: false,
            unique: true
        },
        device_type:{
            type: Sequelize.ENUM('android', 'ios', 'web'),
            allowNull: false
        },
        is_disable:{
            type: Sequelize.BOOLEAN,
            defaultValue: true
        },
        user_id:{
            type: Sequelize.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
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
  async down(queryInterface) {
    await queryInterface.dropTable('notification_credentials');
  }
};