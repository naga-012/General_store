import React from 'react';
import { Link } from 'react-router-dom';
import { Store, MapPin, Phone, Mail, Clock, ShieldCheck, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-24 md:pb-12 border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <img
                src="/logo.png"
                alt="Manikanta Supermarket"
                className="w-10 h-10 rounded-xl object-contain bg-white p-0.5 border border-slate-700 shadow-lg shadow-brand-500/20"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=100';
                }}
              />
              <span className="text-xl font-black text-white tracking-tight">
                Manikanta<span className="text-brand-400">Supermarket</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Your premier curry cooking & dals supermarket in Telangana. Authentic dals, cold-pressed oils, pure Guntur chillies, whole tadka spices, and kitchen essentials.
            </p>
            <div className="inline-flex items-center gap-2 text-xs text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-xl border border-amber-400/20">
              <ShieldCheck className="w-4 h-4" /> 100% Quality & Accurate Weight Guaranteed
            </div>
          </div>

          {/* Store Hours & Pickup Info */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">
              Store Timings & Pickup
            </h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-slate-200 font-medium">Monday - Sunday</p>
                  <p className="text-xs">07:00 AM to 10:00 PM</p>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-slate-200 font-medium">Express Counter Pickup</p>
                  <p className="text-xs">Pack items in advance, collect at counter in 2 mins</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">
              Customer Links
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-brand-400 transition">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-brand-400 transition">
                  Browse All Groceries
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-brand-400 transition">
                  My Shopping Cart
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-brand-400 transition">
                  Track Order Status
                </Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-brand-400 transition">
                  Customer Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">
              Store Address & Help
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-brand-400 shrink-0 mt-1" />
                <span className="text-slate-200 font-medium">Domalakunta, near govt school, Telangana</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-400 shrink-0" />
                <a href="tel:+919573045430" className="hover:text-brand-400 text-slate-200 font-bold transition">+91 95730 45430</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-400 shrink-0" />
                <span>support@manikantasupermarket.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© 2026 Manikanta Supermarket. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for Manikanta Supermarket Customers
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
