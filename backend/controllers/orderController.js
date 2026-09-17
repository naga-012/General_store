const Order = require('../models/Order');
const Product = require('../models/Product');
const Notification = require('../models/Notification');
const { generateOrderId } = require('../utils/orderIdGenerator');
const {
  emitNewOrderToAdmin,
  emitOrderStatusUpdate,
  emitLowStockAlert,
} = require('../services/socketService');

// @desc    Place a new order
// @route   POST /api/orders
// @access  Private (Customer)
const createOrder = async (req, res) => {
  try {
    const { items, customerAddress, customerMobile, notes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is empty' });
    }

    // Verify each item and check stock
    const validatedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId || item.product);
      if (!product || product.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: `Product "${item.name}" is currently unavailable or inactive`,
        });
      }

      // Find the specific variant
      const variant = product.variants.find((v) => v.unit === item.unit);
      if (!variant) {
        return res.status(400).json({
          success: false,
          message: `Unit "${item.unit}" is no longer available for ${product.name}`,
        });
      }

      if (variant.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name} (${item.unit}). Only ${variant.stock} available.`,
        });
      }

      const lineTotal = variant.price * item.quantity;
      subtotal += lineTotal;

      validatedItems.push({
        product: product._id,
        name: product.name,
        image: product.image,
        unit: variant.unit,
        price: variant.price,
        quantity: item.quantity,
        lineTotal,
      });
    }

    const orderId = await generateOrderId();
    const isDelivery = req.body.orderType === 'delivery' || req.body.orderType === 'Home Delivery';
    const deliveryFee = isDelivery ? 40 : 0;
    const grandTotal = subtotal + deliveryFee;

    const order = await Order.create({
      orderId,
      customer: req.user._id,
      customerName: req.user.name,
      customerMobile: customerMobile || req.user.mobile,
      customerAddress: customerAddress || (isDelivery ? req.user.address : 'Store Counter Pickup'),
      items: validatedItems,
      subtotal,
      deliveryFee,
      grandTotal,
      orderType: isDelivery ? 'Home Delivery' : 'Pickup from Shop',
      paymentMethod: isDelivery ? 'Cash / UPI on Delivery' : 'Cash on Pickup',
      paymentStatus: 'PENDING',
      orderStatus: 'ORDER_PLACED',
      pickupNotes: notes || (isDelivery ? 'Deliver to customer address' : 'Please pick up from the store counter once packed.'),
      statusHistory: [
        {
          status: 'ORDER_PLACED',
          timestamp: new Date(),
          note: 'Order successfully placed by customer',
        },
      ],
    });

    // Create notification for customer
    await Notification.create({
      recipient: req.user._id,
      forRole: 'customer',
      order: order._id,
      orderIdStr: order.orderId,
      title: 'Order Placed Successfully',
      message: `Your order ${order.orderId} has been sent to the shop for confirmation.`,
      type: 'ORDER_PLACED',
    });

    // Create notification for admin
    await Notification.create({
      recipient: null,
      forRole: 'admin',
      order: order._id,
      orderIdStr: order.orderId,
      title: 'New Order Received',
      message: `New order ${order.orderId} received from ${order.customerName} (₹${order.grandTotal}).`,
      type: 'ORDER_PLACED',
    });

    // Real-time socket broadcast to Admin
    emitNewOrderToAdmin({
      orderId: order.orderId,
      _id: order._id,
      customerName: order.customerName,
      customerMobile: order.customerMobile,
      itemsCount: order.items.length,
      items: order.items,
      grandTotal: order.grandTotal,
      createdAt: order.createdAt,
      orderStatus: order.orderStatus,
    });

    res.status(201).json({
      success: true,
      message: 'Order Placed Successfully!',
      order,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get logged in customer's orders
// @route   GET /api/orders/my-orders
// @access  Private (Customer)
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id })
      .sort({ createdAt: -1 })
      .populate('items.product', 'name image');

    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private (Customer or Admin)
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('customer', 'name email mobile address');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Customer can only see their own order; Admin can see any
    if (
      req.user.role !== 'admin' &&
      order.customer._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all orders for Admin with tab filtering
// @route   GET /api/orders/admin/all
// @access  Private (Admin)
const getAdminOrders = async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = {};

    if (status && status !== 'all') {
      if (status === 'new') {
        query.orderStatus = 'ORDER_PLACED';
      } else if (status === 'accepted') {
        query.orderStatus = 'ORDER_ACCEPTED';
      } else if (status === 'packed') {
        query.orderStatus = { $in: ['PACKED', 'READY_FOR_PICKUP'] };
      } else if (status === 'completed') {
        query.orderStatus = 'COMPLETED';
      } else if (status === 'rejected') {
        query.orderStatus = 'REJECTED';
      } else if (status === 'cancelled') {
        query.orderStatus = 'CANCELLED';
      } else {
        query.orderStatus = status;
      }
    }

    if (search && search.trim()) {
      query.$or = [
        { orderId: { $regex: search.trim(), $options: 'i' } },
        { customerName: { $regex: search.trim(), $options: 'i' } },
        { customerMobile: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .populate('customer', 'name email mobile');

    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update order status (Accept, Reject, Pack, Ready, Complete, Cancel)
// @route   PUT /api/orders/admin/:id/status
// @access  Private (Admin)
const updateOrderStatus = async (req, res) => {
  try {
    const { status, note, rejectionReason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const validStatuses = [
      'ORDER_PLACED',
      'ORDER_ACCEPTED',
      'PACKED',
      'READY_FOR_PICKUP',
      'COMPLETED',
      'REJECTED',
      'CANCELLED',
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status provided' });
    }

    order.orderStatus = status;
    if (rejectionReason) {
      order.rejectionReason = rejectionReason;
    }

    let defaultNote = '';
    let notifTitle = '';
    let notifMessage = '';
    let notifType = 'ORDER_STATUS';

    switch (status) {
      case 'ORDER_ACCEPTED':
        defaultNote = 'Order accepted by shop owner';
        notifTitle = 'Order Accepted';
        notifMessage = `Your order ${order.orderId} has been accepted by the shop.`;
        notifType = 'ORDER_ACCEPTED';
        break;

      case 'PACKED':
      case 'READY_FOR_PICKUP':
        order.orderStatus = 'PACKED'; // Standardize to PACKED
        defaultNote = 'Items have been packed and are ready for store pickup';
        notifTitle = 'Order Ready for Pickup';
        notifMessage = `Your order ${order.orderId} is packed. Please come to the shop for pickup.`;
        notifType = 'ORDER_PACKED';
        break;

      case 'COMPLETED':
        defaultNote = 'Order collected by customer and marked completed';
        order.paymentStatus = 'PAID';
        notifTitle = 'Order Completed';
        notifMessage = `Your order ${order.orderId} has been completed successfully. Thank you for shopping with us!`;
        notifType = 'ORDER_COMPLETED';

        // Deduct inventory stock if not already deducted
        if (!order.isStockDeducted) {
          for (const item of order.items) {
            const prod = await Product.findById(item.product);
            if (prod) {
              const variant = prod.variants.find((v) => v.unit === item.unit);
              if (variant) {
                variant.stock = Math.max(0, variant.stock - item.quantity);
                await prod.save();

                // Check low stock
                if (variant.stock <= prod.lowStockThreshold) {
                  const alertMsg = `⚠️ Low stock alert: ${prod.name} (${variant.unit}) has only ${variant.stock} left.`;
                  await Notification.create({
                    recipient: null,
                    forRole: 'admin',
                    order: order._id,
                    orderIdStr: order.orderId,
                    title: 'Low Stock Warning',
                    message: alertMsg,
                    type: 'LOW_STOCK',
                  });
                  emitLowStockAlert({
                    productId: prod._id,
                    productName: prod.name,
                    unit: variant.unit,
                    remainingStock: variant.stock,
                    message: alertMsg,
                  });
                }
              }
            }
          }
          order.isStockDeducted = true;
        }
        break;

      case 'REJECTED':
        defaultNote = rejectionReason || 'Order rejected by shop';
        notifTitle = 'Order Rejected';
        notifMessage = `Your order ${order.orderId} could not be accepted. ${rejectionReason ? `Reason: ${rejectionReason}` : ''}`;
        notifType = 'ORDER_REJECTED';
        break;

      case 'CANCELLED':
        defaultNote = 'Order was cancelled';
        notifTitle = 'Order Cancelled';
        notifMessage = `Your order ${order.orderId} has been cancelled.`;
        notifType = 'ORDER_CANCELLED';
        break;
    }

    order.statusHistory.push({
      status: order.orderStatus,
      timestamp: new Date(),
      note: note || defaultNote,
    });

    const updatedOrder = await order.save();

    // Create notification for customer
    const notification = await Notification.create({
      recipient: order.customer,
      forRole: 'customer',
      order: order._id,
      orderIdStr: order.orderId,
      title: notifTitle,
      message: notifMessage,
      type: notifType,
    });

    // Real-time socket broadcast
    emitOrderStatusUpdate(order.customer.toString(), updatedOrder, notification);

    res.json({
      success: true,
      message: `Order status updated to ${updatedOrder.orderStatus}`,
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAdminOrders,
  updateOrderStatus,
};
