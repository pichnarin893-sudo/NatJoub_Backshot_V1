'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class room_promotions extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
        room_promotions.belongsTo(models.rooms, { foreignKey: 'room_id', as: 'room' });
        room_promotions.belongsTo(models.promotions, { foreignKey: 'promotion_id', as: 'promotion' });
    }
  }
  room_promotions.init({
      id:{
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      room_id:{
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'rooms',
            key: 'id'
        }
      } ,
      promotion_id:{
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'promotions',
            key: 'id'
        }
      }
  }, {
    sequelize,
    modelName: 'room_promotions',
  });
  return room_promotions;
};