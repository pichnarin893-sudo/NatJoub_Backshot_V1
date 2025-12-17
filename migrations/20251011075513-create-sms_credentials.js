'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('sms_credentials', {
        id: {
            allowNull: false,
            primaryKey: true,
            type: Sequelize.UUID,
            defaultValue: Sequelize.literal('uuid_generate_v4()')
        },
        phone_number: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
        },
        is_phone_verified: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        },
        last_otp_sent_at: {
            type: Sequelize.DATE,
            allowNull: true
        },
        verified_at: {
            type: Sequelize.DATE,
            allowNull: true
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
    await queryInterface.dropTable('sms_credentials');
  }
};