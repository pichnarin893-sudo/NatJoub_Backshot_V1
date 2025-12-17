    'use strict';
    const { Model } = require('sequelize');
    module.exports = (sequelize, DataTypes) => {
      class roles extends Model {
        static associate(models) {
          roles.hasMany(models.users, { foreignKey: 'role_id' });
        }
      }
      roles.init({
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          allowNull: false,
          primaryKey: true
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true
        }
      }, {
        sequelize,
        modelName: 'roles',
      });
      return roles;
    };