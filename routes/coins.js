import express from "express";
import axios from "axios";
import NodeCache from "node-cache";

const router = express.Router();
const cache = new NodeCache({ stdTTL: 180 }); // cache for 3 minutes

router.get("/coins", async (req, res) => {
  const cacheKey = "top10coins";
  const cachedData = cache.get(cacheKey);

  // ✅ Return cached data if available
  if (cachedData) {
    console.log("💾 Serving from cache");
    return res.json(cachedData);
  }

  try {
    console.log("🌐 Fetching from CoinGecko...");
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/coins/markets",
      {
        params: {
          vs_currency: "usd",
          order: "market_cap_desc",
          per_page: 10,
          page: 1,
          sparkline: false
        },
        headers: { "Accept-Encoding": "gzip,deflate,compress" }
      }
    );

    const coins = response.data.map((coin) => ({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol,
      price: coin.current_price,
      marketCap: coin.market_cap,
      change24h: coin.price_change_percentage_24h,
      lastUpdated: coin.last_updated
    }));

    // ✅ Cache the result
    cache.set(cacheKey, coins);

    res.json(coins);
  } catch (err) {
    console.error("❌ Error fetching coins:", err.message);

    if (err.response && err.response.status === 429) {
      return res.status(429).json({
        error: "Rate limit exceeded. Please wait a few moments and try again."
      });
    }

    res.status(500).json({ error: "Failed to fetch coins." });
  }
});

export default router;
