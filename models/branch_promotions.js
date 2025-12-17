'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class branch_promotions extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
        branch_promotions.belongsTo(models.branches, { foreignKey: 'branch_id', as: 'branch' });
        branch_promotions.belongsTo(models.promotions, { foreignKey: 'promotion_id', as: 'promotion' });

    }
  }
  branch_promotions.init({
      id:{
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true
      },
      branch_id:{
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'branches',
                key: 'id'
            }
      },
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
    modelName: 'branch_promotions',
  });
  return branch_promotions;
};