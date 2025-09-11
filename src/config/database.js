const config = require('./index');

module.exports = {
  development: {
    username: config.db.user,
    password: config.db.password,
    database: config.db.name,
    host: config.db.host,
    port: config.db.port,
    dialect: config.db.dialect,
    dialectOptions: config.db.dialectOptions,
    logging: config.db.logging,
  },
  test: {
    username: config.db.username,
    password: config.db.password,
    database: config.db.database + '_test',
    host: config.db.host,
    port: config.db.port,
    dialect: config.db.dialect,
    dialectOptions: config.db.dialectOptions,
    logging: false,
  },
  production: {
    username: config.db.username,
    password: config.db.password,
    database: config.db.database,
    host: config.db.host,
    port: config.db.port,
    dialect: config.db.dialect,
    dialectOptions: config.db.dialectOptions,
    logging: false,
  },
};