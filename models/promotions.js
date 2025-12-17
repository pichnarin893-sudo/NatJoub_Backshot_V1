'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class promotions extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
        promotions.belongsTo(models.users, { foreignKey: 'creator_id', as: 'creator' });
        promotions.hasMany(models.branch_promotions, { foreignKey: 'promotion_id', as: 'branch_promotions' });
        promotions.hasMany(models.room_promotions, { foreignKey: 'promotion_id', as: 'room_promotions' });
        promotions.hasMany(models.bookings, { foreignKey: 'promotion_id', as: 'bookings' });
    }
  }
  promotions.init({
      id:{
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true
      },
      title:{
            type: DataTypes.STRING,
            allowNull: false
      },
      description:{
            type: DataTypes.TEXT,
            allowNull: true
      },
      discount_percent :{
        type: DataTypes.DECIMAL(5,2),
        allowNull: false
      },
      start_date :{
        type: DataTypes.DATE,
        allowNull: false
      },
      end_date:{
        type: DataTypes.DATE,
        allowNull: false
      },
      creator_id:{
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
      },
    target_type :{
        type: DataTypes.ENUM('branch', 'room', 'global'),
        allowNull: false
    },
    is_active :{
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    promo_code: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    per_user_limit: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    }
  }, {
    sequelize,
    modelName: 'promotions',
  });
  return promotions;
};