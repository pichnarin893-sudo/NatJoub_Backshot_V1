'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class branches extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
        branches.belongsTo(models.users, { foreignKey: 'owner_id', as: 'owner' });
        branches.hasMany(models.branch_promotions, { foreignKey: 'branch_id', as: 'branch_promotions' });
        branches.hasMany(models.rooms, { foreignKey: 'branch_id', as: 'rooms' });
        branches.hasMany(models.favorite_rooms, { foreignKey: 'branch_id', as: 'branch_room_favorites' });

    }
  }
    branches.init({
      id:{
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          allowNull: false,
          primaryKey: true
      },
      owner_id:{
          type: DataTypes.UUID,
          allowNull: false,
          references:{
                model: 'users',
                key: 'id'
          }
      },
      branch_name:{
          type: DataTypes.STRING,
          allowNull: false
      },
      work_days:{
            type: DataTypes.ARRAY(DataTypes.STRING),
          allowNull: false
      },
      open_times:{
            type: DataTypes.TIME,
            allowNull: false
      },
      close_times:{
            type: DataTypes.TIME,
            allowNull: false
      },
      room_amount:{
            type: DataTypes.INTEGER,
            allowNull: false
      },
      descriptions:{
            type: DataTypes.TEXT,
            allowNull: true
      },
      address:{
            type: DataTypes.STRING,
            allowNull: false
      },
      location_url:{
            type: DataTypes.STRING,
            allowNull: true
      },
      is_active:{
            type: DataTypes.BOOLEAN,
            defaultValue: true
      },
        latitude:{
            type: DataTypes.DECIMAL(10, 7),
            allowNull: true
        },
        longitude:{
            type: DataTypes.DECIMAL(10, 7),
            allowNull: true
        },
        lat_long_base_url:{
            type: DataTypes.STRING,
            allowNull: true
        }
  }, {
    sequelize,
    modelName: 'branches',
  });
  return branches;
};