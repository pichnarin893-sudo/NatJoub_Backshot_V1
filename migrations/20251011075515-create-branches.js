'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('branches', {
        id:{
            allowNull: false,
            primaryKey: true,
            type: Sequelize.UUID,
            defaultValue: Sequelize.literal('uuid_generate_v4()')
        },
        owner_id:{
            type: Sequelize.UUID,
            allowNull: false,
            references:{
                model: 'users',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT'
        },
        branch_name:{
            type: Sequelize.STRING,
            allowNull: false
        },
        work_days:{
            type: Sequelize.ARRAY(Sequelize.STRING),
            allowNull: false
        },
        open_times:{
            type: Sequelize.TIME,
            allowNull: false
        },
        close_times:{
            type: Sequelize.TIME,
            allowNull: false
        },
        room_amount:{
            type: Sequelize.INTEGER,
            allowNull: false
        },
        descriptions:{
            type: Sequelize.TEXT,
            allowNull: true
        },
        address:{
            type: Sequelize.STRING,
            allowNull: false
        },
        location_url:{
            type: Sequelize.STRING,
            allowNull: true
        },
        is_active:{
            type: Sequelize.BOOLEAN,
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
    await queryInterface.dropTable('branches');
  }
};