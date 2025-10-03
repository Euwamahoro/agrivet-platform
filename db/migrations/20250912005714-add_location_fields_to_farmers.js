'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('farmers', 'province', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('farmers', 'district', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('farmers', 'sector', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('farmers', 'cell', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('farmers', 'province');
    await queryInterface.removeColumn('farmers', 'district');
    await queryInterface.removeColumn('farmers', 'sector');
    await queryInterface.removeColumn('farmers', 'cell');
  },
};