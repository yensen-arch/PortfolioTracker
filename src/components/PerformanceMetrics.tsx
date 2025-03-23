import React from 'react';
import { DollarSign, TrendingUp, Calendar, BarChart2 } from 'lucide-react';

const PerformanceMetrics = ({ stocks, summary }) => {
  if (!stocks || stocks.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-500">No stocks to analyze</p>
      </div>
    );
  }
  
  // Format currency
  const formatCurrency = (value) => {
    return value.toLocaleString('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Sort stocks to find best and worst performers
  const sortedByPerformance = [...stocks].sort((a, b) => {
    const aPerformance = a.profitLossPercentage || ((a.currentValue || (a.currentPrice * a.shares)) - (a.purchasePrice * a.shares)) / (a.purchasePrice * a.shares) * 100;
    const bPerformance = b.profitLossPercentage || ((b.currentValue || (b.currentPrice * b.shares)) - (b.purchasePrice * b.shares)) / (b.purchasePrice * b.shares) * 100;
    return bPerformance - aPerformance;
  });

  // Sort by dividend yield
  const sortedByDividend = [...stocks].sort((a, b) => {
    return (b.dividendYield || 0) - (a.dividendYield || 0);
  });

  const bestPerformer = sortedByPerformance[0];
  const worstPerformer = sortedByPerformance[sortedByPerformance.length - 1];
  const highestDividend = sortedByDividend[0];

  // Get metrics from summary or calculate if not available
  const {
    totalCurrentValue = 0,
    totalInitialValue = 0,
    totalProfitLoss = 0,
    totalProfitLossPercentage = 0,
    totalAnnualDividend = 0,
    portfolioDividendYield = 0,
    irr = 0
  } = summary || {};

  // Format percentages with sign
  const formatPercentage = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Portfolio age calculation (from oldest purchase)
  const getPortfolioAge = () => {
    if (!stocks.length) return "N/A";
    
    const oldestDate = new Date(Math.min(...stocks.map(stock => new Date(stock.purchaseDate))));
    const today = new Date();
    const diffTime = Math.abs(today - oldestDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
    
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    return months > 0 ? `${years}y ${months}m` : `${years} years`;
  };

  console.log("stocks", stocks, "summary", summary);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center text-sm text-gray-600 mb-1">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span>IRR</span>
          </div>
          <div className={`text-lg font-semibold ${irr >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatPercentage(irr)}
          </div>
          <div className="text-xs text-gray-500">Annualized return</div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center text-sm text-gray-600 mb-1">
            <Calendar className="h-4 w-4 mr-1" />
            <span>Portfolio Age</span>
          </div>
          <div className="text-lg font-semibold">{getPortfolioAge()}</div>
          <div className="text-xs text-gray-500">Since first purchase</div>
        </div>
      </div>
      
      <hr className="my-4 border-gray-200" />
      
      <h3 className="font-medium text-sm text-gray-600 mb-2">TOP PERFORMERS</h3>
      
      {bestPerformer && (
        <div className="bg-green-50 rounded-lg p-3 mb-3">
          <div className="flex justify-between mb-1">
            <span className="font-medium">{bestPerformer.symbol}</span>
            <span className="text-green-600 font-medium">
              {formatPercentage(bestPerformer.profitLossPercentage || 0)}
            </span>
          </div>
          <div className="text-xs text-gray-600 flex justify-between">
            <span>Initial: {formatCurrency(bestPerformer.purchasePrice * bestPerformer.shares)}</span>
            <span>Current: {formatCurrency(bestPerformer.currentValue || (bestPerformer.currentPrice * bestPerformer.shares))}</span>
          </div>
        </div>
      )}
      
      <h3 className="font-medium text-sm text-gray-600 mb-2">UNDERPERFORMERS</h3>
      
      {worstPerformer && (
        <div className="bg-red-50 rounded-lg p-3 mb-3">
          <div className="flex justify-between mb-1">
            <span className="font-medium">{worstPerformer.symbol}</span>
            <span className={`${worstPerformer.profitLossPercentage >= 0 ? 'text-green-600' : 'text-red-600'} font-medium`}>
              {formatPercentage(worstPerformer.profitLossPercentage || 0)}
            </span>
          </div>
          <div className="text-xs text-gray-600 flex justify-between">
            <span>Initial: {formatCurrency(worstPerformer.purchasePrice * worstPerformer.shares)}</span>
            <span>Current: {formatCurrency(worstPerformer.currentValue || (worstPerformer.currentPrice * worstPerformer.shares))}</span>
          </div>
        </div>
      )}
      
      <hr className="my-4 border-gray-200" />
      
      <h3 className="font-medium text-sm text-gray-600 mb-2">DIVIDEND INCOME</h3>
      
      <div className="bg-blue-50 rounded-lg p-3">
        {/* <div className="flex justify-between mb-1"> */}
          {/* <span className="font-medium">Portfolio Yield</span> */}
          {/* <span className="text-blue-600 font-medium">{portfolioDividendYield.toFixed(2)}%</span> */}
        {/* </div> */}
        <div className="text-xs text-gray-600 mb-2">
          Annual Income: {formatCurrency(totalAnnualDividend)}
          <span className="text-xs text-gray-500 ml-1">
            ({formatCurrency(totalAnnualDividend / 12)}/month)
          </span>
        </div>
        
        {highestDividend && highestDividend.dividendYield > 0 && (
          <div className="mt-2 pt-2 border-t border-blue-100">
            <div className="text-xs text-gray-600">
              <span className="font-medium">Highest Yield:</span> {highestDividend.symbol} ({highestDividend.dividendYield.toFixed(2)}%)
            </div>
            <div className="text-xs text-gray-500">
              {formatCurrency((highestDividend.annualDividendIncome || (highestDividend.annualDividend * highestDividend.shares) || 0))} annually
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceMetrics;