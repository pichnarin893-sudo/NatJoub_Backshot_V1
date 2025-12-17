'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class user_cancellation_stats extends Model {
        static associate(models) {
            user_cancellation_stats.belongsTo(models.users, {
                foreignKey: 'user_id',
                as: 'user'
            });
        }
    }

    user_cancellation_stats.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true
        },
        total_bookings: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false
        },
        total_cancellations: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false
        },
        cancellation_rate: {
            type: DataTypes.DECIMAL(5, 2),
            defaultValue: 0,
            allowNull: false
        },
        is_flagged: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false
        },
        last_cancellation_at: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'user_cancellation_stats',
        tableName: 'user_cancellation_stats',
        timestamps: true
    });

    return user_cancellation_stats;
};
