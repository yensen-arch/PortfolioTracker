import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { Portfolio } from "./models/Portfolio.js";

dotenv.config();

// Polygon.io API Key
const POLYGON_API_KEY = "OJcTHycytiBAAPJqResIfz5FTVM92r7f";
const POLYGON_BASE_URL = "https://api.polygon.io";

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

// Get current stock price from Polygon.io
const getCurrentPrice = async (symbol) => {
  try {
    const response = await fetch(
      `${POLYGON_BASE_URL}/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${POLYGON_API_KEY}`
    );
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      return data.results[0].c; // Closing price
    }
    return 0;
  } catch (error) {
    console.error(`Failed to get price for ${symbol}:`, error);
    return 0;
  }
};

// Get company details including dividend information from Polygon.io
const getCompanyDetails = async (symbol) => {
  try {
    // Get ticker details
    const tickerDetailsResponse = await fetch(
      `${POLYGON_BASE_URL}/v3/reference/tickers/${symbol}?apiKey=${POLYGON_API_KEY}`
    );
    const tickerData = await tickerDetailsResponse.json();
    
    // Get dividend information
    const dividendsResponse = await fetch(
      `${POLYGON_BASE_URL}/v3/reference/dividends?ticker=${symbol}&limit=1&apiKey=${POLYGON_API_KEY}`
    );
    const dividendData = await dividendsResponse.json();
    
    const sector = tickerData.results?.sic_description || "Unknown";
    let dividendYield = 0;
    let dividendPerShare = 0;
    
    // Calculate dividend yield if available
    if (dividendData.results && dividendData.results.length > 0 && dividendData.results[0].cash_amount) {
      const currentPrice = await getCurrentPrice(symbol);
      dividendPerShare = dividendData.results[0].cash_amount;
      // Assuming quarterly dividend payments (multiply by 4 for annual)
      const annualDividend = dividendPerShare * 4;
      dividendYield = currentPrice > 0 ? (annualDividend / currentPrice) * 100 : 0;
    }
    
    return {
      sector,
      dividendYield,
      dividendPerShare
    };
  } catch (error) {
    console.error(`Failed to get company details for ${symbol}:`, error);
    return {
      sector: "Unknown",
      dividendYield: 0,
      dividendPerShare: 0
    };
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
            // Get current price using Polygon.io
            const currentPrice = await getCurrentPrice(stock.symbol);
            
            // Get company details using Polygon.io
            const companyDetails = await getCompanyDetails(stock.symbol);
            const { sector, dividendYield, dividendPerShare } = companyDetails;
            
            // Calculate performance metrics
            const stockCurrentValue = currentPrice * stock.shares;
            const stockInitialValue = stock.purchasePrice * stock.shares;
            const profitLoss = stockCurrentValue - stockInitialValue;
            const profitLossPercentage = stockInitialValue > 0 ? (profitLoss / stockInitialValue) * 100 : 0;
            const annualDividend = dividendPerShare * 4; // Assuming quarterly dividends

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
              sector: sector || stock.sector,
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
      const totalProfitLossPercentage = totalInitialValue > 0 ?
        (totalProfitLoss / totalInitialValue) * 100 : 0;
      const totalAnnualDividend = enhancedStocks.reduce(
        (total, stock) => total + (stock.annualDividendIncome || 0),
        0
      );
      const portfolioDividendYield = totalCurrentValue > 0 ?
        (totalAnnualDividend / totalCurrentValue) * 100 : 0;

      // Calculate IRR (Simple approach - can be enhanced with proper time-weighted calculations)
      const days = Math.max(
        1,
        (new Date() - new Date(enhancedStocks[0].purchaseDate)) /
          (1000 * 60 * 60 * 24)
      );
      const years = days / 365;
      const irr = totalInitialValue > 0 ?
        ((totalCurrentValue / totalInitialValue) ** (1 / years) - 1) * 100 : 0;

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

// Search for stocks using Polygon.io
app.get("/api/stocks/search", async (req, res) => {
  try {
    const { query } = req.query;
    console.log("\n[GET] /api/stocks/search");
    console.log("[Request] Search query:", query);

    // Search tickers with Polygon.io
    const searchResponse = await fetch(
      `${POLYGON_BASE_URL}/v3/reference/tickers?search=${query}&active=true&limit=10&apiKey=${POLYGON_API_KEY}`
    );
    const searchData = await searchResponse.json();

    // Process results and fetch additional data for each match
    const results = [];

    if (searchData.results && searchData.results.length > 0) {
      for (const match of searchData.results) {
        const symbol = match.ticker;

        try {
          // Get current price
          const currentPrice = await getCurrentPrice(symbol);
          
          // Get company details
          const { sector, dividendYield, dividendPerShare } = await getCompanyDetails(symbol);

          results.push({
            symbol,
            name: match.name,
            sector,
            currentPrice,
            dividendYield,
            dividendPerShare,
          });
        } catch (error) {
          console.error(`[Error] Failed to get data for ${symbol}:`, error);
          results.push({
            symbol,
            name: match.name,
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
  console.log("Data provider: Polygon.io");
});