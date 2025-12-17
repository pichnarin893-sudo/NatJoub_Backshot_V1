'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if roles already exist to avoid duplicates
    const existingRoles = await queryInterface.sequelize.query(
      'SELECT name FROM "roles" WHERE name IN (\'owner\', \'customer\', \'admin\')',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    
    const existingRoleNames = existingRoles.map(role => role.name);
    const rolesToCreate = [];
    
    if (!existingRoleNames.includes('owner')) {
      rolesToCreate.push({
        id: uuidv4(),
        name: 'owner',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    if (!existingRoleNames.includes('customer')) {
      rolesToCreate.push({
        id: uuidv4(),
        name: 'customer',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    if (!existingRoleNames.includes('admin')) {
      rolesToCreate.push({
        id: uuidv4(),
        name: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    if (rolesToCreate.length > 0) {
      await queryInterface.bulkInsert('roles', rolesToCreate);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('roles', {
      name: {
        [Sequelize.Op.in]: ['owner', 'customer', 'admin']
      }
    });
  }
};