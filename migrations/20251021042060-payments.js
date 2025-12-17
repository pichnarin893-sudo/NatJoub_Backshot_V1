'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('payments', {
            id: {
                type: Sequelize.UUID,
                allowNull: false,
                primaryKey: true,
                defaultValue: Sequelize.literal('uuid_generate_v4()')
            },
            booking_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'bookings',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            transaction_id: {
                type: Sequelize.STRING(100),
                allowNull: false,
                unique: true
            },
            amount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false
            },
            currency: {
                type: Sequelize.STRING(3),
                defaultValue: 'USD'
            },
            payment_method: {
                type: Sequelize.STRING(50),
                defaultValue: 'ABA_PAYWAY'
            },
            qr_string: {
                type: Sequelize.TEXT
            },
            qr_image: {
                type: Sequelize.TEXT
            },
            abapay_deeplink: {
                type: Sequelize.TEXT
            },
            payment_status: {
                type: Sequelize.ENUM('pending', 'completed', 'failed', 'expired', 'cancelled', 'refunded'),
                defaultValue: 'pending'
            },
            payment_status_code: {
                type: Sequelize.INTEGER,
                comment: 'ABA payment status code: 0=pending, 1=completed, 2=failed, 3=cancelled, 4=refunded, 5=expired'
            },
            original_amount: {
                type: Sequelize.DECIMAL(10, 2),
                comment: 'Original payment amount'
            },
            refund_amount: {
                type: Sequelize.DECIMAL(10, 2),
                defaultValue: 0,
                comment: 'Refunded amount'
            },
            discount_amount: {
                type: Sequelize.DECIMAL(10, 2),
                defaultValue: 0,
                comment: 'Discount applied'
            },
            apv: {
                type: Sequelize.STRING(50),
                comment: 'ABA Payment Verification code'
            },
            transaction_date: {
                type: Sequelize.DATE,
                comment: 'Transaction completion date from ABA'
            },
            paid_at: {
                type: Sequelize.DATE
            },
            last_checked_at: {
                type: Sequelize.DATE,
                comment: 'Last time payment status was checked with ABA'
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });

        // Add indexes for better query performance
        await queryInterface.addIndex('payments', ['booking_id'], {
            name: 'idx_payments_booking_id'
        });

        await queryInterface.addIndex('payments', ['transaction_id'], {
            name: 'idx_payments_transaction_id'
        });

        await queryInterface.addIndex('payments', ['payment_status'], {
            name: 'idx_payments_status'
        });

        await queryInterface.addIndex('payments', ['createdAt'], {
            name: 'idx_payments_created_at'
        });
    },

    async down(queryInterface, Sequelize) {
        // Drop indexes first
        await queryInterface.removeIndex('payments', 'idx_payments_booking_id');
        await queryInterface.removeIndex('payments', 'idx_payments_transaction_id');
        await queryInterface.removeIndex('payments', 'idx_payments_status');
        await queryInterface.removeIndex('payments', 'idx_payments_created_at');

        // Drop table
        await queryInterface.dropTable('payments');
    }
};