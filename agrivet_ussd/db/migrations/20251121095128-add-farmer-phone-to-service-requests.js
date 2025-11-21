// In the generated migration file
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('service_requests', 'farmer_phone', {
      type: Sequelize.STRING,
      allowNull: false
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('service_requests', 'farmer_phone');
  }
};