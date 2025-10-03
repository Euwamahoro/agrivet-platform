const express = require('express');
const bodyParser = require('body-parser');
const config = require('./config');
const db = require('./models'); 
const ussdRoutes = require('./routes/ussdRoutes');
const i18n = require('./utils/i18n');

const app = express();

// Initialize i18n middleware
// Note: For USSD, we manually set locale in ussdService/controller,
// but having this middleware is good practice for general web requests too.
app.use(i18n.init);

// Middleware for parsing incoming request bodies
// USSD gateways typically send data as application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); // Also parse JSON if needed for other endpoints

// Basic Health Check Route
app.get('/', (req, res) => {
  res.status(200).send('AgriVet USSD API is running!');
});

// Use USSD Routes
app.use('/', ussdRoutes); // Or a specific prefix like '/api' if you have other APIs

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