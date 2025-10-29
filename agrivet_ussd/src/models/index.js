const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const config = require('../config');
const dns = require('dns').promises;

const basename = path.basename(__filename);
const db = {};

// Function to resolve hostname to IPv4 only
async function resolveToIPv4(hostname) {
  try {
    const addresses = await dns.resolve4(hostname);
    console.log(`Resolved ${hostname} to IPv4: ${addresses[0]}`);
    return addresses[0]; // Return first IPv4 address
  } catch (error) {
    console.error(`Failed to resolve ${hostname}:`, error.message);
    return hostname; // Fallback to original hostname
  }
}

// Initialize database connection
async function initializeDatabase() {
  // Resolve hostname to IPv4 address
  const resolvedHost = await resolveToIPv4(config.db.host);
  
  console.log('=== DATABASE CONNECTION DEBUG ===');
  console.log('Original Host:', config.db.host);
  console.log('Resolved Host:', resolvedHost);
  console.log('Port:', config.db.port);
  console.log('Database:', config.db.name);
  console.log('User:', config.db.user);
  console.log('Password length:', config.db.password ? config.db.password.length : 'undefined');
  console.log('================================');

  const sequelize = new Sequelize(
    config.db.name,
    config.db.user,
    config.db.password,
    {
      host: resolvedHost, // Use resolved IPv4 address
      port: config.db.port,
      dialect: config.db.dialect,
      dialectOptions: config.db.dialectOptions,
      logging: config.db.logging,
      pool: config.db.pool,
    }
  );

  // Load models
  fs.readdirSync(__dirname)
    .filter((file) => {
      return (
        file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js'
      );
    })
    .forEach((file) => {
      const model = require(path.join(__dirname, file))(
        sequelize,
        Sequelize.DataTypes
      );
      db[model.name] = model;
    });

  Object.keys(db).forEach((modelName) => {
    if (db[modelName].associate) {
      db[modelName].associate(db);
    }
  });

  db.sequelize = sequelize;
  db.Sequelize = Sequelize;

  return db;
}

// Export a promise that resolves to the db object
module.exports = initializeDatabase();