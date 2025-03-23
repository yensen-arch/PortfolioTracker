import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

const PortfolioTable = ({ stocks, onRefresh }) => {
  if (!stocks || stocks.length === 0) {
    return (
      <div className="text-center py-8">
        <h2 className="text-lg font-medium text-gray-600">No stocks in portfolio</h2>
        <p className="text-gray-500 mt-2">Search and add stocks to begin tracking your portfolio</p>
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

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Portfolio Holdings</h2>
        <button 
          onClick={onRefresh}
          className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-sm hover:bg-blue-100"
        >
          Refresh
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Shares
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Purchase Price
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Price
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Value
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Profit/Loss
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Div. Yield
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stocks.map((stock, index) => {
              const initialValue = stock.shares * stock.purchasePrice;
              const currentValue = stock.currentValue || (stock.currentPrice ? stock.currentPrice * stock.shares : initialValue);
              const profitLoss = stock.profitLoss || (currentValue - initialValue);
              const profitLossPercentage = stock.profitLossPercentage || ((profitLoss / initialValue) * 100);
              const isProfit = profitLossPercentage >= 0;
              
              return (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{stock.symbol}</div>
                        <div className="text-sm text-gray-500">{stock.sector}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{stock.shares}</div>
                    <div className="text-xs text-gray-500">{formatDate(stock.purchaseDate)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatCurrency(stock.purchasePrice)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatCurrency(stock.currentPrice || stock.purchasePrice)}</div>
                    {stock.currentPrice && stock.currentPrice !== stock.purchasePrice && (
                      <div className={`text-xs flex items-center ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                        {isProfit ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                        <span className="ml-1">{Math.abs(((stock.currentPrice - stock.purchasePrice) / stock.purchasePrice) * 100).toFixed(2)}%</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatCurrency(currentValue)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                      {formatCurrency(profitLoss)}
                    </div>
                    <div className={`text-xs ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                      {formatPercentage(profitLossPercentage)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{(stock.dividendYield || 0).toFixed(2)}%</div>
                    <div className="text-xs text-gray-500">
                      {formatCurrency(stock.annualDividendIncome || (stock.annualDividend * stock.shares) || 0)}/yr
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