require('dotenv').config();
exports.Provider = require('./dist/Provider/Provider')
// exports.Consumer = require("./Consumer/Consumer")

const { MongoClient } = require('mongodb');
const lti = require('ltijs').Provider;

// Set up MongoDB connection
const mongoUri = 'mongodb://localhost:27017'; // Update the URI if needed
const client = new MongoClient(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

async function connectToMongoDB() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    return client.db('ltijs'); // Database name, you can rename if desired
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
}

connectToMongoDB().then((db) => {
  lti.setup('8bd5118c410d8361298e1b09910a8fb26bebf102034ae9079b721009f80da728', {
    plugin: {
      database: db,
      connection: client,
    },
  });
});
