'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class notification_credentials extends Model {
    static associate(models) {
      notification_credentials.belongsTo(models.users, { foreignKey: 'user_id' });
    }
  }
  notification_credentials.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
      fcm_token:{
          type: DataTypes.TEXT,
          allowNull: false,
          unique: true
      },
      device_type:{
          type: DataTypes.ENUM('android', 'ios', 'web'),
          allowNull: false
      },
      is_disable:{
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      user_id:{
        type: DataTypes.UUID,
          allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
      }
  }, {
    sequelize,
    modelName: 'notification_credentials',
  });
  return notification_credentials;
};