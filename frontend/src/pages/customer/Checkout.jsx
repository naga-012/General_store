import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Store,
  MapPin,
  Phone,
  User,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  ArrowLeft,
  Package,
  Bike,
  Navigation,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const Checkout = () => {
  const {
    cartItems,
    subtotal,
    deliveryFee,
    grandTotal,
    deliveryOption,
    setDeliveryOption,
    isFreeDeliveryEligible,
    clearCart,
  } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerMobile, setCustomerMobile] = useState(user?.mobile || '');
  const [customerAddress, setCustomerAddress] = useState(user?.address || '');
  const [googleLocation, setGoogleLocation] = useState('');
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState('');
  const [pickupNotes, setPickupNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (cartItems.length === 0) {
    navigate('/cart');
    return null;
  }

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setDetectingLocation(true);
    setLocationSuccess('');
    setError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        setGoogleLocation(mapsUrl);
        setLocationSuccess(`Location pinned: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        if (!customerAddress.trim()) {
          setCustomerAddress(`GPS Pinpoint: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        }
        setDetectingLocation(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setError('Could not access GPS. Please allow location permissions or paste your Google Maps link.');
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const handleConfirmOrder = async (e) => {
    e.preventDefault();
    setError('');

    if (!customerMobile.trim()) {
      setError('Please provide your mobile number for order notifications.');
      return;
    }

    if (deliveryOption === 'delivery' && !customerAddress.trim()) {
      setError('Please provide your full delivery address for Home Delivery.');
      return;
    }

    setLoading(true);

    try {
      const orderPayload = {
        items: cartItems.map((item) => ({
          productId: item.productId,
          name: item.name,
          unit: item.unit,
          quantity: item.quantity,
          price: item.price,
        })),
        orderType: deliveryOption === 'delivery' ? 'Home Delivery' : 'Pickup from Shop',
        customerAddress: deliveryOption === 'delivery' ? customerAddress.trim() : 'Store Counter Pickup',
        customerMobile: customerMobile.trim(),
        googleLocation: googleLocation.trim(),
        notes: pickupNotes.trim(),
      };

      const res = await api.post('/orders', orderPayload);

      if (res.data.success) {
        clearCart();
        navigate(`/order-success/${res.data.order._id}`, {
          state: { order: res.data.order },
        });
      }
    } catch (err) {
      console.error('Order placement failed:', err);
      setError(
        err.response?.data?.message || 'Unable to place your order. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <Link
        to="/cart"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-brand-700 mb-6 group transition"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition" /> Back to Cart
      </Link>

      <div className="pb-6 border-b border-slate-200 mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Review & Confirm Order
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Verify pickup details and review items before submitting to the shopkeeper
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-semibold flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleConfirmOrder} className="space-y-8">
        {/* Fulfillment Method Selection */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-4">
          <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <span>Choose Fulfillment Method</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDeliveryOption('pickup')}
              className={`p-4 rounded-2xl border text-left transition flex items-start justify-between gap-3 ${
                deliveryOption === 'pickup'
                  ? 'border-brand-600 bg-brand-50/70 ring-2 ring-brand-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  deliveryOption === 'pickup' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-900">
                    Customer Counter Pickup
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Collect from Domalakunta store
                  </p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-[10px] bg-emerald-100 text-emerald-800 font-bold rounded-full">
                    NO DELIVERY CHARGE
                  </span>
                </div>
              </div>
              <span className="font-black text-sm text-emerald-600 shrink-0">₹0 (FREE)</span>
            </button>

            <button
              type="button"
              onClick={() => setDeliveryOption('delivery')}
              className={`p-4 rounded-2xl border text-left transition flex items-start justify-between gap-3 ${
                deliveryOption === 'delivery'
                  ? 'border-brand-600 bg-brand-50/70 ring-2 ring-brand-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  deliveryOption === 'delivery' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <Bike className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-900">
                    Home Delivery
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Delivered to your address
                  </p>
                  {isFreeDeliveryEligible ? (
                    <span className="inline-block mt-1 px-2 py-0.5 text-[10px] bg-emerald-100 text-emerald-800 font-bold rounded-full">
                      FREE DELIVERY (ORDER &gt; ₹1000)
                    </span>
                  ) : (
                    <span className="inline-block mt-1 px-2 py-0.5 text-[10px] bg-sky-100 text-sky-800 font-bold rounded-full">
                      FLAT ₹40 (FREE ABOVE ₹1,000)
                    </span>
                  )}
                </div>
              </div>
              <span className={`font-black text-sm shrink-0 ${isFreeDeliveryEligible ? 'text-emerald-600' : 'text-slate-900'}`}>
                {isFreeDeliveryEligible ? '₹0 (FREE)' : '+₹40'}
              </span>
            </button>
          </div>
        </div>

        {/* Customer Contact & Pickup Details */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900">
                Customer Information
              </h2>
              <p className="text-xs text-slate-400">
                {deliveryOption === 'delivery'
                  ? 'Used for delivery address confirmation and delivery contact'
                  : 'Used to identify your packed items at the store counter'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Mobile Number (for SMS & Calls)
              </label>
              <input
                type="text"
                value={customerMobile}
                onChange={(e) => setCustomerMobile(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                {deliveryOption === 'delivery' ? 'Delivery Address * (House No, Street, Landmark)' : 'Your Address / Landmark (Optional)'}
              </label>
              <input
                type="text"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                required={deliveryOption === 'delivery'}
                placeholder={deliveryOption === 'delivery' ? 'Enter full delivery address in Domalakunta / nearby' : 'House No, Colony or Street name'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Google Location / GPS Pinpoint Section */}
            <div className="sm:col-span-2 bg-emerald-50/40 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 uppercase tracking-wider">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                    Google Location / Pinpoint (Maps GPS)
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Pin your exact house location so the store delivery person can navigate via Google Maps
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={detectingLocation}
                  className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition shrink-0 disabled:opacity-50"
                >
                  {detectingLocation ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Detecting GPS...
                    </>
                  ) : (
                    <>
                      <Navigation className="w-3.5 h-3.5" />
                      Use My Current Location
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={googleLocation}
                  onChange={(e) => setGoogleLocation(e.target.value)}
                  placeholder="Click 'Use My Current Location' above or paste Google Maps link"
                  className="w-full bg-white border border-emerald-200 rounded-xl p-3 pl-9 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <MapPin className="w-4 h-4 text-emerald-500 absolute left-3 top-3.5" />
              </div>

              {locationSuccess && (
                <div className="text-[11px] text-emerald-700 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  {locationSuccess}
                </div>
              )}

              {googleLocation && (
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={googleLocation.startsWith('http') ? googleLocation : `https://www.google.com/maps?q=${encodeURIComponent(googleLocation)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:underline bg-white border border-emerald-200 px-3 py-1.5 rounded-lg shadow-sm transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                    Open & Verify Pin in Google Maps ↗
                  </a>
                </div>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                {deliveryOption === 'delivery' ? 'Delivery Instructions / Notes' : 'Optional Pickup Instructions / Packing Note'}
              </label>
              <input
                type="text"
                value={pickupNotes}
                onChange={(e) => setPickupNotes(e.target.value)}
                placeholder={deliveryOption === 'delivery' ? 'E.g., Call before arrival, deliver after 5 PM' : 'E.g., Pack atta in separate bag, will collect by 5:30 PM'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Order Items Review */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900">Items in Order</h2>
              <p className="text-xs text-slate-400">
                {cartItems.length} item{cartItems.length > 1 ? 's' : ''} to be packed by the store
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {cartItems.map((item) => (
              <div key={item.key} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-12 h-12 rounded-xl object-contain p-1 bg-white border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-slate-900 truncate">
                      {item.name}
                    </h4>
                    <span className="text-xs text-slate-500">
                      Unit: <span className="font-semibold text-slate-700">{item.unit}</span> × {item.quantity}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-black text-sm text-slate-900">
                    ₹{item.price * item.quantity}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    (₹{item.price} each)
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal</span>
              <span className="font-bold text-slate-900">₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-600">
              <span>Delivery Charge</span>
              {deliveryOption === 'delivery' ? (
                deliveryFee === 0 ? (
                  <span className="font-bold text-emerald-600">FREE (Order &gt; ₹1,000)</span>
                ) : (
                  <span className="font-bold text-slate-900">+₹40 (Home Delivery)</span>
                )
              ) : (
                <span className="font-bold text-emerald-600">FREE (Customer Pickup - ₹0)</span>
              )}
            </div>
            <div className="flex justify-between items-baseline pt-3 border-t border-slate-200">
              <span className="text-base font-black text-slate-900">Grand Total</span>
              <span className="text-2xl font-black text-brand-700">₹{grandTotal}</span>
            </div>
          </div>
        </div>

        {/* Order Type & Payment Method */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-start gap-3">
            {deliveryOption === 'delivery' ? (
              <Bike className="w-6 h-6 text-brand-600 shrink-0 mt-0.5" />
            ) : (
              <Store className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-2 w-full">
              <h3 className="font-bold text-sm sm:text-base text-slate-900">
                {deliveryOption === 'delivery'
                  ? deliveryFee === 0
                    ? 'Order Type: Home Delivery (🎉 FREE Delivery on Orders > ₹1,000)'
                    : 'Order Type: Home Delivery (+₹40 Delivery Charge)'
                  : 'Order Type: In-Store Counter Pickup (No Delivery Charge - FREE)'}
              </h3>
              <div className="bg-white/80 p-3 rounded-xl border border-amber-200/60 text-xs text-slate-700 space-y-1">
                {deliveryOption === 'delivery' ? (
                  <>
                    <p><span className="font-bold text-slate-900">🛵 Delivery To:</span> {customerAddress || 'Your home address'}</p>
                    <p><span className="font-bold text-slate-900">⏰ Delivery Window:</span> 7:00 AM to 10:00 PM</p>
                    <p><span className="font-bold text-slate-900">📞 Store Helpline:</span> +91 95730 45430</p>
                  </>
                ) : (
                  <>
                    <p><span className="font-bold text-slate-900">📍 Store Location:</span> Domalakunta, near govt school, Telangana</p>
                    <p><span className="font-bold text-slate-900">⏰ Store Timings:</span> 7:00 AM to 10:00 PM (Daily)</p>
                    <p><span className="font-bold text-slate-900">📞 Store Help:</span> +91 95730 45430</p>
                  </>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Payment Method:{' '}
                <span className="font-bold text-slate-800">
                  {deliveryOption === 'delivery' ? 'Cash / UPI on Delivery' : 'Cash on Pickup / Store Counter UPI'}
                </span>
                . You will pay when you inspect your goods.
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 px-6 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 text-white font-black text-base rounded-2xl shadow-xl shadow-brand-500/20 transition flex items-center justify-center gap-2"
        >
          {loading ? (
            'Creating Your Order...'
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" /> Confirm & Place Order (₹{grandTotal})
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default Checkout;
