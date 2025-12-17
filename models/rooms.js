'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class rooms extends Model {
        static associate(models) {
            rooms.belongsTo(models.branches, { foreignKey: 'branch_id', as: 'branch' });
            rooms.hasMany(models.favorite_rooms, { foreignKey: 'room_id', as: 'room_favorites'});
            rooms.hasMany(models.bookings, { foreignKey: 'room_id', as: 'bookings'});
        }
    }
    rooms.init({
        id:{
            allowNull: false,
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        room_no:{
            type: DataTypes.STRING,
            allowNull: false
        },
        people_capacity:{
            type: DataTypes.INTEGER,
            allowNull: false
        },
        price_per_hour:{
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        equipments:{
            type: DataTypes.ARRAY(DataTypes.STRING),
        },
        is_available:{
            type: DataTypes.BOOLEAN,
            allowNull: false,
        },
        branch_id:{
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'branches',
                key: 'id',
            },
        },
    }, {
        sequelize,
        modelName: 'rooms',
    });
    return rooms;
};