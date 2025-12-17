'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // PostgreSQL: Change ENUM by altering the type
        await queryInterface.sequelize.query(`
            ALTER TYPE "enum_bookings_status" ADD VALUE IF NOT EXISTS 'cancellation_requested';
        `);
    },

    async down(queryInterface, Sequelize) {
        // Note: PostgreSQL doesn't support removing ENUM values directly
        // You would need to recreate the type and update all records
        // For safety, we'll leave this as a no-op in down migration
        console.log('WARNING: Cannot remove ENUM value in PostgreSQL. Manual intervention required if rollback needed.');
    }
};
