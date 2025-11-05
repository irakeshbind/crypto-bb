const mongoose = require('mongoose');

const HistoryDataSchema = new mongoose.Schema({
  coinId: { type: String, required: true },
  name: String,
  symbol: String,
  price: Number,
  marketCap: Number,
  change24h: Number,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('HistoryData', HistoryDataSchema);