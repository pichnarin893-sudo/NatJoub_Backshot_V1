'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('photos', {
            id: {
                type: Sequelize.UUID,
                allowNull: false,
                primaryKey: true,
                defaultValue: Sequelize.literal('uuid_generate_v4()')
            },

            entity_type: {
                type: Sequelize.STRING(20),
                allowNull: false
            },

            entity_id: {
                type: Sequelize.UUID,
                allowNull: false
            },

            public_url: {
                type: Sequelize.STRING(500),
                allowNull: false
            },

            public_path: {
                type: Sequelize.STRING(300),
                allowNull: false
            },

            filename: {
                type: Sequelize.STRING(255)
            },

            mime_type: {
                type: Sequelize.STRING(50)
            },

            file_size: {
                type: Sequelize.INTEGER
            },

            display_order: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });

        // Add composite index for fast lookup (entity_type, entity_id)
        await queryInterface.addIndex('photos', ['entity_type', 'entity_id', 'display_order'], {
            name: 'idx_photos_entity'
        });

    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeIndex('photos', 'idx_photos_entity');
        await queryInterface.dropTable('photos');
    }
};
