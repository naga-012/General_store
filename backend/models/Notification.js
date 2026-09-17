const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null means broadcast / for all admins
    },
    forRole: {
      type: String,
      enum: ['customer', 'admin', 'all'],
      default: 'customer',
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    orderIdStr: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        'ORDER_PLACED',
        'ORDER_ACCEPTED',
        'ORDER_PACKED',
        'READY_FOR_PICKUP',
        'ORDER_COMPLETED',
        'ORDER_REJECTED',
        'ORDER_CANCELLED',
        'LOW_STOCK',
        'SYSTEM',
      ],
      default: 'ORDER_STATUS',
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
