let ioInstance = null;

const initSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`Socket client connected: ${socket.id}`);

    // Join room for specific user (customer)
    socket.on('join_user_room', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
        console.log(`Socket ${socket.id} joined user room: user:${userId}`);
      }
    });

    // Join admin room
    socket.on('join_admin_room', () => {
      socket.join('admin_room');
      console.log(`Socket ${socket.id} joined admin_room`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket client disconnected: ${socket.id}`);
    });
  });
};

const getIO = () => {
  return ioInstance;
};

// Emit new order alert to admin
const emitNewOrderToAdmin = (orderData) => {
  if (ioInstance) {
    ioInstance.to('admin_room').emit('new_order_received', orderData);
  }
};

// Emit status update to customer and admin
const emitOrderStatusUpdate = (userId, orderData, notificationData) => {
  if (ioInstance) {
    if (userId) {
      ioInstance.to(`user:${userId}`).emit('order_status_updated', {
        order: orderData,
        notification: notificationData,
      });
    }
    // Also notify admins so their dashboard stays in sync live
    ioInstance.to('admin_room').emit('order_status_updated', {
      order: orderData,
      notification: notificationData,
    });
  }
};

// Emit low stock alert to admin
const emitLowStockAlert = (alertData) => {
  if (ioInstance) {
    ioInstance.to('admin_room').emit('low_stock_alert', alertData);
  }
};

// Emit product updates to both customer and owner
const emitProductChange = (changeData) => {
  if (ioInstance) {
    ioInstance.emit('product_updated', changeData);
  }
};

module.exports = {
  initSocket,
  getIO,
  emitNewOrderToAdmin,
  emitOrderStatusUpdate,
  emitLowStockAlert,
  emitProductChange,
};
