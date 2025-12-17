'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {

    class payments extends Model {
        static associate(models) {
            // Belongs to a booking
            payments.belongsTo(models.bookings, {
                foreignKey: 'booking_id',
                as: 'booking'
            });
        }
    }

    payments.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        booking_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'bookings',
                key: 'id'
            }
        },
        transaction_id: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true
        },
        amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        currency: {
            type: DataTypes.STRING(3),
            defaultValue: 'USD'
        },
        payment_method: {
            type: DataTypes.STRING(50),
            defaultValue: 'ABA_PAYWAY'
        },
        qr_string: {
            type: DataTypes.TEXT
        },
        qr_image: {
            type: DataTypes.TEXT
        },
        abapay_deeplink: {
            type: DataTypes.TEXT
        },
        payment_status: {
            type: DataTypes.ENUM('pending', 'completed', 'failed', 'expired', 'cancelled', 'refunded'),
            defaultValue: 'pending'
        },
        payment_status_code: {
            type: DataTypes.INTEGER,
            comment: 'ABA payment status code: 0=pending, 1=completed, 2=failed, 3=cancelled, 4=refunded, 5=expired'
        },
        original_amount: {
            type: DataTypes.DECIMAL(10, 2),
            comment: 'Original payment amount'
        },
        refund_amount: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0,
            comment: 'Refunded amount'
        },
        discount_amount: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0,
            comment: 'Discount applied'
        },
        apv: {
            type: DataTypes.STRING(50),
            comment: 'ABA Payment Verification code'
        },
        transaction_date: {
            type: DataTypes.DATE,
            comment: 'Transaction completion date from ABA'
        },
        paid_at: {
            type: DataTypes.DATE
        },
        last_checked_at: {
            type: DataTypes.DATE,
            comment: 'Last time payment status was checked with ABA'
        },
        refund_status: {
            type: DataTypes.ENUM('none', 'pending', 'processing', 'completed', 'failed'),
            defaultValue: 'none',
            allowNull: false
        },
        refund_transaction_id: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        refunded_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        gateway_fee_amount: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0,
            allowNull: false
        }

    }, {
        sequelize,
        modelName: 'payments',
        tableName: 'payments',
        underscored: false,
        timestamps: true
    });

    return payments;
};