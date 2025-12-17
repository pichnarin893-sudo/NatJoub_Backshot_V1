'use strict';
const {Model} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class bookings extends
      Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
        bookings.belongsTo(models.users, { foreignKey: 'customer_id', as: 'customer' });
        bookings.belongsTo(models.rooms, { foreignKey: 'room_id', as: 'room' });
        bookings.belongsTo(models.promotions, { foreignKey: 'promotion_id', as: 'promotion' });
        bookings.belongsTo(models.users, { foreignKey: 'cancelled_by', as: 'canceller' });
        bookings.hasOne(models.payments, { foreignKey: 'booking_id', as: 'payment' });
    }
  }
  bookings.init({
      id:{
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true
      },
      customer_id:{
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
      },
      room_id:{
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'rooms',
                key: 'id'
            }
      },
      start_time:{
            type: DataTypes.DATE, //example '2024-10-10 14:00:00'
            allowNull: false
      },
      end_time:{
            type: DataTypes.DATE,
            allowNull: false
      },
      total_price:{
            type: DataTypes.DECIMAL(10,3),
            allowNull: false
      },
      promotion_id:{
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'promotions',
                key: 'id'
            }
      },
      status:{
            type: DataTypes.ENUM('pending', 'completed', 'cancelled', 'failed', 'expired', 'cancellation_requested'),
            allowNull: false,
            defaultValue: 'pending'
      },
      refund_percentage:{
            type: DataTypes.DECIMAL(5,2),
            allowNull: true
      },
      cancellation_reason:{
            type: DataTypes.TEXT,
            allowNull: true
      },
      cancelled_at:{
            type: DataTypes.DATE,
            allowNull: true
      },
      cancelled_by:{
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id'
            }
      },
      cancellation_requested_at:{
            type: DataTypes.DATE,
            allowNull: true
      },
  }, {
    sequelize,
    modelName: 'bookings',
  });
  return bookings;
};