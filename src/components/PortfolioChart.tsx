import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Sector } from 'recharts';

const PortfolioChart = ({ stocks }) => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationComplete(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  if (!stocks || stocks.length === 0) {
    return (
      <div className="flex justify-center items-center py-12 rounded-lg bg-gray-50">
        <div className="text-center">
          <p className="mt-2 text-gray-500 font-medium">Portfolio</p>
          <p className="text-sm text-gray-400">No stocks to display</p>
        </div>
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

  // Vibrant colors similar to the image
  const COLORS = [
    '#8B5CF6', // Purple
    '#EC4899', // Pink 
    '#60A5FA', // Blue
    '#2DD4BF', // Teal
    '#34D399', // Emerald
    '#A78BFA', // Violet
    '#F472B6', // Pink
    '#38BDF8', // Light Blue
    '#4ADE80', // Green
    '#FB923C'  // Orange
  ];

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  // Animated active shape
  const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 4}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          opacity={0.9}
        />
      </g>
    );
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: payload[0].color }}
            ></div>
            <p className="font-medium text-gray-800">{data.name}</p>
          </div>
          <p className="text-lg font-bold">{formatCurrency(data.value)}</p>
          <p className="text-gray-500 text-sm">{formatPercentage(data.value / totalValue)}</p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 w-full max-w-md mx-auto">
      <h2 className="text-base font-medium text-gray-700 mb-4 pl-2">Portfolio</h2>
      
      <div className="h-64 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              data={sectorData}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={120}
              paddingAngle={1}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
              isAnimationActive={true}
              animationBegin={0}
              animationDuration={1200}
              animationEasing="ease-out"
              label={false}
            >
              {sectorData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                  stroke="white"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip 
              content={<CustomTooltip />} 
              wrapperStyle={{ outline: 'none' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-3 px-2">
        <div className="grid grid-cols-2 gap-3">
          {sectorData.map((sector, index) => (
            <div 
              key={index} 
              className="flex items-center justify-between p-2 rounded-lg transition-colors cursor-pointer"
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 mr-2 rounded-full" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></div>
                <p className="text-sm font-medium text-gray-700 truncate max-w-24">{sector.name}</p>
              </div>
              <p className="text-sm font-medium">{formatPercentage(sector.value / totalValue)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PortfolioChart;