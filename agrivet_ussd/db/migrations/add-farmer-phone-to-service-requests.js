// migrations/20241101000000-add-farmer-phone-to-service-requests.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🚀 Starting migration: Adding farmer_phone to service_requests');
    
    try {
      // Step 1: Add the farmer_phone column
      console.log('📝 Step 1: Adding farmer_phone column...');
      await queryInterface.addColumn('service_requests', 'farmer_phone', {
        type: Sequelize.STRING,
        allowNull: true
      });
      console.log('✅ Column added successfully');

      // Step 2: Update existing records with farmer phone numbers
      console.log('🔄 Step 2: Updating existing records with farmer phone numbers...');
      const [updateResult] = await queryInterface.sequelize.query(`
        UPDATE service_requests 
        SET farmer_phone = farmers.phone_number
        FROM farmers 
        WHERE service_requests.farmer_id = farmers.id
        AND service_requests.farmer_phone IS NULL
      `);
      console.log('✅ Records updated');

      // Step 3: Verify the migration
      console.log('🔍 Step 3: Verifying migration...');
      const [verifyResult] = await queryInterface.sequelize.query(`
        SELECT COUNT(*) as count_with_phone
        FROM service_requests 
        WHERE farmer_phone IS NOT NULL
      `);
      
      console.log(`✅ Migration complete: ${verifyResult[0].count_with_phone} service requests now have farmer phone numbers`);

    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    console.log('🔄 Rolling back migration...');
    await queryInterface.removeColumn('service_requests', 'farmer_phone');
    console.log('✅ Column removed');
  }
};