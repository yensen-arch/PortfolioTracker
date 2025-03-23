import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const PortfolioChart = ({ stocks }) => {
  if (!stocks || stocks.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-500">No stocks to display</p>
      </div>
    );
  }

  // Group by sector
  const sectorGroups = stocks.reduce((groups, stock) => {
    const sector = stock.sector || 'Unknown';
    const currentValue = stock.currentValue || (stock.currentPrice ? stock.currentPrice * stock.shares : stock.purchasePrice * stock.shares);
    
    if (!groups[sector]) {
      groups[sector] = {
        name: sector,
        value: 0,
        stocks: []
      };
    }
    
    groups[sector].value += currentValue;
    groups[sector].stocks.push({
      symbol: stock.symbol,
      value: currentValue
    });
    
    return groups;
  }, {});

  // Convert to array and sort by value
  const sectorData = Object.values(sectorGroups).sort((a, b) => b.value - a.value);
  
  // Calculate total portfolio value
  const totalValue = sectorData.reduce((sum, item) => sum + item.value, 0);
  
  // Format percentage
  const formatPercentage = (value) => {
    return `${(value * 100).toFixed(1)}%`;
  };
  
  // Format currency
  const formatCurrency = (value) => {
    return value.toLocaleString('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  // Colors for the sectors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 shadow-md rounded-md border border-gray-200">
          <p className="font-medium">{data.name}</p>
          <p className="text-gray-700">{formatCurrency(data.value)}</p>
          <p className="text-gray-500 text-sm">{formatPercentage(data.value / totalValue)}</p>
          {data.stocks && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              {data.stocks.map((stock, index) => (
                <div key={index} className="text-xs flex justify-between">
                  <span>{stock.symbol}</span>
                  <span>{formatCurrency(stock.value)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    return null;
  };
  
  return (
    <div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={sectorData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {sectorData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Allocation</h3>
        <div className="space-y-2">
          {sectorData.map((sector, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 mr-2 rounded-sm" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></div>
                <span className="text-sm">{sector.name}</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm font-medium mr-2">{formatCurrency(sector.value)}</span>
                <span className="text-xs text-gray-500">{formatPercentage(sector.value / totalValue)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PortfolioChart;