'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
        id: {
            allowNull: false,
            primaryKey: true,
            type: Sequelize.UUID,
            defaultValue: Sequelize.literal('uuid_generate_v4()')
        },
        first_name: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        last_name:{
            type: Sequelize.STRING,
            allowNull: false,
        },
        dob:{
            type: Sequelize.DATEONLY,
            allowNull: false
        },
        gender:{
            type: Sequelize.ENUM('male', 'female'),
            allowNull: false
        },
        address:{
            type: Sequelize.STRING,
            allowNull: true
        },
        is_suspended:{
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        role_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
                model: 'roles',
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
    await queryInterface.dropTable('users');
  }
};