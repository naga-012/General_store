const Order = require('../models/Order');

const generateOrderId = async () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const datePrefix = `ORD-${year}${month}${day}`;

  // Find the latest order created today with this prefix
  const latestOrder = await Order.findOne({
    orderId: { $regex: `^# ${datePrefix}-` },
  }).sort({ createdAt: -1 });

  let sequence = 1;
  if (latestOrder && latestOrder.orderId) {
    const parts = latestOrder.orderId.split('-');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) {
      sequence = lastSeq + 1;
    }
  }

  const seqStr = String(sequence).padStart(3, '0');
  return `# ${datePrefix}-${seqStr}`;
};

module.exports = { generateOrderId };
