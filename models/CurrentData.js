const mongoose = require("mongoose");
const CurrentDataSchema = new mongoose.Schema(
  {
    coinId: { type: String, required: true, unique: true },
    name: String,
    symbol: String,
    price: Number,
    marketCap: Number,
    change24h: Number,
    lastUpdated: Date,
  },
  { timestamps: true }
);
module.exports = mongoose.model("CurrentData", CurrentDataSchema);