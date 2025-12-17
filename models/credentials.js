'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class credentials extends Model {
    static associate(models) {
      credentials.belongsTo(models.users, { foreignKey: 'user_id' });
    }
  }
  credentials.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    otp: DataTypes.INTEGER,
    otp_expiry: DataTypes.DATE,
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
    modelName: 'credentials',
  });
  return credentials;
};