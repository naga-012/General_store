import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [productEvent, setProductEvent] = useState(null);
  const { user, isAuthenticated, isAdmin } = useAuth();
  const { addLiveNotification, fetchNotifications } = useNotification();

  useEffect(() => {
    // Determine socket server URL
    const getSocketUrl = () => {
      const socketEnv = import.meta.env.VITE_SOCKET_URL;
      if (socketEnv) return socketEnv.replace(/\/+$/, '');
      const apiEnv = import.meta.env.VITE_API_URL;
      if (apiEnv) return apiEnv.replace(/\/api\/?$/, '');
      return window.location.origin;
    };

    // Initialize socket connection
    const newSocket = io(getSocketUrl(), {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket connected to backend');
      if (user?._id) {
        newSocket.emit('join_user_room', user._id);
      }
      if (isAdmin) {
        newSocket.emit('join_admin_room');
      }
    });

    // Admin receives new orders
    newSocket.on('new_order_received', (orderData) => {
      console.log('Live new order alert:', orderData);
      addLiveNotification({
        _id: Date.now().toString(),
        title: '🔔 New Order Received',
        message: `Order ${orderData.orderId} from ${orderData.customerName} (₹${orderData.grandTotal})`,
        type: 'ORDER_PLACED',
        orderIdStr: orderData.orderId,
        createdAt: new Date(),
        read: false,
      });
      fetchNotifications();
    });

    // Customer and Admin receive status updates
    newSocket.on('order_status_updated', ({ order, notification }) => {
      console.log('Live order status update:', order, notification);
      if (notification) {
        addLiveNotification(notification);
      }
      fetchNotifications();
    });

    // Admin receives low stock alert
    newSocket.on('low_stock_alert', (alert) => {
      console.log('Low stock warning:', alert);
      addLiveNotification({
        _id: Date.now().toString(),
        title: '⚠️ Low Stock Warning',
        message: alert.message,
        type: 'LOW_STOCK',
        createdAt: new Date(),
        read: false,
      });
      fetchNotifications();
    });

    // Live product updates (Add, edit, price, status change)
    newSocket.on('product_updated', (changeData) => {
      console.log('Live product change received:', changeData);
      setProductEvent(changeData);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user?._id, isAdmin]);

  return (
    <SocketContext.Provider value={{ socket, productEvent }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
