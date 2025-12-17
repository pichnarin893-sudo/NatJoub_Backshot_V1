'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class sms_credentials extends Model {
    static associate(models) {
        sms_credentials.belongsTo(models.users, { foreignKey: 'user_id' });
    }
  }
    sms_credentials.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
      phone_number:{
          type: DataTypes.STRING,
          allowNull: false,
          unique: true
      },
        is_phone_verified:{
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false
        },
        last_otp_sent_at:{
            type: DataTypes.DATE,
            allowNull: true
        },
        verified_at:{
            type: DataTypes.DATE,
            allowNull: true
        },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    }
  }, {
    sequelize,
    modelName: 'sms_credentials',
  });
  return sms_credentials;
};