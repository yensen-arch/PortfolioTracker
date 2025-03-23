import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { Portfolio } from "./models/Portfolio.js";

dotenv.config();

const app = express();
app.use(
  cors({
    origin: ["https://portfolio-tracker-olive.vercel.app", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

mongoose
  .connect(
    "mongodb+srv://officialdevain25:yuYyClR4u6UYv386@cluster0.ykjl8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
  )
  .then(async () => {
    console.log("Connected to Mongo Atlas");
    await initializeDefaultUser();
  })
  .catch((error) => console.error("MongoDB connection error:", error));

// Create default test user if it doesn't exist
const initializeDefaultUser = async () => {
  try {
    const defaultUser = await Portfolio.findOne({ email: "test@test.com" });
    if (!defaultUser) {
      console.log("\n[Init] Creating default test user");
      const newPortfolio = new Portfolio({
        email: "test@test.com",
        stocks: [],
      });
      await newPortfolio.save();
      console.log("[Init] Default user created successfully");
    } else {
      console.log("\n[Init] Default test user already exists");
    }
  } catch (error) {
    console.error("[Error] Failed to initialize default user:", error);
  }
};

// Get user portfolio with current values
app.get("/api/portfolio", async (req, res) => {
  try {
    console.log("\n[GET] /api/portfolio - Fetching portfolio");
    console.log(mongoose.connection.readyState); // 1 = connected

    let portfolio = await Portfolio.findOne({ email: "test@test.com" });

    // If portfolio doesn't exist, create it
    if (!portfolio) {
      console.log("[Info] Portfolio not found, creating default portfolio");
      portfolio = new Portfolio({
        email: "test@test.com",
        stocks: [],
      });
      await portfolio.save();
    }

    // Fetch current values and enhanced data for each stock
    if (portfolio.stocks.length > 0) {
      const enhancedStocks = await Promise.all(
        portfolio.stocks.map(async (stock) => {
          try {
            // Get current price data
            const quoteResponse = await fetch(
              `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${stock.symbol}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`
            );
            const quoteData = await quoteResponse.json();
            console.log("quoteData", quoteData);
            // Get company overview for dividend data
            const overviewResponse = await fetch(
              `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${stock.symbol}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`
            );
            const overviewData = await overviewResponse.json();
            console.log("overviewdata", overviewData);

            const currentPrice = parseFloat(
              quoteData["Global Quote"]?.["05. price"] || 0
            );
            const dividendYield = parseFloat(overviewData.DividendYield || 0);
            const annualDividend = parseFloat(
              overviewData.DividendPerShare || 0
            );

            // Calculate performance metrics
            const stockCurrentValue = currentPrice * stock.shares;
            const stockInitialValue = stock.purchasePrice * stock.shares;
            const profitLoss = stockCurrentValue - stockInitialValue;
            const profitLossPercentage = (profitLoss / stockInitialValue) * 100;

            return {
              ...stock.toObject(),
              currentPrice,
              currentValue: stockCurrentValue,
              profitLoss,
              profitLossPercentage,
              dividendYield,
              annualDividend,
              annualDividendIncome: annualDividend * stock.shares,
              lastUpdated: new Date(),
            };
          } catch (error) {
            console.error(
              `[Error] Failed to fetch data for ${stock.symbol}:`,
              error
            );
            return stock;
          }
        })
      );

      // Calculate totals
      const totalCurrentValue = enhancedStocks.reduce(
        (total, stock) => total + (stock.currentValue || 0),
        0
      );
      const totalInitialValue = enhancedStocks.reduce(
        (total, stock) => total + stock.shares * stock.purchasePrice,
        0
      );
      const totalProfitLoss = totalCurrentValue - totalInitialValue;
      const totalProfitLossPercentage =
        (totalProfitLoss / totalInitialValue) * 100;
      const totalAnnualDividend = enhancedStocks.reduce(
        (total, stock) => total + (stock.annualDividendIncome || 0),
        0
      );
      const portfolioDividendYield =
        (totalAnnualDividend / totalCurrentValue) * 100;

      // Calculate IRR (Simple approach - can be enhanced with proper time-weighted calculations)
      const days = Math.max(
        1,
        (new Date() - new Date(enhancedStocks[0].purchaseDate)) /
          (1000 * 60 * 60 * 24)
      );
      const years = days / 365;
      const irr =
        ((totalCurrentValue / totalInitialValue) ** (1 / years) - 1) * 100;

      // Create enhanced portfolio response
      const enhancedPortfolio = {
        ...portfolio.toObject(),
        stocks: enhancedStocks,
        summary: {
          totalCurrentValue,
          totalInitialValue,
          totalProfitLoss,
          totalProfitLossPercentage,
          totalAnnualDividend,
          portfolioDividendYield,
          irr,
        },
      };

      console.log("[Response] Enhanced portfolio data:", {
        email: enhancedPortfolio.email,
        stockCount: enhancedPortfolio.stocks.length,
        totalValue: totalCurrentValue,
        totalProfit: totalProfitLoss,
        irr: irr,
        dividendYield: portfolioDividendYield,
      });

      res.json(enhancedPortfolio);
    } else {
      res.json({
        ...portfolio.toObject(),
        summary: {
          totalCurrentValue: 0,
          totalInitialValue: 0,
          totalProfitLoss: 0,
          totalProfitLossPercentage: 0,
          totalAnnualDividend: 0,
          portfolioDividendYield: 0,
          irr: 0,
        },
      });
    }
  } catch (error) {
    console.error("[Error] Failed to fetch portfolio:", error);
    res.status(500).json({ error: error.message });
  }
});

// Add stock to portfolio
app.get("/api/stocks/search", async (req, res) => {
  try {
    const { query } = req.query;
    console.log("\n[GET] /api/stocks/search");
    console.log("[Request] Search query:", query);

    // Get symbol matches
    const searchResponse = await fetch(
      `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${query}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`
    );
    const searchData = await searchResponse.json();

    // Process results and fetch sector data for each match
    const results = [];

    if (searchData.bestMatches && searchData.bestMatches.length > 0) {
      for (const match of searchData.bestMatches) {
        const symbol = match["1. symbol"];

        try {
          // Get company overview for sector and dividend information
          const overviewResponse = await fetch(
            `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`
          );
          const overviewData = await overviewResponse.json();

          // Get current price data
          const quoteResponse = await fetch(
            `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`
          );
          const quoteData = await quoteResponse.json();

          results.push({
            symbol: symbol,
            name: match["2. name"],
            sector: overviewData.Sector || "Unknown",
            currentPrice: parseFloat(
              quoteData["Global Quote"]?.["05. price"] || 0
            ),
            dividendYield: parseFloat(overviewData.DividendYield || 0),
            dividendPerShare: parseFloat(overviewData.DividendPerShare || 0),
          });
        } catch (error) {
          console.error(`[Error] Failed to get data for ${symbol}:`, error);
          results.push({
            symbol: symbol,
            name: match["2. name"],
            sector: "Unknown",
            currentPrice: 0,
            dividendYield: 0,
            dividendPerShare: 0,
          });
        }
      }
    }

    console.log("[Response] Enhanced search results:", {
      resultCount: results.length,
      results: results,
    });

    res.json({ results });
  } catch (error) {
    console.error("[Error] Failed to search stocks:", error);
    res.status(500).json({ error: error.message });
  }
});

// Add stock to portfolio
app.post("/api/portfolio/stock", async (req, res) => {
  try {
    const { symbol, shares, purchaseDate, purchasePrice, sector } = req.body;

    // Use findOneAndUpdate with upsert
    let portfolio = await Portfolio.findOneAndUpdate(
      { email: "test@test.com" },
      { $setOnInsert: { email: "test@test.com" } },
      { upsert: true, new: true }
    );

    // Add the stock to the portfolio
    portfolio.stocks.push({
      symbol,
      shares,
      purchaseDate,
      purchasePrice,
      sector,
    });

    const updatedPortfolio = await portfolio.save();
    res.json(updatedPortfolio);
  } catch (error) {
    console.error("[Error] Failed to add stock:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(5000, () => {
  console.log("\n🚀 Server running on port 5000");
  console.log("📊 Portfolio Tracker API endpoints:");
  console.log("   GET  /api/portfolio");
  console.log("   POST /api/portfolio/stock");
  console.log("   GET  /api/stocks/search\n");
});
