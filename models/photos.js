'use strict';
const {Model} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class photos extends Model {
        static associate(models) {
            photos.belongsTo(models.rooms, {
                foreignKey: "entity_id",
                constraints: false,
                as: "room",
                scope: { entity_type: "rooms" },
            });

            // Branches: one-to-many
            photos.belongsTo(models.branches, {
                foreignKey: "entity_id",
                constraints: false,
                as: "branch",
                scope: { entity_type: "branches" },
            });

            // // Users: one-to-one
            // photos.belongsTo(models.credentials, {
            //     foreignKey: "entity_id",
            //     constraints: false,
            //     as: "user",
            //     scope: { entity_type: "credentials" },
            // });
        }
    }

    photos.init(
        {
            id: {type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true},
            entity_type: {
                type: DataTypes.STRING(20),
                allowNull: false,
                validate: {isIn: [["rooms", "branches", "credentials"]]},
            },
            entity_id: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            public_url: {type: DataTypes.STRING(500), allowNull: false},
            public_path: {type: DataTypes.STRING(300), allowNull: false},
            filename: DataTypes.STRING(255),
            mime_type: DataTypes.STRING(50),
            file_size: DataTypes.INTEGER,
            display_order: {type: DataTypes.INTEGER, defaultValue: 0},
        },
        {
            sequelize,
            modelName: "photos",
            tableName: "photos",
        }
    );

    return photos;
};