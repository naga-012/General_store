const Notification = require('../models/Notification');

// @desc    Get user notifications (or admin notifications if admin)
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'admin') {
      // Admin sees notifications meant for admin or broadcast
      query = {
        $or: [
          { forRole: 'admin' },
          { forRole: 'all' },
          { recipient: req.user._id },
        ],
      };
    } else {
      // Customer sees notifications meant specifically for them
      query = { recipient: req.user._id };
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({
      ...query,
      read: false,
    });

    res.json({
      success: true,
      count: notifications.length,
      unreadCount,
      notifications,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    notification.read = true;
    await notification.save();

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/mark-all-read
// @access  Private
const markAllAsRead = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'admin') {
      query = {
        $or: [
          { forRole: 'admin' },
          { forRole: 'all' },
          { recipient: req.user._id },
        ],
      };
    } else {
      query = { recipient: req.user._id };
    }

    await Notification.updateMany(query, { $set: { read: true } });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};
