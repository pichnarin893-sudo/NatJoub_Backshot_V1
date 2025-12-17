'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Add refund-related columns to bookings table
        await queryInterface.addColumn('bookings', 'refund_percentage', {
            type: Sequelize.DECIMAL(5, 2),
            allowNull: true,
            defaultValue: null,
            comment: 'Percentage of refund applied (0-100)'
        });

        await queryInterface.addColumn('bookings', 'cancellation_reason', {
            type: Sequelize.TEXT,
            allowNull: true,
            comment: 'Reason for cancellation provided by user'
        });

        await queryInterface.addColumn('bookings', 'cancelled_at', {
            type: Sequelize.DATE,
            allowNull: true,
            comment: 'Timestamp when booking was cancelled'
        });

        await queryInterface.addColumn('bookings', 'cancelled_by', {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
            comment: 'User who cancelled the booking (customer, admin, or owner)'
        });

        // Add refund-related columns to payments table
        await queryInterface.addColumn('payments', 'refund_status', {
            type: Sequelize.ENUM('none', 'pending', 'processing', 'completed', 'failed'),
            defaultValue: 'none',
            allowNull: false,
            comment: 'Status of refund process'
        });

        await queryInterface.addColumn('payments', 'refund_transaction_id', {
            type: Sequelize.STRING(100),
            allowNull: true,
            comment: 'ABA Bank refund transaction ID'
        });

        await queryInterface.addColumn('payments', 'refunded_at', {
            type: Sequelize.DATE,
            allowNull: true,
            comment: 'Timestamp when refund was completed'
        });

        await queryInterface.addColumn('payments', 'gateway_fee_amount', {
            type: Sequelize.DECIMAL(10, 2),
            defaultValue: 0,
            allowNull: false,
            comment: 'Payment gateway transaction fee deducted from refund'
        });

        // Add indexes for better query performance
        await queryInterface.addIndex('bookings', ['cancelled_by'], {
            name: 'idx_bookings_cancelled_by'
        });

        await queryInterface.addIndex('bookings', ['cancelled_at'], {
            name: 'idx_bookings_cancelled_at'
        });

        await queryInterface.addIndex('payments', ['refund_status'], {
            name: 'idx_payments_refund_status'
        });
    },

    async down(queryInterface, Sequelize) {
        // Remove indexes first
        await queryInterface.removeIndex('bookings', 'idx_bookings_cancelled_by');
        await queryInterface.removeIndex('bookings', 'idx_bookings_cancelled_at');
        await queryInterface.removeIndex('payments', 'idx_payments_refund_status');

        // Remove columns from payments table
        await queryInterface.removeColumn('payments', 'gateway_fee_amount');
        await queryInterface.removeColumn('payments', 'refunded_at');
        await queryInterface.removeColumn('payments', 'refund_transaction_id');
        await queryInterface.removeColumn('payments', 'refund_status');

        // Remove columns from bookings table
        await queryInterface.removeColumn('bookings', 'cancelled_by');
        await queryInterface.removeColumn('bookings', 'cancelled_at');
        await queryInterface.removeColumn('bookings', 'cancellation_reason');
        await queryInterface.removeColumn('bookings', 'refund_percentage');
    }
};
