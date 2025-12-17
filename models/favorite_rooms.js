'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  
  class favorite_rooms extends Model {
    static associate(models) {
        favorite_rooms.belongsTo(models.rooms, { foreignKey: 'room_id' });
        favorite_rooms.belongsTo(models.users, { foreignKey: 'user_id' });
        favorite_rooms.belongsTo(models.branches, { foreignKey: 'branch_id' });
    }
  }

    favorite_rooms.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
      room_id: {
      type: DataTypes.UUID,
      allowNull: false,
        references: {
            model: 'rooms',
            key: 'id'
        }
    },
        branch_id: {
      type: DataTypes.UUID,
      allowNull: false,
        references: {
            model: 'branches',
            key: 'id'
        }
    },
  }, {
    sequelize,
    modelName: 'favorite_rooms',
  });
  return favorite_rooms;
};