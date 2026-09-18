import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  CheckCircle,
  XCircle,
  PackageCheck,
  CheckCheck,
  Eye,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  Clock,
  Filter,
} from 'lucide-react';
import api from '../../services/api';
import ConfirmationModal from '../../components/ConfirmationModal';
import OrderTimeline from '../../components/OrderTimeline';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    type: 'brand',
    action: null,
  });

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (activeTab !== 'all') params.append('status', activeTab);
      if (search.trim()) params.append('search', search.trim());

      const res = await api.get(`/orders/admin/all?${params.toString()}`);
      if (res.data.success) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      console.error('Failed to load admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 8000); // 8s live refresh
    return () => clearInterval(interval);
  }, [activeTab, search]);

  const handleStatusChange = async (orderId, newStatus, reason = '') => {
    try {
      const res = await api.put(`/orders/admin/${orderId}/status`, {
        status: newStatus,
        rejectionReason: reason,
      });

      if (res.data.success) {
        // Update local list
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? res.data.order : o))
        );
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(res.data.order);
        }
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      alert(err.response?.data?.message || 'Failed to update order status');
    }
  };

  const triggerStatusAction = (order, newStatus) => {
    if (newStatus === 'ORDER_ACCEPTED') {
      setConfirmModal({
        isOpen: true,
        title: 'Accept Customer Order?',
        message: `Accept order ${order.orderId} from ${order.customerName}? Customer will be notified that packing is starting.`,
        confirmText: 'Accept Order',
        type: 'brand',
        action: () => handleStatusChange(order._id, 'ORDER_ACCEPTED'),
      });
    } else if (newStatus === 'PACKED') {
      setConfirmModal({
        isOpen: true,
        title: 'Mark Items as Packed?',
        message: `Have all items for ${order.orderId} been weighed and packed in bags? Customer will receive immediate notification: "Your items are packed. Please come to the shop for pickup."`,
        confirmText: 'Mark Packed & Ready',
        type: 'brand',
        action: () => handleStatusChange(order._id, 'PACKED'),
      });
    } else if (newStatus === 'COMPLETED') {
      setConfirmModal({
        isOpen: true,
        title: 'Complete Order & Collect Payment?',
        message: `Customer is collecting items for ${order.orderId} (₹${order.grandTotal}). Marking completed will record payment as PAID and automatically update inventory stock.`,
        confirmText: 'Complete Pickup',
        type: 'success',
        action: () => handleStatusChange(order._id, 'COMPLETED'),
      });
    } else if (newStatus === 'REJECTED') {
      const reason = prompt('Please enter reason for rejecting this order (e.g. items out of stock):', 'Store item temporarily unavailable');
      if (reason !== null) {
        handleStatusChange(order._id, 'REJECTED', reason);
      }
    }
  };

  const tabs = [
    { id: 'all', label: 'All Orders' },
    { id: 'new', label: 'New Orders' },
    { id: 'accepted', label: 'Accepted' },
    { id: 'packed', label: 'Ready for Pickup' },
    { id: 'completed', label: 'Completed' },
    { id: 'rejected', label: 'Rejected / Cancelled' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Order Fulfillment & Counter Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Accept orders, mark packages ready for pickup, and complete customer checkouts
          </p>
        </div>

        {/* Search Input */}
        <div className="relative max-w-xs w-full">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Order ID, name, mobile..."
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === tab.id
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders Table / Cards */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-500 animate-pulse">
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-bold text-slate-400">No orders in this category</p>
            <p className="text-xs text-slate-600 mt-1">
              New customer orders will appear here in real-time.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">Order ID & Date</th>
                  <th className="p-4">Customer Details</th>
                  <th className="p-4">Items Summary</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Order Status</th>
                  <th className="p-4 text-center">Counter Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-slate-900/40 transition">
                    {/* Order ID & Date */}
                    <td className="p-4">
                      <span className="font-mono font-black text-white text-sm block">
                        {order.orderId}
                      </span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="p-4">
                      <p className="font-bold text-slate-100 text-sm">
                        {order.customerName}
                      </p>
                      <a
                        href={`tel:${order.customerMobile}`}
                        className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 mt-0.5"
                      >
                        <Phone className="w-3 h-3" /> {order.customerMobile}
                      </a>
                    </td>

                    {/* Items */}
                    <td className="p-4 max-w-xs">
                      <p className="font-bold text-slate-200">
                        {order.items?.length} item{order.items?.length > 1 ? 's' : ''}
                      </p>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {order.items?.map((i) => `${i.name} (${i.unit} × ${i.quantity})`).join(', ')}
                      </p>
                    </td>

                    {/* Total Amount */}
                    <td className="p-4">
                      <span className="text-sm font-black text-white">
                        ₹{order.grandTotal}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {order.orderType === 'Home Delivery'
                          ? order.deliveryFee === 0
                            ? '🛵 Home Delivery (Free > ₹1k)'
                            : '🛵 Home Delivery (+₹40)'
                          : '🏪 Pickup (Free)'}
                      </span>
                    </td>

                    {/* Status badge */}
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1.5 ${
                          order.orderStatus === 'ORDER_PLACED'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : order.orderStatus === 'ORDER_ACCEPTED'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : order.orderStatus === 'PACKED' || order.orderStatus === 'READY_FOR_PICKUP'
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : order.orderStatus === 'COMPLETED'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {order.orderStatus === 'ORDER_PLACED' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                        )}
                        {order.orderStatus}
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* Status Transition buttons */}
                        {order.orderStatus === 'ORDER_PLACED' && (
                          <>
                            <button
                              type="button"
                              onClick={() => triggerStatusAction(order, 'ORDER_ACCEPTED')}
                              className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs transition shadow-sm"
                              title="Accept Order"
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              onClick={() => triggerStatusAction(order, 'REJECTED')}
                              className="px-2.5 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition"
                              title="Reject Order"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {order.orderStatus === 'ORDER_ACCEPTED' && (
                          <button
                            type="button"
                            onClick={() => triggerStatusAction(order, 'PACKED')}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
                            title="Mark as Packed"
                          >
                            <PackageCheck className="w-3.5 h-3.5" /> Mark as Packed
                          </button>
                        )}

                        {(order.orderStatus === 'PACKED' || order.orderStatus === 'READY_FOR_PICKUP') && (
                          <button
                            type="button"
                            onClick={() => triggerStatusAction(order, 'COMPLETED')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
                            title="Mark as Completed upon Customer Pickup"
                          >
                            <CheckCheck className="w-3.5 h-3.5" /> Mark Completed
                          </button>
                        )}

                        {/* View Order Modal button */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrder(order);
                            setDetailModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-xl transition"
                          title="View Order Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {detailModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl text-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="font-mono text-xl font-black text-white">
                  {selectedOrder.orderId}
                </span>
                <p className="text-xs text-slate-400 mt-0.5">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Customer Details */}
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block font-semibold">Customer:</span>
                <span className="font-bold text-white text-sm">
                  {selectedOrder.customerName}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block font-semibold">Mobile:</span>
                <a
                  href={`tel:${selectedOrder.customerMobile}`}
                  className="font-bold text-amber-400 hover:underline"
                >
                  {selectedOrder.customerMobile}
                </a>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-500 block font-semibold">Fulfillment Mode:</span>
                <span className="font-bold text-amber-400">
                  {selectedOrder.orderType === 'Home Delivery'
                    ? selectedOrder.deliveryFee === 0
                      ? '🛵 Home Delivery (Free Delivery - Order > ₹1,000)'
                      : '🛵 Home Delivery (+₹40 Delivery Fee)'
                    : '🏪 Customer Counter Pickup (No Delivery Charge - ₹0)'}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-500 block font-semibold">Address / Notes:</span>
                <span className="text-slate-300">
                  {selectedOrder.customerAddress || 'Counter Pickup'} —{' '}
                  <span className="italic text-amber-300/80">
                    "{selectedOrder.pickupNotes}"
                  </span>
                </span>
              </div>
            </div>

            {/* Order Timeline in Dark Mode */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">
                Workflow Progress
              </h4>
              <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                <OrderTimeline
                  orderStatus={selectedOrder.orderStatus}
                  statusHistory={selectedOrder.statusHistory}
                />
              </div>
            </div>

            {/* Itemized List */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">
                Items to Pack ({selectedOrder.items?.length})
              </h4>
              <div className="divide-y divide-slate-800 border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/30">
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=80&auto=format&fit=crop&q=60'}
                        alt={item.name}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-800 shrink-0"
                      />
                      <div>
                        <p className="font-bold text-white">{item.name}</p>
                        <span className="text-slate-400">
                          Unit: <span className="text-amber-400 font-semibold">{item.unit}</span> | Qty: {item.quantity}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-white text-sm">
                        ₹{item.lineTotal}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        ₹{item.price} each
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total and modal action buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <div>
                <span className="text-xs text-slate-400">Grand Total:</span>
                <span className="text-xl font-black text-amber-400 ml-2">
                  ₹{selectedOrder.grandTotal}
                </span>
              </div>

              <div className="flex gap-2">
                {selectedOrder.orderStatus === 'ORDER_PLACED' && (
                  <button
                    onClick={() => {
                      triggerStatusAction(selectedOrder, 'ORDER_ACCEPTED');
                      setDetailModalOpen(false);
                    }}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs shadow-sm"
                  >
                    Accept Order
                  </button>
                )}
                {selectedOrder.orderStatus === 'ORDER_ACCEPTED' && (
                  <button
                    onClick={() => {
                      triggerStatusAction(selectedOrder, 'PACKED');
                      setDetailModalOpen(false);
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs shadow-sm"
                  >
                    Mark Packed
                  </button>
                )}
                {(selectedOrder.orderStatus === 'PACKED' ||
                  selectedOrder.orderStatus === 'READY_FOR_PICKUP') && (
                  <button
                    onClick={() => {
                      triggerStatusAction(selectedOrder, 'COMPLETED');
                      setDetailModalOpen(false);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-sm"
                  >
                    Complete Pickup
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        type={confirmModal.type}
        onConfirm={() => {
          if (confirmModal.action) confirmModal.action();
          setConfirmModal({ ...confirmModal, isOpen: false });
        }}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
    </div>
  );
};

export default AdminOrders;
