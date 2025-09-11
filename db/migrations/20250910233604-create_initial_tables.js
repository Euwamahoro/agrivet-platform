'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create Farmers table
    await queryInterface.createTable('farmers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      phoneNumber: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      locationText: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Create Graduates table
    await queryInterface.createTable('graduates', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      phoneNumber: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      expertise: {
        type: Sequelize.ENUM('agronomy', 'veterinary', 'both'),
        allowNull: false,
      },
      location: {
        type: Sequelize.GEOMETRY('Point', 4326), // PostGIS Point type, SRID 4326 for WGS84
        allowNull: false,
      },
      isAvailable: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Add spatial index to the 'location' column of the 'graduates' table
    // SP-GiST is often preferred for Point data in PostGIS
    await queryInterface.addIndex('graduates', ['location'], {
      name: 'graduates_location_idx',
      using: 'GIST'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the index first
    await queryInterface.removeIndex('graduates', 'graduates_location_idx');
    await queryInterface.dropTable('graduates');
    await queryInterface.dropTable('farmers');
  },
};