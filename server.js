require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const coinsRouter = require('./routes/coins');
const startCron = require('./cron/hourlySnapshot');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', coinsRouter);

// connect DB and start server
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, { autoIndex: true })
  .then(() => {
    console.log('MongoDB connected');
    // start cron only after DB connected
    startCron();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });