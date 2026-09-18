import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  ArrowLeft,
  Store,
  ShieldCheck,
  Bike,
  Check,
  Sparkles,
  Truck,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

const Cart = () => {
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    deliveryFee,
    grandTotal,
    deliveryOption,
    setDeliveryOption,
    FREE_DELIVERY_THRESHOLD,
    isFreeDeliveryEligible,
    freeDeliveryRemaining,
  } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleProceed = () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=checkout');
    } else {
      navigate('/checkout');
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-24 h-24 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 mx-auto mb-6 shadow-inner">
          <ShoppingBag className="w-12 h-12" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Your Cart is Empty
        </h2>
        <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
          You haven't added any groceries to your cart yet. Explore our kitchen staples, dals, and spices!
        </p>
        <Link
          to="/products"
          className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-lg shadow-brand-500/20 text-sm transition"
        >
          Start Shopping Now <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Shopping Cart
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review your selected groceries and unit weights before checkout
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        {/* Cart Items Table / List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            {/* Desktop Table Header */}
            <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3.5 bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <div className="col-span-5">Product</div>
              <div className="col-span-2 text-center">Unit</div>
              <div className="col-span-2 text-center">Quantity</div>
              <div className="col-span-2 text-right">Total</div>
              <div className="col-span-1 text-center">Action</div>
            </div>

            {/* Item Rows */}
            <div className="divide-y divide-slate-100">
              {cartItems.map((item) => (
                <div
                  key={item.key}
                  className="p-4 sm:p-6 sm:grid sm:grid-cols-12 sm:gap-4 sm:items-center flex flex-col gap-3"
                >
                  {/* Product & Image */}
                  <div className="sm:col-span-5 flex items-center gap-3">
                    <img
                      src={item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100&auto=format&fit=crop&q=60'}
                      alt={item.name}
                      className="w-14 h-14 rounded-2xl object-contain p-1 bg-white shrink-0 border border-slate-200"
                    />
                    <div className="min-w-0">
                      <Link
                        to={`/products/${item.productId}`}
                        className="font-bold text-sm text-slate-900 hover:text-brand-600 line-clamp-2 leading-tight"
                      >
                        {item.name}
                      </Link>
                      <span className="text-xs text-slate-400 block mt-0.5 sm:hidden">
                        Unit: {item.unit} | ₹{item.price} each
                      </span>
                    </div>
                  </div>

                  {/* Unit */}
                  <div className="hidden sm:block sm:col-span-2 text-center">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-800 text-xs font-bold rounded-xl">
                      {item.unit}
                    </span>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="sm:col-span-2 flex items-center justify-between sm:justify-center">
                    <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.key, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-white rounded-lg transition"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.key, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-white rounded-lg transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Mobile price total and remove */}
                    <div className="flex items-center gap-3 sm:hidden">
                      <span className="font-black text-sm text-slate-900">
                        ₹{item.price * item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.key)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Line Total */}
                  <div className="hidden sm:block sm:col-span-2 text-right">
                    <span className="font-black text-sm text-slate-900">
                      ₹{item.price * item.quantity}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      ₹{item.price} each
                    </span>
                  </div>

                  {/* Action */}
                  <div className="hidden sm:block sm:col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.key)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-xs font-bold text-brand-700 hover:text-brand-800"
            >
              <ArrowLeft className="w-4 h-4" /> Continue Shopping
            </Link>
          </div>
        </div>

        {/* Order Summary Box */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-900 pb-3 border-b border-slate-100">
              Order Summary
            </h3>

            {/* Free Delivery Threshold Banner */}
            <div className={`p-3.5 rounded-2xl border transition-all ${
              isFreeDeliveryEligible
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50/90 border-amber-200/80 text-amber-900'
            }`}>
              <div className="flex items-center gap-2 mb-1.5">
                {isFreeDeliveryEligible ? (
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Truck className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <p className="text-xs font-bold">
                  {isFreeDeliveryEligible
                    ? '🎉 You unlocked FREE Home Delivery!'
                    : `Add ₹${freeDeliveryRemaining} more for FREE Delivery!`}
                </p>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    isFreeDeliveryEligible ? 'bg-emerald-500' : 'bg-brand-500'
                  }`}
                  style={{
                    width: `${Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100)}%`,
                  }}
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1 flex justify-between">
                <span>Free delivery on orders above ₹1,000</span>
                <span className="font-semibold text-slate-700">₹{subtotal} / ₹1,000</span>
              </p>
            </div>

            {/* Delivery Option Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Fulfillment Method:
              </label>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => setDeliveryOption('pickup')}
                  className={`p-3 rounded-2xl border text-left transition flex items-center justify-between gap-3 ${
                    deliveryOption === 'pickup'
                      ? 'border-brand-600 bg-brand-50/70 ring-2 ring-brand-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      deliveryOption === 'pickup' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <Store className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        Customer Counter Pickup
                        <span className="px-1.5 py-0.5 text-[10px] bg-emerald-100 text-emerald-800 font-bold rounded-full">
                          NO CHARGE
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Collect from Domalakunta store
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-emerald-600">₹0 (FREE)</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryOption('delivery')}
                  className={`p-3 rounded-2xl border text-left transition flex items-center justify-between gap-3 ${
                    deliveryOption === 'delivery'
                      ? 'border-brand-600 bg-brand-50/70 ring-2 ring-brand-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      deliveryOption === 'delivery' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <Bike className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        Home Delivery
                        {isFreeDeliveryEligible ? (
                          <span className="px-1.5 py-0.5 text-[10px] bg-emerald-100 text-emerald-800 font-bold rounded-full">
                            FREE (ORDER &gt; ₹1000)
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 text-[10px] bg-sky-100 text-sky-800 font-bold rounded-full">
                            DOORSTEP
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Delivered to your address
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {isFreeDeliveryEligible ? (
                      <span className="text-xs font-black text-emerald-600">₹0 (FREE)</span>
                    ) : (
                      <span className="text-xs font-black text-slate-900">+₹40</span>
                    )}
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-2.5 text-sm pt-2 border-t border-slate-100">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal</span>
                <span className="font-bold text-slate-900">₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery Charge</span>
                {deliveryOption === 'delivery' ? (
                  deliveryFee === 0 ? (
                    <span className="font-bold text-emerald-600">FREE (Order &gt; ₹1,000)</span>
                  ) : (
                    <span className="font-bold text-slate-900">+₹40 (Home Delivery)</span>
                  )
                ) : (
                  <span className="font-bold text-emerald-600">FREE (Counter Pickup - ₹0)</span>
                )}
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Packaging Fee</span>
                <span className="font-bold text-emerald-600">FREE</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
              <div>
                <span className="text-base font-black text-slate-900">Grand Total</span>
                <span className="text-xs text-slate-400 block font-normal">
                  {deliveryOption === 'pickup' ? 'Pay at counter upon pickup' : 'Pay Cash/UPI on delivery'}
                </span>
              </div>
              <span className="text-2xl font-black text-brand-700">₹{grandTotal}</span>
            </div>

            <button
              type="button"
              onClick={handleProceed}
              className="w-full mt-4 py-3.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-lg shadow-brand-500/20 text-sm flex items-center justify-center gap-2 transition"
            >
              Proceed to Place Order <ArrowRight className="w-4 h-4" />
            </button>

            {!isAuthenticated && (
              <p className="text-[11px] text-center text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200">
                You will be asked to login or register your name & phone before placing order.
              </p>
            )}
          </div>

          {/* Store Pickup Assurance */}
          <div className="bg-brand-50/50 border border-brand-200/60 rounded-3xl p-5 space-y-3 text-xs text-brand-900">
            <div className="flex items-center gap-2 font-bold text-brand-800">
              <Store className="w-4 h-4 text-brand-600" />
              Counter Pickup Information
            </div>
            <p className="text-brand-800/80 leading-relaxed">
              Once you confirm, the shopkeeper will weigh, inspect and pack all items in clean bags. You will receive a notification when it's ready.
            </p>
            <div className="flex items-center gap-1.5 font-semibold text-emerald-700">
              <ShieldCheck className="w-4 h-4" /> Pay with Cash or UPI after checking items
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
