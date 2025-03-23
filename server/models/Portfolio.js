import mongoose from 'mongoose';

const stockSchema = new mongoose.Schema({
  symbol: String,
  shares: Number,
  purchaseDate: Date,
  purchasePrice: Number,
  sector: String
});

const portfolioSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  stocks: [stockSchema]
});

export const Portfolio = mongoose.model('Portfolio', portfolioSchema);