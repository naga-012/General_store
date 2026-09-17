import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle2, AlertTriangle, X, ArrowRight, PackageCheck } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

const ToastAlert = () => {
  const { toastAlert, setToastAlert } = useNotification();
  const navigate = useNavigate();

  if (!toastAlert) return null;

  const isPacked = toastAlert.type === 'ORDER_PACKED' || toastAlert.title?.includes('Ready');
  const isLowStock = toastAlert.type === 'LOW_STOCK';
  const isNewOrder = toastAlert.type === 'ORDER_PLACED' && toastAlert.title?.includes('New Order');

  return (
    <div className="fixed top-5 right-5 z-50 max-w-md w-full animate-bounce-short">
      <div
        className={`p-4 rounded-2xl shadow-2xl border backdrop-blur-md transition-all ${
          isPacked
            ? 'bg-amber-500/95 text-white border-amber-400'
            : isLowStock
            ? 'bg-rose-600 text-white border-rose-500'
            : isNewOrder
            ? 'bg-brand-700 text-white border-brand-600'
            : 'bg-slate-900/95 text-white border-slate-700'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-white/20 shrink-0 mt-0.5">
            {isPacked ? (
              <PackageCheck className="w-6 h-6 animate-pulse" />
            ) : isLowStock ? (
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            ) : (
              <Bell className="w-6 h-6 animate-pulse" />
            )}
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-base tracking-wide flex items-center gap-2">
              {toastAlert.title}
            </h4>
            <p className="text-sm text-white/90 mt-1 leading-snug">
              {toastAlert.message}
            </p>
            {toastAlert.orderId && (
              <button
                onClick={() => {
                  setToastAlert(null);
                  navigate('/orders');
                }}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-900 font-semibold rounded-lg text-xs hover:bg-slate-100 transition shadow-sm"
              >
                View Order <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setToastAlert(null)}
            className="p-1 rounded-lg hover:bg-white/20 transition text-white/80 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToastAlert;
