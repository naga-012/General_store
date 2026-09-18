import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Package,
  Clock,
  CheckCircle2,
  ChevronRight,
  Store,
  Calendar,
  ArrowRight,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';
import api from '../../services/api';
import OrderTimeline from '../../components/OrderTimeline';
import { useSocket } from '../../context/SocketContext';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const { id } = useParams(); // If tracking a specific order directly: /orders/:id

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/my-orders');
      if (res.data.success) {
        setOrders(res.data.orders);
        if (id) {
          const match = res.data.orders.find((o) => o._id === id);
          if (match) setSelectedOrder(match);
        } else if (res.data.orders.length > 0 && !selectedOrder) {
          setSelectedOrder(res.data.orders[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // 10s fallback sync
    return () => clearInterval(interval);
  }, [id]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ORDER_PLACED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            Order Placed
          </span>
        );
      case 'ORDER_ACCEPTED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            Order Accepted
          </span>
        );
      case 'PACKED':
      case 'READY_FOR_PICKUP':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            Ready for Pickup
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Completed
          </span>
        );
      case 'REJECTED':
      case 'CANCELLED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            {status}
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-slate-200 rounded-xl w-1/4" />
          <div className="h-40 bg-slate-100 rounded-3xl" />
          <div className="h-40 bg-slate-100 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-4">
          <Package className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-800">No Orders Yet</h2>
        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
          Your orders will appear here once you place an order with our store.
        </p>
        <Link
          to="/products"
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-brand-700 transition"
        >
          <ShoppingBag className="w-4 h-4" /> Shop Groceries Now
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="pb-6 border-b border-slate-200 mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          My Store Orders & Tracking
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Follow your live packaging progress and view receipt details
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column: Orders list */}
        <div className="lg:col-span-5 space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Order History ({orders.length})
          </h2>

          <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1">
            {orders.map((o) => {
              const isSelected = selectedOrder?._id === o._id;
              return (
                <div
                  key={o._id}
                  onClick={() => setSelectedOrder(o)}
                  className={`p-5 rounded-3xl border transition cursor-pointer ${
                    isSelected
                      ? 'border-brand-600 bg-brand-50/40 ring-2 ring-brand-500 shadow-md'
                      : 'border-slate-200/80 bg-white hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono font-bold text-sm text-slate-900 block">
                        {o.orderId}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {new Date(o.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div>{getStatusBadge(o.orderStatus)}</div>
                  </div>

                  {/* Summary */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      {o.items.length} item{o.items.length > 1 ? 's' : ''} (
                      {o.items.map((i) => i.name).slice(0, 2).join(', ')}
                      {o.items.length > 2 ? '...' : ''})
                    </span>
                    <span className="font-black text-slate-900 text-sm">
                      ₹{o.grandTotal}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column: Selected Order Details & Live Timeline */}
        <div className="lg:col-span-7">
          {selectedOrder ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-8 sticky top-24">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">Order ID:</span>
                    <h3 className="font-mono text-xl font-black text-slate-900">
                      {selectedOrder.orderId}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Placed on{' '}
                    {new Date(selectedOrder.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div>{getStatusBadge(selectedOrder.orderStatus)}</div>
              </div>

              {/* Ready for pickup / delivery special alert */}
              {(selectedOrder.orderStatus === 'PACKED' ||
                selectedOrder.orderStatus === 'READY_FOR_PICKUP') && (
                <div className="bg-amber-500 text-white p-5 rounded-3xl shadow-lg shadow-amber-500/20 flex items-start gap-3">
                  <Store className="w-6 h-6 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-black text-base">
                      {selectedOrder.orderType === 'Home Delivery'
                        ? '🛵 Order Packed & Ready for Delivery!'
                        : '🔔 Order Ready for Pickup!'}
                    </h4>
                    <p className="text-xs sm:text-sm text-white/95 mt-1 leading-snug">
                      {selectedOrder.orderType === 'Home Delivery'
                        ? `Your items are packed and being dispatched to: ${selectedOrder.customerAddress}. Delivery charge: ${selectedOrder.deliveryFee > 0 ? `₹${selectedOrder.deliveryFee}` : '₹0 (FREE Delivery)'}.`
                        : 'Your items are packed and ready at the store counter in Domalakunta, near govt school (No delivery charge).'}
                    </p>
                  </div>
                </div>
              )}

              {/* Delivery Address & Google Maps Location details */}
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70 text-xs space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      {selectedOrder.orderType === 'Home Delivery' ? 'Delivery Address' : 'Pickup Type'}
                    </span>
                    <p className="font-semibold text-slate-800 text-xs mt-0.5">
                      {selectedOrder.customerAddress || 'Store Counter Pickup'}
                    </p>
                  </div>
                  <span className="font-bold text-[11px] px-2.5 py-1 rounded-full bg-slate-200/60 text-slate-700">
                    {selectedOrder.orderType || 'Pickup'}
                  </span>
                </div>

                {selectedOrder.googleLocation && (
                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                    <span className="text-slate-600 font-medium text-[11px] flex items-center gap-1">
                      📍 Google Location Pinpoint:
                    </span>
                    <a
                      href={selectedOrder.googleLocation.startsWith('http') ? selectedOrder.googleLocation : `https://www.google.com/maps?q=${encodeURIComponent(selectedOrder.googleLocation)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition text-[11px]"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                      Open in Google Maps ↗
                    </a>
                  </div>
                )}
              </div>

              {/* Visual Order Tracking Timeline */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Live Order Status Timeline
                </h4>
                <div className="bg-slate-50/70 p-4 sm:p-6 rounded-3xl border border-slate-200/60">
                  <OrderTimeline
                    orderStatus={selectedOrder.orderStatus}
                    statusHistory={selectedOrder.statusHistory}
                  />
                </div>
              </div>

              {/* Items in this order */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Packed Items ({selectedOrder.items.length})
                </h4>
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl p-2 bg-slate-50/30">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=80&auto=format&fit=crop&q=60'}
                          alt={item.name}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200/60 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                          <span className="text-slate-500">
                            Unit: {item.unit} | Qty: {item.quantity}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-slate-900 text-sm">
                          ₹{item.lineTotal}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          ₹{item.price} each
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bill totals */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-800">₹{selectedOrder.subtotal}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Delivery Charge</span>
                  {selectedOrder.orderType === 'Home Delivery' ? (
                    selectedOrder.deliveryFee > 0 ? (
                      <span className="font-bold text-slate-900">+₹{selectedOrder.deliveryFee} (Home Delivery)</span>
                    ) : (
                      <span className="font-bold text-emerald-600">FREE (Home Delivery &gt; ₹1,000)</span>
                    )
                  ) : (
                    <span className="font-bold text-emerald-600">FREE (Customer Pickup - ₹0)</span>
                  )}
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
                  <span className="text-sm font-black text-slate-900">Grand Total</span>
                  <span className="text-lg font-black text-brand-700">₹{selectedOrder.grandTotal}</span>
                </div>
                <div className="pt-2 text-[11px] text-slate-500 flex justify-between">
                  <span>Payment Method:</span>
                  <span className="font-semibold text-slate-700">
                    {selectedOrder.paymentMethod} ({selectedOrder.paymentStatus})
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-400">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-xs">Select an order on the left to track</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyOrders;
