'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  
  class users extends Model {
    static associate(models) {
      users.belongsTo(models.roles, { foreignKey: 'role_id' });
      users.hasOne(models.credentials, { foreignKey: 'user_id' });
      users.hasOne(models.sms_credentials, { foreignKey: 'user_id' });
      users.hasMany(models.notification_credentials, { foreignKey: 'user_id' });
      users.hasMany(models.notifications, { foreignKey: 'sender_id', as: 'sent_notifications' });
      users.hasMany(models.notifications, { foreignKey: 'receiver_id', as: 'received_notifications' });
      users.hasMany(models.branches, { foreignKey: 'owner_id', as: 'owned_branches' });
      users.hasMany(models.promotions, { foreignKey: 'creator_id', as: 'created_promotions' });
      users.hasMany(models.bookings, { foreignKey: 'customer_id', as: 'customer_bookings' });
      users.hasMany(models.favorite_rooms, { foreignKey: 'user_id', as: 'customer_favorites' });
    }
  }

  users.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    first_name: DataTypes.STRING,
    last_name: DataTypes.STRING,
    dob: DataTypes.DATEONLY,
    gender: DataTypes.ENUM('male', 'female'),
    address: DataTypes.STRING,
    is_suspended: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    role_id: {
      type: DataTypes.UUID,
      allowNull: false,
        references: {
            model: 'roles',
            key: 'id'
        }
    },
  }, {
    sequelize,
    modelName: 'users',
  });
  return users;
};