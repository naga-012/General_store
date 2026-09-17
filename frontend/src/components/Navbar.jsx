import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Store,
  ShoppingCart,
  Search,
  User,
  LogOut,
  Package,
  ShieldCheck,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import NotificationDropdown from './NotificationDropdown';
import api from '../services/api';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { totalItems } = useCart();
  const [settings, setSettings] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    api.get('/admin/settings').then((res) => {
      if (res.data.success) {
        setSettings(res.data.settings);
      }
    }).catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?keyword=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/products');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm transition-all">
      {/* Top Banner with Shop Info */}
      <div className="bg-brand-900 text-brand-100 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 font-semibold">
              🏪 {settings?.shopName || 'Manikanta Supermarket'}
            </span>
            <span className="hidden sm:inline text-brand-300">|</span>
            <span className="hidden sm:inline">
              ⏰ Daily Timings: {settings?.openingTime || '07:00 AM'} - {settings?.closingTime || '10:00 PM'}
            </span>
            <span className="hidden lg:inline text-brand-300">|</span>
            <span className="hidden lg:inline text-brand-200">
              📍 {settings?.address || 'Domalakunta, near govt school'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span>📞 <a href="tel:+919573045430" className="hover:underline font-semibold">{settings?.phone || '+91 95730 45430'}</a></span>
            <span className="text-amber-400 font-medium hidden xs:inline">⚡ Counter Pickup</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <img
              src="/logo.png"
              alt="Manikanta Supermarket"
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-contain bg-white p-0.5 border border-slate-200 shadow-sm group-hover:scale-105 transition-transform"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=100';
              }}
            />
            <div>
              <span className="text-base sm:text-xl font-black tracking-tight text-slate-900 flex items-center gap-1">
                Manikanta<span className="text-brand-600">Supermarket</span>
              </span>
              <p className="text-[10px] text-slate-500 hidden sm:block -mt-1 font-medium">
                Curry Essentials & Telangana Dals
              </p>
            </div>
          </Link>

          {/* Search bar */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-lg relative items-center"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rice, dal, cooking oil, biscuits, spices..."
              className="w-full bg-slate-100/90 border border-slate-200 rounded-full py-2 pl-10 pr-24 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
            <button
              type="submit"
              className="absolute right-1.5 px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded-full text-xs font-semibold shadow-sm transition"
            >
              Search
            </button>
          </form>

          {/* Right Navigation & Actions */}
          <div className="flex items-center gap-1 sm:gap-3">
            {/* Store Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 mr-2 text-sm font-medium text-slate-600">
              <Link
                to="/"
                className={`px-3 py-1.5 rounded-lg transition ${
                  location.pathname === '/' ? 'text-brand-600 bg-brand-50 font-semibold' : 'hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Home
              </Link>
              <Link
                to="/products"
                className={`px-3 py-1.5 rounded-lg transition ${
                  location.pathname === '/products' ? 'text-brand-600 bg-brand-50 font-semibold' : 'hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Products
              </Link>
              {isAuthenticated && !isAdmin && (
                <Link
                  to="/orders"
                  className={`px-3 py-1.5 rounded-lg transition ${
                    location.pathname === '/orders' ? 'text-brand-600 bg-brand-50 font-semibold' : 'hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  My Orders
                </Link>
              )}
            </nav>

            {/* Notification Bell */}
            {isAuthenticated && <NotificationDropdown />}

            {/* Shopping Cart Button */}
            <Link
              to="/cart"
              className="relative p-2 rounded-xl text-slate-700 hover:text-brand-600 hover:bg-slate-100 transition flex items-center gap-1.5"
              title="View Cart"
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-5 h-5 px-1 text-[11px] font-black text-white bg-brand-600 rounded-full shadow-sm">
                    {totalItems}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline font-semibold text-xs text-slate-700">
                Cart
              </span>
            </Link>



            {/* User Profile / Auth */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition text-slate-700"
                >
                  <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-xs border border-brand-200">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="hidden xl:inline text-xs font-semibold max-w-[100px] truncate text-slate-800">
                    {user?.name?.split(' ')[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden xl:block" />
                </button>

                {userMenuOpen && (
                  <div
                    onMouseLeave={() => setUserMenuOpen(false)}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-100"
                  >
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {user?.name}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {user?.email}
                      </p>
                    </div>

                    <Link
                      to="/orders"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      <Package className="w-4 h-4 text-brand-600" />
                      My Orders
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      <User className="w-4 h-4 text-brand-600" />
                      My Profile
                    </Link>

                    <div className="border-t border-slate-100 mt-1">
                      <button
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                          navigate('/');
                        }}
                        className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-brand-600 hover:bg-slate-100 transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile search bar */}
        <div className="md:hidden pb-3 pt-1">
          <form onSubmit={handleSearch} className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search groceries..."
              className="w-full bg-slate-100 border border-slate-200 rounded-xl py-2 pl-9 pr-16 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3" />
            <button
              type="submit"
              className="absolute right-1 px-2.5 py-1 bg-brand-600 text-white rounded-lg text-xs font-semibold"
            >
              Go
            </button>
          </form>
        </div>

        {/* Mobile menu drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-slate-100 space-y-1">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Home
            </Link>
            <Link
              to="/products"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Browse All Products
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  to="/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  My Orders
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  My Profile
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
