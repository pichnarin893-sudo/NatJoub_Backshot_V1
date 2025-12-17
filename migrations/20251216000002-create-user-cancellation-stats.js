'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('user_cancellation_stats', {
            id: {
                type: Sequelize.UUID,
                allowNull: false,
                primaryKey: true,
                defaultValue: Sequelize.literal('uuid_generate_v4()')
            },
            user_id: {
                type: Sequelize.UUID,
                allowNull: false,
                unique: true,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
                comment: 'User being tracked'
            },
            total_bookings: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
                allowNull: false,
                comment: 'Total number of bookings made by user'
            },
            total_cancellations: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
                allowNull: false,
                comment: 'Total number of cancellations by user'
            },
            cancellation_rate: {
                type: Sequelize.DECIMAL(5, 2),
                defaultValue: 0,
                allowNull: false,
                comment: 'Percentage of cancellations (total_cancellations / total_bookings * 100)'
            },
            is_flagged: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
                allowNull: false,
                comment: 'True if user has >30% cancellation rate'
            },
            last_cancellation_at: {
                type: Sequelize.DATE,
                allowNull: true,
                comment: 'Timestamp of most recent cancellation'
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });

        // Add indexes for better query performance
        await queryInterface.addIndex('user_cancellation_stats', ['user_id'], {
            name: 'idx_user_cancellation_stats_user_id'
        });

        await queryInterface.addIndex('user_cancellation_stats', ['is_flagged'], {
            name: 'idx_user_cancellation_stats_flagged'
        });

        await queryInterface.addIndex('user_cancellation_stats', ['cancellation_rate'], {
            name: 'idx_user_cancellation_stats_rate'
        });
    },

    async down(queryInterface, Sequelize) {
        // Drop indexes first
        await queryInterface.removeIndex('user_cancellation_stats', 'idx_user_cancellation_stats_user_id');
        await queryInterface.removeIndex('user_cancellation_stats', 'idx_user_cancellation_stats_flagged');
        await queryInterface.removeIndex('user_cancellation_stats', 'idx_user_cancellation_stats_rate');

        // Drop table
        await queryInterface.dropTable('user_cancellation_stats');
    }
};
