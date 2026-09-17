const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
  {
    shopName: {
      type: String,
      default: 'Manikanta Supermarket',
      trim: true,
    },
    tagline: {
      type: String,
      default: 'Your One-Stop Supermarket for Fresh Groceries & Daily Essentials',
    },
    ownerName: {
      type: String,
      default: 'Manikanta Store Management',
    },
    phone: {
      type: String,
      default: '+91 95730 45430',
    },
    email: {
      type: String,
      default: 'contact@manikantasupermarket.com',
    },
    address: {
      type: String,
      default: 'Domalakunta, near govt school, Telangana',
    },
    logo: {
      type: String,
      default: '/logo.png',
    },
    openingTime: {
      type: String,
      default: '07:00 AM',
    },
    closingTime: {
      type: String,
      default: '10:00 PM',
    },
    pickupInstructions: {
      type: String,
      default: 'Show your Order ID at the pickup counter. Pay by Cash or UPI on collection.',
    },
    minOrderAmount: {
      type: Number,
      default: 50,
    },
    currencySymbol: {
      type: String,
      default: '₹',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Setting', settingSchema);
