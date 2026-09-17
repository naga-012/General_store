import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, AlertCircle, Store, Clock, Phone, MapPin } from 'lucide-react';
import api from '../../services/api';

const AdminSettings = () => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [shopName, setShopName] = useState('');
  const [tagline, setTagline] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [openingTime, setOpeningTime] = useState('07:30 AM');
  const [closingTime, setClosingTime] = useState('10:00 PM');
  const [pickupInstructions, setPickupInstructions] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState(50);

  useEffect(() => {
    api.get('/admin/settings').then((res) => {
      if (res.data.success && res.data.settings) {
        const s = res.data.settings;
        setShopName(s.shopName || '');
        setTagline(s.tagline || '');
        setOwnerName(s.ownerName || '');
        setPhone(s.phone || '');
        setEmail(s.email || '');
        setAddress(s.address || '');
        setOpeningTime(s.openingTime || '07:30 AM');
        setClosingTime(s.closingTime || '10:00 PM');
        setPickupInstructions(s.pickupInstructions || '');
        setMinOrderAmount(s.minOrderAmount || 50);
      }
    }).catch((err) => {
      console.error('Failed to load settings:', err);
    }).finally(() => {
      setInitialLoading(false);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    setLoading(true);

    try {
      const res = await api.put('/admin/settings', {
        shopName,
        tagline,
        ownerName,
        phone,
        email,
        address,
        openingTime,
        closingTime,
        pickupInstructions,
        minOrderAmount: Number(minOrderAmount),
      });

      if (res.data.success) {
        setSuccess('Shop settings saved successfully! Storefront has been updated.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update store settings');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center text-slate-500 animate-pulse">
        Loading store settings...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Store Configuration & Counter Timings
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Configure shop name, owner contacts, business hours, and counter pickup guidelines
        </p>
      </div>

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          {success}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs sm:text-sm font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Store Profile */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5">
          <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <Store className="w-4 h-4 text-amber-400" /> Store Branding
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Shop Name
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Owner / Shopkeeper Name
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Store Tagline / Subtitle
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Daily Fresh Essentials & Groceries at Best Prices"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>
        </div>

        {/* Operating Timings & Pickup Instructions */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5">
          <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" /> Hours & Counter Pickup
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Morning Opening Time
              </label>
              <input
                type="text"
                value={openingTime}
                onChange={(e) => setOpeningTime(e.target.value)}
                placeholder="07:30 AM"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Night Closing Time
              </label>
              <input
                type="text"
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
                placeholder="10:00 PM"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Counter Pickup Instructions for Customers
              </label>
              <textarea
                value={pickupInstructions}
                onChange={(e) => setPickupInstructions(e.target.value)}
                rows={2}
                placeholder="Instructions shown to customers during checkout..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Minimum Order Value (₹)
              </label>
              <input
                type="number"
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(e.target.value)}
                min="0"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5">
          <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-400" /> Contact & Location
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Shop Phone / WhatsApp
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Store Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Physical Shop Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Shop No., Market name, Landmark, City"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl text-sm shadow-xl shadow-amber-500/20 transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving Settings...' : 'Save Store Settings'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;
