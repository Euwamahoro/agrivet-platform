const express = require('express');
const bodyParser = require('body-parser');
const config = require('./config');
const db = require('./models'); // Import Sequelize and models

const app = express();

// Middleware for parsing incoming request bodies
// USSD gateways typically send data as application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); // Also parse JSON if needed for other endpoints

// Basic Health Check Route
app.get('/', (req, res) => {
  res.status(200).send('AgriVet USSD API is running!');
});

// Synchronize models with the database (for development ONLY - migrations are preferred for production)
db.sequelize
  .sync()
  .then(() => {
    console.log('Database synced successfully.');
    // Start the server only after the database connection is established
    app.listen(config.port, () => {
      console.log(`AgriVet USSD server running on port ${config.port}`);
    });
  })
  .catch((error) => {
    console.error('Error syncing database:', error);
    process.exit(1); // Exit if database connection fails
  });

// Export app for testing if needed
module.exports = app;