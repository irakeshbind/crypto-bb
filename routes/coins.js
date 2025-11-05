const express = require("express");
const axios = require("axios");
const CurrentData = require("../models/CurrentData");
const HistoryData = require("../models/HistoryData");
const router = express.Router();

const COINGECKO_API = process.env.COINGECKO_API;

// helper to map CoinGecko response
function mapCoin(coin) {
  return {
    coinId: coin.id,
    name: coin.name,
    symbol: coin.symbol,
    price: coin.current_price,
    marketCap: coin.market_cap,
    change24h: coin.price_change_percentage_24h,
    lastUpdated: new Date(coin.last_updated),
  };
}

// GET /api/coins
router.get("/coins", async (req, res) => {
  try {
    const { data } = await axios.get(COINGECKO_API);
    const mapped = data.map(mapCoin);

    // Upsert CurrentData: overwrite existing docs (easy approach: bulk write)
    const bulkOps = mapped.map((c) => ({
      updateOne: {
        filter: { coinId: c.coinId },
        update: { $set: c },
        upsert: true,
      },
    }));
    if (bulkOps.length) await CurrentData.bulkWrite(bulkOps);

    res.json({ success: true, coins: mapped, lastSync: new Date() });
  } catch (err) {
    console.error("GET /api/coins error", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/history  -> store snapshot for all coins (called by cron or manual)
// Optionally accepts ?coins=coin1,coin2 to store only those.
router.post("/history", async (req, res) => {
  try {
    // fetch the latest from CoinGecko
    const { data } = await axios.get(COINGECKO_API);
    const mapped = data.map(mapCoin);

    const docs = mapped.map((c) => ({
      coinId: c.coinId,
      name: c.name,
      symbol: c.symbol,
      price: c.price,
      marketCap: c.marketCap,
      change24h: c.change24h,
      timestamp: new Date(),
    }));

    await HistoryData.insertMany(docs);

    res.json({ success: true, inserted: docs.length });
  } catch (err) {
    console.error("POST /api/history error", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/history/:coinId
router.get("/history/:coinId", async (req, res) => {
  try {
    const { coinId } = req.params;
    const limit = parseInt(req.query.limit || "500");
    const data = await HistoryData.find({ coinId })
      .sort({ timestamp: 1 })
      .limit(limit)
      .lean();
    res.json({ success: true, history: data });
  } catch (err) {
    console.error("GET /api/history/:coinId error", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;