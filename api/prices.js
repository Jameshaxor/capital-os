import yahooFinance from 'yahoo-finance2';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // The Indian stocks you want to track live (.NS for NSE)
  const symbols = ['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS', 'ITC.NS'];

  try {
    const quotes = await yahooFinance.quote(symbols);
    const cleanData = quotes.map(q => ({
      sym: q.symbol.replace('.NS', ''),
      name: q.shortName || q.longName,
      price: q.regularMarketPrice,
      changePct: q.regularMarketChangePercent,
      vol: 0.002
    }));

    res.status(200).json(cleanData);
  } catch (error) {
    console.error("Yahoo Finance Error:", error);
    res.status(500).json({ error: 'Failed to fetch live market data' });
  }
}
