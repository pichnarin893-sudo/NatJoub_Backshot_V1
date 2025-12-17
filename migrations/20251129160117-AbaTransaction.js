'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  // The 'up' function creates the new table structure
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('aba_transactions', {
      // Primary Key
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuid_generate_v4()')
      },
      // Transaction ID
      tranId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      // Invoice Reference
      invoice: {
        type: Sequelize.STRING,
        allowNull: false
      },
      // Foreign Key linking to the Users table
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users', // The actual table name of the User model
          key: 'id'
        },
        onUpdate: 'CASCADE', // Optional: What happens on user ID update
        onDelete: 'CASCADE'  // Optional: What happens when a linked user is deleted
      },
      // QR String
      qrString: {
        type: Sequelize.STRING,
        allowNull: true
      },
      // QR Image URL or Data
      qrImage: {
        type: Sequelize.STRING,
        allowNull: true
      },
      // Transaction Status using ENUM
      status: {
        type: Sequelize.ENUM('pending', 'completed', 'refund'),
        allowNull: false,
        defaultValue: 'pending'
      },
      // Sequelize default timestamp fields
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

  // The 'down' function reverses the change (drops the table)
  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('aba_transactions');
  }
};