const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Setting = require('../models/Setting');

// @desc    Get dashboard statistics, metrics and chart data
// @route   GET /api/admin/dashboard-stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalProducts,
      totalCustomers,
      allOrders,
      lowStockProducts,
    ] = await Promise.all([
      Product.countDocuments(),
      User.countDocuments({ role: 'customer' }),
      Order.find().sort({ createdAt: -1 }),
      Product.find({
        $expr: {
          $lte: [
            { $sum: '$variants.stock' },
            '$lowStockThreshold',
          ],
        },
      }).populate('category', 'name'),
    ]);

    let totalSales = 0;
    let todaySales = 0;
    let todayOrdersCount = 0;

    let newOrdersCount = 0;
    let pendingOrdersCount = 0;
    let packedOrdersCount = 0;
    let completedOrdersCount = 0;
    let rejectedOrdersCount = 0;

    const categorySalesMap = {};
    const dailySalesMap = {};

    // Last 7 days keys
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailySalesMap[key] = { date: key, sales: 0, orders: 0 };
    }

    allOrders.forEach((order) => {
      const orderDate = new Date(order.createdAt);
      const isToday = orderDate >= todayStart;

      if (isToday) {
        todayOrdersCount++;
      }

      if (order.orderStatus === 'ORDER_PLACED') newOrdersCount++;
      else if (order.orderStatus === 'ORDER_ACCEPTED') pendingOrdersCount++;
      else if (order.orderStatus === 'PACKED' || order.orderStatus === 'READY_FOR_PICKUP') packedOrdersCount++;
      else if (order.orderStatus === 'COMPLETED') completedOrdersCount++;
      else if (order.orderStatus === 'REJECTED') rejectedOrdersCount++;

      // Count sales for completed orders
      if (order.orderStatus === 'COMPLETED') {
        totalSales += order.grandTotal;
        if (isToday) {
          todaySales += order.grandTotal;
        }

        // Aggregate daily sales
        const dayKey = orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (dailySalesMap[dayKey]) {
          dailySalesMap[dayKey].sales += order.grandTotal;
          dailySalesMap[dayKey].orders += 1;
        }

        // Aggregate items
        order.items.forEach((item) => {
          categorySalesMap[item.name] = (categorySalesMap[item.name] || 0) + item.lineTotal;
        });
      }
    });

    const dailySalesChart = Object.values(dailySalesMap);
    const topProductsChart = Object.entries(categorySalesMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    res.json({
      success: true,
      stats: {
        totalProducts,
        totalCustomers,
        totalOrders: allOrders.length,
        newOrders: newOrdersCount,
        pendingOrders: pendingOrdersCount,
        packedOrders: packedOrdersCount,
        completedOrders: completedOrdersCount,
        rejectedOrders: rejectedOrdersCount,
        totalSales,
        todaySales,
        todayOrdersCount,
        lowStockCount: lowStockProducts.length,
      },
      charts: {
        dailySales: dailySalesChart,
        topProducts: topProductsChart,
      },
      lowStockProducts,
      recentOrders: allOrders.slice(0, 5),
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

    // Attach order counts
    const customersWithStats = await Promise.all(
      customers.map(async (c) => {
        const orderCount = await Order.countDocuments({ customer: c._id });
        const completedOrders = await Order.find({
          customer: c._id,
          orderStatus: 'COMPLETED',
        });
        const totalSpent = completedOrders.reduce((sum, o) => sum + o.grandTotal, 0);

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
    res.json({ success: true, message: 'Shop settings updated', settings: updated });
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
