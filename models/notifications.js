'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class notifications extends Model {
    static associate(models) {
      notifications.belongsTo(models.users, { foreignKey: 'sender_id', as: 'sender' });
      notifications.belongsTo(models.users, { foreignKey: 'receiver_id', as: 'receiver' });
    }
  }

  notifications.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
      title:{
          type: DataTypes.TEXT,
          allowNull: false
      },
      body:{
          type: DataTypes.TEXT,
          allowNull: false
      },
      data:{
          type: DataTypes.JSON,
          allowNull: true
      },
      is_read:{
          type: DataTypes.BOOLEAN,
          defaultValue: false,
      },
      sender_id:{
          type: DataTypes.UUID,
          allowNull: false,
          references:{
                model: 'users',
                key: 'id'
          }
      },
      receiver_id:{
          type: DataTypes.UUID,
          allowNull: false,
          references:{
                model: 'users',
                key: 'id'
          }
      },
  }, {
    sequelize,
    modelName: 'notifications',
  });
  return notifications;
};