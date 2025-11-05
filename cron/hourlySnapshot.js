const cron = require('node-cron');
const axios = require('axios');
const HistoryData = require('../models/HistoryData');

const COINGECKO_API = process.env.COINGECKO_API;

// Runs at minute 0 every hour
function startCron() {
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('Cron: fetching snapshot from CoinGecko...');
      const { data } = await axios.get(COINGECKO_API);
      const docs = data.map(coin => ({
        coinId: coin.id,
        name: coin.name,
        symbol: coin.symbol,
        price: coin.current_price,
        marketCap: coin.market_cap,
        change24h: coin.price_change_percentage_24h,
        timestamp: new Date()
      }));
      if (docs.length) {
        await HistoryData.insertMany(docs);
        console.log(`Cron: inserted ${docs.length} history docs at ${new Date().toISOString()}`);
      }
    } catch (err) {
      console.error('Cron error:', err.message);
    }
  });
}

module.exports = startCron;