import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Store, Clock, PackageCheck, ShoppingBag } from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../../services/api';

const OrderSuccess = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);

  useEffect(() => {
    // Fire festive celebration confetti
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {}

    if (!order && id) {
      api.get(`/orders/${id}`).then((res) => {
        if (res.data.success) {
          setOrder(res.data.order);
        }
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [id, order]);

  if (loading) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center animate-pulse">
        <div className="w-16 h-16 bg-slate-200 rounded-full mx-auto mb-4" />
        <div className="h-6 bg-slate-200 rounded-xl w-1/2 mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 text-center">
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-xl space-y-6">
        {/* Celebration icon */}
        <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-3 py-1 rounded-full">
            Sent to Store Counter
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 mt-3 tracking-tight">
            🎉 Order Placed Successfully!
          </h1>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            Your order has been sent to the shop. The owner will review and begin packing your items shortly.
          </p>
        </div>

        {/* Order Details Highlight */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/60 max-w-md mx-auto text-left space-y-2.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Order ID:</span>
            <span className="font-mono font-black text-sm text-slate-900">
              {order?.orderId || '# ORD-PENDING'}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Current Status:</span>
            <span className="font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
              {order?.orderStatus || 'ORDER_PLACED'}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Fulfillment:</span>
            <span className="font-bold text-slate-800">
              {order?.orderType || 'Pickup from Shop'}{' '}
              {order?.orderType === 'Home Delivery'
                ? order?.deliveryFee > 0
                  ? '(+₹40 Delivery Fee)'
                  : '(FREE Delivery - Order > ₹1,000)'
                : '(FREE - Store Pickup)'}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Grand Total:</span>
            <span className="font-black text-slate-900 text-sm">
              ₹{order?.grandTotal || 0}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200">
            <span className="text-slate-500">Payment:</span>
            <span className="font-semibold text-slate-700">
              {order?.orderType === 'Home Delivery' ? 'Cash / UPI on Delivery' : 'Cash / UPI on Pickup'}
            </span>
          </div>
        </div>

        {/* Next step prompt */}
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/70 text-xs text-amber-900 flex items-start gap-3 text-left">
          <Store className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1.5 w-full">
            <p className="font-bold text-slate-900">What happens next?</p>
            {order?.orderType === 'Home Delivery' ? (
              <>
                <p className="text-amber-800/80">
                  Your order is being packed. Once ready, it will be dispatched for home delivery to your address.
                </p>
                <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200/60 text-[11px] text-slate-700 space-y-0.5">
                  <p><span className="font-bold text-slate-900">🛵 Deliver to:</span> {order?.customerAddress}</p>
                  <p><span className="font-bold text-slate-900">📞 Store Helpline:</span> +91 95730 45430</p>
                </div>
              </>
            ) : (
              <>
                <p className="text-amber-800/80">
                  You will receive an in-app notification when your items are packed and ready for pickup at the counter.
                </p>
                <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200/60 text-[11px] text-slate-700 space-y-0.5">
                  <p><span className="font-bold text-slate-900">📍 Counter Location:</span> Domalakunta, near govt school, Telangana</p>
                  <p><span className="font-bold text-slate-900">⏰ Store Timings:</span> 7:00 AM to 10:00 PM</p>
                  <p><span className="font-bold text-slate-900">📞 Store Helpline:</span> +91 95730 45430</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link
            to={`/orders/${order?._id || ''}`}
            className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-lg shadow-brand-500/20 text-xs sm:text-sm flex items-center justify-center gap-2 transition"
          >
            <PackageCheck className="w-4 h-4" /> Track Order Status
          </Link>
          <Link
            to="/products"
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 transition"
          >
            <ShoppingBag className="w-4 h-4" /> Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
