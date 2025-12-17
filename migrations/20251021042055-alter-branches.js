'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('branches', 'latitude', {
            type: Sequelize.DECIMAL(10, 7),
            allowNull: true,
        });
        await queryInterface.addColumn('branches', 'longitude', {
            type: Sequelize.DECIMAL(10, 7),
            allowNull: true,
        });
        await queryInterface.addColumn('branches', 'lat_long_base_url', {
            type: Sequelize.STRING,
            allowNull: true,
        })
    },

    async down(queryInterface, Sequelize) {
        // remove in reverse order (safe practice)
        await queryInterface.removeColumn('branches', 'latitude');
        await queryInterface.removeColumn('branches', 'longitude');
        await queryInterface.removeColumn('branches', 'lat_long_base_url');
    }
};
