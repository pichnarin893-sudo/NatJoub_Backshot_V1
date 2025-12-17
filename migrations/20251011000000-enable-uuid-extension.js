'use strict';

/**
 * Migration to enable UUID extension in PostgreSQL
 * This migration MUST run before all other migrations
 * as they depend on uuid_generate_v4() function
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
    );
    console.log('UUID extension enabled successfully');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      'DROP EXTENSION IF EXISTS "uuid-ossp";'
    );
    console.log('UUID extension removed');
  }
};
