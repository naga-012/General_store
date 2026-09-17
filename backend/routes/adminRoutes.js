const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getCustomers,
  getSettings,
  updateSettings,
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');

router.get('/dashboard-stats', protect, adminOnly, getDashboardStats);
router.get('/customers', protect, adminOnly, getCustomers);
router.get('/settings', getSettings); // Public so customers can see shop timing & address
router.put('/settings', protect, adminOnly, updateSettings);

module.exports = router;
