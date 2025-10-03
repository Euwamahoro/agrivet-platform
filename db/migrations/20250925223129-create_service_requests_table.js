'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('service_requests', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      farmer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'farmers',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      graduate_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'graduates',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL', // If a graduate is removed, set this to NULL
      },
      service_type: {
        type: Sequelize.ENUM('agronomy', 'veterinary'),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('pending', 'assigned', 'in_progress', 'completed', 'cancelled', 'no_match'),
        defaultValue: 'pending',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('service_requests');
  },
};