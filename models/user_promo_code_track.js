'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class user_promo_code_track extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Each record belongs to a user
      user_promo_code_track.belongsTo(models.users, {
        foreignKey: 'user_id',
        as: 'user'
      });
      // Each record belongs to a promotion
      user_promo_code_track.belongsTo(models.promotions, {
        foreignKey: 'promotion_id',
        as: 'promotion'
      });
    }
  }
  user_promo_code_track.init(
    {
      user_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      promotion_id: {
        type: DataTypes.UUID,
        allowNull: false
      }
    },
    {
      sequelize,
      modelName: 'user_promo_code_track',
      tableName: 'user_promo_code_tracks', // match migration table name
      timestamps: true // optional, ensures createdAt/updatedAt work
    }
  );

  return user_promo_code_track;
};