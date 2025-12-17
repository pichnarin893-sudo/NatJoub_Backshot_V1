'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Check if column already exists
        const tableDescription = await queryInterface.describeTable('bookings');

        if (!tableDescription.cancellation_requested_at) {
            // Add new column for tracking when cancellation was requested
            await queryInterface.addColumn('bookings', 'cancellation_requested_at', {
                type: Sequelize.DATE,
                allowNull: true,
                comment: 'Timestamp when customer requested cancellation'
            });
        }

        // Add index for efficient querying of pending cancellation requests
        try {
            await queryInterface.addIndex('bookings', ['status', 'cancellation_requested_at'], {
                name: 'idx_bookings_cancellation_requests'
            });
        } catch (error) {
            // Index might already exist, ignore error
            if (!error.message.includes('already exists')) {
                throw error;
            }
        }
    },

    async down(queryInterface, Sequelize) {
        // Remove index
        await queryInterface.removeIndex('bookings', 'idx_bookings_cancellation_requests');

        // Remove column
        await queryInterface.removeColumn('bookings', 'cancellation_requested_at');
    }
};
