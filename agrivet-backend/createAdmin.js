// runMigration.js
const { sequelize } = require('./models'); // Adjust path to your USSD models

async function runMigration() {
  try {
    console.log('🚀 Running farmer_phone migration...');
    
    // Add the column
    await sequelize.query(`
      ALTER TABLE service_requests 
      ADD COLUMN IF NOT EXISTS farmer_phone VARCHAR(255)
    `);
    
    console.log('✅ Column added');
    
    // Update existing records
    await sequelize.query(`
      UPDATE service_requests 
      SET farmer_phone = farmers.phone_number
      FROM farmers 
      WHERE service_requests.farmer_id = farmers.id
      AND service_requests.farmer_phone IS NULL
    `);
    
    console.log('✅ Existing records updated');
    
    // Verify the migration
    const result = await sequelize.query(`
      SELECT COUNT(*) as updated_count 
      FROM service_requests 
      WHERE farmer_phone IS NOT NULL
    `);
    
    console.log(`✅ ${result[0][0].updated_count} service requests now have farmer phone numbers`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await sequelize.close();
  }
}

runMigration();