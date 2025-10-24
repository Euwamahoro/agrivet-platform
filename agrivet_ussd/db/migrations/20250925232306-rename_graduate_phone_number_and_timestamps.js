'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Rename 'phoneNumber' column to 'phone_number'
    await queryInterface.renameColumn('graduates', 'phoneNumber', 'phone_number');

    // Rename 'createdAt' column to 'created_at'
    await queryInterface.renameColumn('graduates', 'createdAt', 'created_at');

    // Rename 'updatedAt' column to 'updated_at'
    await queryInterface.renameColumn('graduates', 'updatedAt', 'updated_at');

    // NEW: Rename 'isAvailable' column to 'is_available'
    await queryInterface.renameColumn('graduates', 'isAvailable', 'is_available');
  },

  down: async (queryInterface, Sequelize) => {
    // Revert the column renames in case of rollback
    await queryInterface.renameColumn('graduates', 'phone_number', 'phoneNumber');
    await queryInterface.renameColumn('graduates', 'created_at', 'createdAt');
    await queryInterface.renameColumn('graduates', 'updated_at', 'updatedAt');
    // NEW: Revert 'is_available' to 'isAvailable'
    await queryInterface.renameColumn('graduates', 'is_available', 'isAvailable');
  },
};