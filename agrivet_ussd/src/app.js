const express = require('express');
const bodyParser = require('body-parser');
const config = require('./config');
const dbPromise = require('./models'); // Now returns a promise
const ussdRoutes = require('./routes/ussdRoutes');
const i18n = require('./utils/i18n');

const app = express();

// Initialize i18n middleware
app.use(i18n.init);

// Middleware for parsing incoming request bodies
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Basic Health Check Route
app.get('/', (req, res) => {
  res.status(200).send('AgriVet USSD API is running!');
});

// Use USSD Routes
app.use('/', ussdRoutes);

// Initialize database and start server
(async () => {
  try {
    console.log('Initializing database connection...');
    const db = await dbPromise;
    
    console.log('Database connection initialized. Syncing models...');
    await db.sequelize.sync();
    
    console.log('Database synced successfully.');
    
    // Start the server
    app.listen(config.port, () => {
      console.log(`AgriVet USSD server running on port ${config.port}`);
    });
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
})();

// Export app for testing if needed
module.exports = app;