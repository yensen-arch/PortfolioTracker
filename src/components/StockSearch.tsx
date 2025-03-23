import React, { useState } from "react";
import { Search, PlusCircle } from "lucide-react";

const StockSearch = ({ onPortfolioUpdate }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);

  // Stock form state
  const [selectedStock, setSelectedStock] = useState(null);
  const [shares, setShares] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [purchasePrice, setPurchasePrice] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      setError(null);
      const response = await fetch(
        `https://portfoliotracker-p09f.onrender.com/api/stocks/search?query=${searchQuery}`
      );
      if (!response.ok) {
        throw new Error("Failed to search stocks");
      }
      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error("Error searching stocks:", error);
      setError(error.message);
    } finally {
      setIsSearching(false);
    }
  };

  const selectStock = (stock) => {
    setSelectedStock(stock);
    setPurchasePrice(stock.currentPrice.toString());
  };

  const cancelSelection = () => {
    setSelectedStock(null);
    setShares("");
    setPurchaseDate(new Date().toISOString().split("T")[0]);
    setPurchasePrice("");
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    if (!selectedStock || !shares || !purchaseDate || !purchasePrice) return;

    try {
      setIsAdding(true);
      setError(null);

      const response = await fetch(
        "https://portfoliotracker-p09f.onrender.com/api/portfolio/stock",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            symbol: selectedStock.symbol,
            shares: parseInt(shares),
            purchaseDate,
            purchasePrice: parseFloat(purchasePrice),
            sector: selectedStock.sector,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add stock");
      }

      // Reset form and refresh portfolio
      setSelectedStock(null);
      setShares("");
      setPurchaseDate(new Date().toISOString().split("T")[0]);
      setPurchasePrice("");
      setSearchQuery("");
      setSearchResults([]);

      if (onPortfolioUpdate) {
        onPortfolioUpdate();
      }
    } catch (error) {
      console.error("Error adding stock:", error);
      setError(error.message);
    } finally {
      setIsAdding(false);
    }
  };

  // Format currency
  const formatCurrency = (value) => {
    return value.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div>
      {selectedStock ? (
        <div className="bg-white rounded-lg p-4">
          <h3 className="font-medium mb-4 flex justify-between">
            <span>
              Add {selectedStock.symbol} - {selectedStock.name}
            </span>
            <button
              onClick={cancelSelection}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </h3>

          <form onSubmit={handleAddStock}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label
                  htmlFor="shares"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Shares
                </label>
                <input
                  id="shares"
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={shares}
                  onChange={(e) => setShares(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Number of shares"
                />
              </div>

              <div>
                <label
                  htmlFor="purchaseDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Purchase Date
                </label>
                <input
                  id="purchaseDate"
                  type="date"
                  required
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="purchasePrice"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Purchase Price
                </label>
                <input
                  id="purchasePrice"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Price per share"
                />
              </div>

              <div>
                <div className="block text-sm font-medium text-gray-700 mb-1">
                  Current Info
                </div>
                <div className="text-sm">
                  <div>
                    Current Price: {formatCurrency(selectedStock.currentPrice)}
                  </div>
                  {selectedStock.dividendYield > 0 && (
                    <div className="mt-1">
                      Dividend Yield: {selectedStock.dividendYield.toFixed(2)}%
                      {selectedStock.dividendPerShare > 0 && (
                        <span className="text-xs text-gray-500 ml-1">
                          ({formatCurrency(selectedStock.dividendPerShare)}
                          /share)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <button
                type="submit"
                disabled={isAdding}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isAdding ? "Adding..." : "Add to Portfolio"}
              </button>
            </div>

            {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
          </form>
        </div>
      ) : (
        <div>
          <form onSubmit={handleSearch} className="mb-4">
            <div className="flex">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search stocks by symbol or name"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-md text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 overflow-hidden group transition-all duration-300"
              >
                <span className="relative z-10">
                  {isSearching ? "Searching..." : "Search"}
                </span>
                <span className="absolute inset-0 border-2 border-white/30 rounded-md opacity-50 transition-all duration-300 group-hover:opacity-100"></span>
                <span className="absolute inset-0 border-2 border-white/50 rounded-md animate-pulse"></span>
                <span className="absolute -inset-1 scale-105 bg-gradient-to-r from-cyan-500/30 via-blue-500/30 to-purple-500 rounded-md blur-md opacity-50 group-hover:opacity-75 animate-spin-slow animate-bg-move bg-[length:200%_100%] transition-all duration-400"></span>
              </button>
            </div>
          </form>

          {error && (
            <div className="mb-4 text-sm text-red-600 p-2 bg-red-50 rounded">
              {error}
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="mt-2">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Results
              </h3>
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                {searchResults.map((stock, index) => (
                  <div
                    key={index}
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-200 last:border-b-0"
                    onClick={() => selectStock(stock)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{stock.symbol}</div>
                        <div className="text-sm text-gray-500">
                          {stock.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {stock.sector}
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="font-medium">
                          {formatCurrency(stock.currentPrice)}
                        </div>
                        {stock.dividendYield > 0 && (
                          <div className="text-xs text-green-600">
                            Yield: {stock.dividendYield.toFixed(2)}%
                          </div>
                        )}
                        <button
                          className="mt-1 text-blue-600 hover:text-blue-800 text-xs flex items-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            selectStock(stock);
                          }}
                        >
                          <PlusCircle className="h-3 w-3 mr-1" /> Add
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* {searchResults.length === 0 && searchQuery && !isSearching && (
            <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded-md">
              No stocks found matching "{searchQuery}". Try a different search
              term.
            </div>
          )} */}
        </div>
      )}
    </div>
  );
};

export default StockSearch;
