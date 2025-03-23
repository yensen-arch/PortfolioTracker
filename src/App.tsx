import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  DollarSign,
  PieChart,
  BarChart2,
  Percent,
} from "lucide-react";
import StockSearch from "./components/StockSearch";
import PortfolioChart from "./components/PortfolioChart";
import PerformanceMetrics from "./components/PerformanceMetrics";
import PortfolioTable from "./components/PortfolioTable";

function App() {
  const [portfolio, setPortfolio] = useState({ stocks: [], summary: {} });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(
        "https://portfoliotracker-p09f.onrender.com/api/portfolio"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch portfolio data");
      }
      const data = await response.json();
      setPortfolio(data || { stocks: [], summary: {} });
    } catch (error) {
      console.error("Error fetching portfolio:", error);
      setError(error.message);
      setPortfolio({ stocks: [], summary: {} });
    } finally {
      setIsLoading(false);
    }
  };

  // Get values from portfolio summary
  const {
    totalCurrentValue = 0,
    totalInitialValue = 0,
    totalProfitLoss = 0,
    totalProfitLossPercentage = 0,
    totalAnnualDividend = 0,
    portfolioDividendYield = 0,
    irr = 0,
  } = portfolio.summary || {};

  // Format percentage with sign
  const formatPercentage = (value, includeSign = true) => {
    const formattedValue = Math.abs(value).toFixed(2);
    if (!includeSign) return formattedValue;
    return value >= 0 ? `+${formattedValue}` : `-${formattedValue}`;
  };

  // Format currency
  const formatCurrency = (value, includeSign = true) => {
    const absValue = Math.abs(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    if (!includeSign) return absValue;
    return value >= 0 ? `+$${absValue}` : `-$${absValue}`;
  };

  // Get daily change (placeholder calculation - would ideally come from API)
  const dailyChange = portfolio.stocks.reduce((total, stock) => {
    return (
      total +
      (stock.currentPrice ? stock.currentPrice * 0.001 * stock.shares : 0)
    );
  }, 0);

  const dailyChangePercentage =
    totalCurrentValue > 0 ? (dailyChange / totalCurrentValue) * 100 : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading portfolio data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={fetchPortfolio}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-semibold">
                Measurement is Progress!
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center mb-2">
              <DollarSign className="h-5 w-5 text-blue-500 mr-2" />
              <span className="text-sm text-gray-600">Current Value</span>
            </div>
            <div className="text-2xl font-bold">
              $
              {totalCurrentValue.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              $
              {totalInitialValue.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}{" "}
              invested
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center mb-2">
              <BarChart2 className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm text-gray-600">Total profit</span>
            </div>
            <div className="flex items-center">
              <div
                className={`text-2xl font-bold ${
                  totalProfitLoss >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {formatCurrency(totalProfitLoss)}
              </div>
              <span
                className={`text-sm ml-2 ${
                  totalProfitLossPercentage >= 0
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {totalProfitLossPercentage >= 0 ? "↑" : "↓"}{" "}
                {Math.abs(totalProfitLossPercentage).toFixed(2)}%
              </span>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {formatCurrency(dailyChange)}{" "}
              <span
                className={
                  dailyChangePercentage >= 0 ? "text-green-500" : "text-red-500"
                }
              >
                {dailyChangePercentage >= 0 ? "↑" : "↓"}{" "}
                {Math.abs(dailyChangePercentage).toFixed(2)}%
              </span>{" "}
              daily
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center mb-2">
              <Percent className="h-5 w-5 text-purple-500 mr-2" />
              <span className="text-sm text-gray-600">IRR</span>
            </div>
            <div
              className={`text-2xl font-bold ${
                irr >= 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              {formatPercentage(irr, false)}%
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {formatPercentage(totalProfitLossPercentage, false)}% current
              holdings
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center mb-2">
              <DollarSign className="h-5 w-5 text-cyan-500 mr-2" />
              <span className="text-sm text-gray-600">Passive income</span>
            </div>
            {/* <div className="flex items-center"> */}
            {/* <div className="text-2xl font-bold">{portfolioDividendYield.toFixed(2)}%</div> */}
            {/* <span className="text-sm text-green-500 ml-2">yield</span> */}
            {/* </div> */}
            <div className="text-sm text-gray-500 mt-1">
              $
              {totalAnnualDividend.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}{" "}
              annually
            </div>
          </div>
        </div>

        {/* Clone Portfolio Banner */}
        <div className="relative overflow-hidden rounded-xl p-6 mb-8 bg-white/10 backdrop-blur-lg border border-white/30 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 opacity-80 transition-all duration-500 hover:opacity-100"></div>

          <div className="relative flex flex-col md:flex-row items-center md:items-start justify-between gap-4">
            <div className="text-center md:text-left">
              <h2 className="text-lg md:text-xl font-semibold text-slate-600 drop-shadow-lg">
                Would you like to have the same portfolio? 🚀
              </h2>
              <p className="text-sm md:text-base text-slate-600 drop-shadow">
                Sign up, clone target allocations of this portfolio and start
                following the strategy
              </p>
            </div>
            <button className="relative px-6 py-2 text-sm md:text-base bg-white/20 text-white font-semibold rounded-lg shadow-md hover:bg-white/30 transition-all duration-300 overflow-hidden group">
              <span className="relative z-10 text-center font-semibold text-white">
                Start
              </span>
              <span className="absolute inset-0 border-2 border-white/50 rounded-lg"></span>
              <span className="absolute inset-0 border-2 border-white/50 rounded-lg animate-pulse"></span>
              <span className="absolute -inset-1 scale-105 bg-gradient-to-r from-cyan-500/30 via-blue-500/30 to-purple-500 rounded-lg blur-md opacity-50 group-hover:opacity-75 animate-spin-slow animate-bg-move bg-[length:200%_100%] transition-all duration-400"></span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Add to Portfolio</h2>
              <StockSearch onPortfolioUpdate={fetchPortfolio} />
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 mt-8">
              <PortfolioTable
                stocks={portfolio.stocks}
                onRefresh={fetchPortfolio}
              />
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Sector Allocation</h2>
              <PortfolioChart stocks={portfolio.stocks} />
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">
                Performance Metrics
              </h2>
              <PerformanceMetrics
                stocks={portfolio.stocks}
                summary={portfolio.summary}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
