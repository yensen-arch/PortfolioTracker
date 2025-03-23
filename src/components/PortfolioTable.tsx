import React, { useState } from 'react';
import { ArrowUp, ArrowDown, RefreshCw, MoreHorizontal, ChevronRight, Briefcase, DollarSign, Calendar, Award } from 'lucide-react';

const PortfolioTable = ({ stocks, onRefresh }) => {
  const [hoveredRow, setHoveredRow] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    onRefresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  if (!stocks || stocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-gradient-to-b from-gray-50 to-white rounded-2xl border border-gray-100">
        <Briefcase className="text-gray-300 mb-4" size={48} />
        <h2 className="text-xl font-medium text-gray-700">No stocks in portfolio</h2>
        <p className="text-gray-500 mt-2 max-w-md text-center">Add stocks to begin tracking your investments and visualize your portfolio growth</p>
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

  // Format percentage
  const formatPercentage = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Calculate portfolio stats
  const totalValue = stocks.reduce((sum, stock) => {
    const currentValue = stock.currentValue || (stock.currentPrice ? stock.currentPrice * stock.shares : stock.purchasePrice * stock.shares);
    return sum + currentValue;
  }, 0);

  const totalProfit = stocks.reduce((sum, stock) => {
    const initialValue = stock.shares * stock.purchasePrice;
    const currentValue = stock.currentValue || (stock.currentPrice ? stock.currentPrice * stock.shares : initialValue);
    return sum + (currentValue - initialValue);
  }, 0);

  const totalProfitPercentage = (totalProfit / (totalValue - totalProfit)) * 100;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Portfolio Holdings</h2>
            <div className="flex items-center mt-1 space-x-4">
              <div className="flex items-center text-gray-500 text-sm">
                <DollarSign size={14} className="mr-1" />
                <span>Total: {formatCurrency(totalValue)}</span>
              </div>
              <div className={`flex items-center text-sm ${totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {totalProfit >= 0 ? <ArrowUp size={14} className="mr-1" /> : <ArrowDown size={14} className="mr-1" />}
                <span>{formatCurrency(Math.abs(totalProfit))} ({formatPercentage(totalProfitPercentage)})</span>
              </div>
            </div>
          </div>
          <button 
            onClick={handleRefresh}
            className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors duration-200 relative overflow-hidden"
            disabled={isRefreshing}
          >
            <RefreshCw size={18} className={`${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh</span>
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left bg-gray-50">
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Shares</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Current</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Profit/Loss</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Dividend</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock, index) => {
              const initialValue = stock.shares * stock.purchasePrice;
              const currentValue = stock.currentValue || (stock.currentPrice ? stock.currentPrice * stock.shares : initialValue);
              const profitLoss = stock.profitLoss || (currentValue - initialValue);
              const profitLossPercentage = stock.profitLossPercentage || ((profitLoss / initialValue) * 100);
              const isProfit = profitLossPercentage >= 0;
              
              return (
                <tr 
                  key={index}
                  className={`
                    transition-colors duration-150 
                    ${hoveredRow === index ? 'bg-blue-50' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} 
                    hover:bg-blue-50 cursor-pointer
                  `}
                  onMouseEnter={() => setHoveredRow(index)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mr-3 text-indigo-600 font-bold">
                        {stock.symbol.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{stock.symbol}</div>
                        <div className="text-xs text-gray-500">{stock.sector}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{stock.shares}</div>
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar size={10} className="mr-1" />
                      {formatDate(stock.purchaseDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{formatCurrency(stock.purchasePrice)}</div>
                    <div className="text-xs text-gray-500">per share</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{formatCurrency(stock.currentPrice || stock.purchasePrice)}</div>
                    {stock.currentPrice && stock.currentPrice !== stock.purchasePrice && (
                      <div className={`text-xs flex items-center ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                        {isProfit ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                        <span className="ml-1">{Math.abs(((stock.currentPrice - stock.purchasePrice) / stock.purchasePrice) * 100).toFixed(2)}%</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{formatCurrency(currentValue)}</div>
                    <div className="text-xs text-gray-500">{((currentValue / totalValue) * 100).toFixed(1)}% of portfolio</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`flex items-center font-medium ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                      {isProfit ? <ArrowUp size={14} className="mr-1" /> : <ArrowDown size={14} className="mr-1" />}
                      {formatCurrency(Math.abs(profitLoss))}
                    </div>
                    <div className={`text-xs ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                      {formatPercentage(profitLossPercentage)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center font-medium text-gray-900">
                      {(stock.dividendYield || 0) > 0 && <Award size={14} className="mr-1 text-amber-500" />}
                      {(stock.dividendYield || 0).toFixed(2)}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatCurrency(stock.annualDividendIncome || (stock.annualDividend * stock.shares) || 0)}/yr
                    </div>
                  </td>
                  <td className="pr-4 py-4 text-right">
                    <div className={`transition-opacity duration-200 ${hoveredRow === index ? 'opacity-100' : 'opacity-0'}`}>
                      <ChevronRight size={16} className="text-gray-400" />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PortfolioTable;