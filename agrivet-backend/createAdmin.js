// createAdmin.js - Complete script with proper password hashing
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// MongoDB connection URL - replace with your actual connection string
const MONGODB_URI = process.env.MONGODB_URI;

// User schema (should match your existing user model)
const userSchema = new mongoose.Schema({
  phoneNumber: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'graduate', 'admin'], default: 'user' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function createAdminUser() {
  try {
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      $or: [
        { phoneNumber: '0780000001' },
        { email: 'deployer@agrivet.com' }
      ]
    });

    if (existingAdmin) {
      console.log('⚠️ Admin user already exists:');
      console.log(`   Phone: ${existingAdmin.phoneNumber}`);
      console.log(`   Name: ${existingAdmin.name}`);
      console.log(`   Role: ${existingAdmin.role}`);
      return;
    }

    // Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash('deploy1123#', saltRounds);

    // Create admin user
    const adminUser = new User({
      phoneNumber: '0780000001',
      name: 'deployer',
      email: 'deployer@agrivet.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Save to database
    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    console.log('📋 Admin Details:');
    console.log(`   Phone: ${adminUser.phoneNumber}`);
    console.log(`   Name: ${adminUser.name}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   Password: deploy1123#`);
    console.log(`   Status: ${adminUser.isActive ? 'Active' : 'Inactive'}`);

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);
  }
}

// Run the script
createAdminUser();