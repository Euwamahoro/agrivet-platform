const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const config = require('../config');

const basename = path.basename(__filename);
const db = {};

console.log('=== DATABASE CONNECTION DEBUG ===');
console.log('Host:', config.db.host);
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
    host: config.db.host,
    port: config.db.port,
    dialect: config.db.dialect,
    dialectOptions: config.db.dialectOptions,
    logging: config.db.logging,
    pool: config.db.pool,
  }
);

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

module.exports = db;