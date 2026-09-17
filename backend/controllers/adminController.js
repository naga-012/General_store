const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Setting = require('../models/Setting');

// @desc    Get dashboard statistics, metrics and chart data
// @route   GET /api/admin/dashboard-stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    
    // Today boundary
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    // This week boundary (last 7 days or start of week)
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    // This month boundary
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      allProducts,
      totalCustomers,
      newCustomers,
      allOrders,
    ] = await Promise.all([
      Product.find().populate('category', 'name slug'),
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'customer', createdAt: { $gte: weekStart } }),
      Order.find().sort({ createdAt: -1 }),
    ]);

    // Compute Product Statistics
    let totalProducts = allProducts.length;
    let activeProducts = 0;
    let inactiveProducts = 0;
    let outOfStockProducts = 0;
    let lowStockProductsList = [];

    allProducts.forEach((p) => {
      if (p.status === 'active') activeProducts++;
      else inactiveProducts++;

      const totalVariantStock = (p.variants || []).reduce((sum, v) => sum + (v.stock || 0), 0);
      const threshold = p.lowStockThreshold !== undefined ? p.lowStockThreshold : 10;

      if (totalVariantStock === 0) {
        outOfStockProducts++;
      } else if (totalVariantStock <= threshold) {
        lowStockProductsList.push(p);
      }
    });

    // Compute Order & Sales Statistics
    let totalSales = 0;
    let todaySales = 0;
    let weekSales = 0;
    let monthSales = 0;

    let newOrdersCount = 0;
    let acceptedOrdersCount = 0;
    let packedOrdersCount = 0;
    let readyPickupOrdersCount = 0;
    let completedOrdersCount = 0;
    let rejectedOrdersCount = 0;
    let cancelledOrdersCount = 0;

    const dailySalesMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailySalesMap[key] = { date: key, sales: 0, orders: 0 };
    }

    const categorySalesMap = {};

    allOrders.forEach((order) => {
      const orderDate = new Date(order.createdAt);
      const isToday = orderDate >= todayStart;
      const isWeek = orderDate >= weekStart;
      const isMonth = orderDate >= monthStart;

      switch (order.orderStatus) {
        case 'ORDER_PLACED':
          newOrdersCount++;
          break;
        case 'ORDER_ACCEPTED':
          acceptedOrdersCount++;
          break;
        case 'PACKED':
          packedOrdersCount++;
          break;
        case 'READY_FOR_PICKUP':
          readyPickupOrdersCount++;
          packedOrdersCount++;
          break;
        case 'COMPLETED':
          completedOrdersCount++;
          break;
        case 'REJECTED':
          rejectedOrdersCount++;
          break;
        case 'CANCELLED':
          cancelledOrdersCount++;
          break;
      }

      // Sales calculations (from completed orders)
      if (order.orderStatus === 'COMPLETED') {
        const amount = order.grandTotal || 0;
        totalSales += amount;
        if (isToday) todaySales += amount;
        if (isWeek) weekSales += amount;
        if (isMonth) monthSales += amount;

        const dayKey = orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (dailySalesMap[dayKey]) {
          dailySalesMap[dayKey].sales += amount;
          dailySalesMap[dayKey].orders += 1;
        }

        (order.items || []).forEach((item) => {
          categorySalesMap[item.name] = (categorySalesMap[item.name] || 0) + (item.lineTotal || 0);
        });
      }
    });

    const dailySalesChart = Object.values(dailySalesMap);
    const topProductsChart = Object.entries(categorySalesMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    res.json({
      success: true,
      stats: {
        // Product stats
        totalProducts,
        activeProducts,
        inactiveProducts,
        outOfStock: outOfStockProducts,
        lowStock: lowStockProductsList.length,

        // Order stats
        totalOrders: allOrders.length,
        newOrders: newOrdersCount,
        acceptedOrders: acceptedOrdersCount,
        packedOrders: packedOrdersCount,
        readyForPickup: readyPickupOrdersCount,
        completedOrders: completedOrdersCount,
        rejectedOrders: rejectedOrdersCount,
        cancelledOrders: cancelledOrdersCount,

        // Sales stats
        todaySales,
        weekSales,
        monthSales,
        totalSales,

        // Customer stats
        totalCustomers,
        newCustomers,
      },
      charts: {
        dailySales: dailySalesChart,
        topProducts: topProductsChart,
      },
      lowStockProducts: lowStockProductsList,
      recentOrders: allOrders.slice(0, 10),
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all registered customers
// @route   GET /api/admin/customers
// @access  Private/Admin
const getCustomers = async (req, res) => {
  try {
    const customers = await User.find({ role: 'customer' })
      .select('-password')
      .sort({ createdAt: -1 });

    const customersWithStats = await Promise.all(
      customers.map(async (c) => {
        const orderCount = await Order.countDocuments({ customer: c._id });
        const completedOrders = await Order.find({
          customer: c._id,
          orderStatus: 'COMPLETED',
        });
        const totalSpent = completedOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);

        return {
          ...c.toObject(),
          orderCount,
          totalSpent,
        };
      })
    );

    res.json({
      success: true,
      count: customersWithStats.length,
      customers: customersWithStats,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get store settings
// @route   GET /api/admin/settings
// @access  Public
const getSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({});
    }
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update store settings
// @route   PUT /api/admin/settings
// @access  Private/Admin
const updateSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting(req.body);
    } else {
      Object.assign(settings, req.body);
    }

    const updated = await settings.save();
    res.json({ success: true, message: 'Shop settings updated successfully', settings: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getCustomers,
  getSettings,
  updateSettings,
};
