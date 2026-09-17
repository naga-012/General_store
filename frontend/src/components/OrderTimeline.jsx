import React from 'react';
import {
  CheckCircle2,
  Clock,
  PackageCheck,
  Store,
  CheckCheck,
  XCircle,
  AlertCircle,
} from 'lucide-react';

const OrderTimeline = ({ orderStatus, statusHistory = [] }) => {
  const isRejected = orderStatus === 'REJECTED';
  const isCancelled = orderStatus === 'CANCELLED';

  const steps = [
    {
      id: 'ORDER_PLACED',
      label: 'Order Placed',
      description: 'Sent to shop counter',
      icon: Clock,
    },
    {
      id: 'ORDER_ACCEPTED',
      label: 'Order Accepted',
      description: 'Confirmed by shopkeeper',
      icon: CheckCircle2,
    },
    {
      id: 'PACKED',
      label: 'Order Packed',
      description: 'Items weighed & packed',
      icon: PackageCheck,
    },
    {
      id: 'READY_FOR_PICKUP',
      label: 'Ready for Pickup',
      description: 'Come collect at counter',
      icon: Store,
    },
    {
      id: 'COMPLETED',
      label: 'Order Completed',
      description: 'Items handed over & paid',
      icon: CheckCheck,
    },
  ];

  // Map backend status to step progression index
  const getStepIndex = (status) => {
    switch (status) {
      case 'ORDER_PLACED':
        return 0;
      case 'ORDER_ACCEPTED':
        return 1;
      case 'PACKED':
        return 2;
      case 'READY_FOR_PICKUP':
        return 3;
      case 'COMPLETED':
        return 4;
      default:
        return 0;
    }
  };

  const currentStepIndex = getStepIndex(orderStatus);

  if (isRejected || isCancelled) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-3">
          <XCircle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-rose-900">
          Order {isRejected ? 'Rejected by Shop' : 'Cancelled'}
        </h3>
        <p className="text-sm text-rose-700 mt-1 max-w-md mx-auto">
          {isRejected
            ? 'The shopkeeper could not accept this order at this time. You will not be charged.'
            : 'This order was cancelled.'}
        </p>
      </div>
    );
  }

  return (
    <div className="py-4">
      {/* Desktop / Tablet Horizontal Timeline */}
      <div className="hidden sm:grid grid-cols-5 gap-2 relative">
        {/* Connecting progress bar */}
        <div className="absolute top-5 left-8 right-8 h-1 bg-slate-200 -z-0">
          <div
            className="h-full bg-brand-500 transition-all duration-700 ease-out"
            style={{
              width: `${(Math.min(currentStepIndex, 4) / 4) * 100}%`,
            }}
          />
        </div>

        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isDone = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;
          const isPending = idx > currentStepIndex;

          const historyEntry = statusHistory.find(
            (h) =>
              h.status === step.id ||
              (step.id === 'READY_FOR_PICKUP' && h.status === 'PACKED')
          );

          return (
            <div
              key={step.id}
              className="flex flex-col items-center text-center relative z-10"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm ${
                  isDone
                    ? 'bg-brand-600 text-white ring-4 ring-brand-100'
                    : isCurrent
                    ? 'bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse-subtle'
                    : 'bg-white border-2 border-slate-200 text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <h4
                className={`text-xs font-bold mt-2.5 ${
                  isDone
                    ? 'text-brand-700'
                    : isCurrent
                    ? 'text-amber-600 font-extrabold'
                    : 'text-slate-400'
                }`}
              >
                {step.label}
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5 max-w-[120px]">
                {step.description}
              </p>
              {historyEntry && (
                <span className="text-[10px] text-slate-400 mt-1 font-mono">
                  {new Date(historyEntry.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile Vertical Timeline */}
      <div className="sm:hidden space-y-4 relative pl-6 border-l-2 border-slate-200 ml-4">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isDone = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;
          const isPending = idx > currentStepIndex;

          const historyEntry = statusHistory.find(
            (h) =>
              h.status === step.id ||
              (step.id === 'READY_FOR_PICKUP' && h.status === 'PACKED')
          );

          return (
            <div key={step.id} className="relative">
              <div
                className={`absolute -left-[35px] top-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  isDone
                    ? 'bg-brand-600 text-white'
                    : isCurrent
                    ? 'bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse'
                    : 'bg-white border border-slate-300 text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <h4
                  className={`text-sm font-bold ${
                    isDone
                      ? 'text-brand-700'
                      : isCurrent
                      ? 'text-amber-600 font-extrabold'
                      : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </h4>
                <p className="text-xs text-slate-500">{step.description}</p>
                {historyEntry && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(historyEntry.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderTimeline;
