import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Store,
  ShoppingCart,
  Search,
  User,
  LogOut,
  Package,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import NotificationDropdown from './NotificationDropdown';
import api from '../services/api';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm transition-all w-full max-w-full overflow-x-hidden">
      {/* Top Banner with Shop Info */}
      <div className="bg-brand-900 text-brand-100 text-[11px] sm:text-xs py-1.5 px-3 sm:px-4 w-full overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-hidden">
          <div className="flex items-center gap-2 truncate">
            <span className="inline-flex items-center gap-1 font-semibold truncate text-[11px] sm:text-xs">
              🏪 {settings?.shopName || 'Manikanta Supermarket'}
            </span>
            <span className="hidden sm:inline text-brand-300">|</span>
            <span className="hidden sm:inline">
              ⏰ Daily: {settings?.openingTime || '07:00 AM'} - {settings?.closingTime || '10:00 PM'}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0 text-[11px] sm:text-xs">
            <a href="tel:+919573045430" className="hover:underline font-semibold flex items-center gap-1">
              📞 {settings?.phone || '+91 95730 45430'}
            </a>
            <span className="text-amber-300 font-bold hidden md:inline">| 🚚 Free Delivery above ₹1,000</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-1 sm:gap-4 w-full">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-1.5 sm:gap-2.5 shrink min-w-0 group">
            <img
              src="/logo.png"
              alt="Manikanta Supermarket"
              className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl object-contain bg-white p-0.5 border border-slate-200 shadow-sm group-hover:scale-105 transition-transform shrink-0"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=100';
              }}
            />
            <div className="min-w-0 flex-shrink truncate">
              <span className="text-xs sm:text-lg font-black tracking-tight text-slate-900 flex items-center gap-0.5 truncate">
                Manikanta<span className="text-brand-600">Supermarket</span>
              </span>
              <p className="text-[9px] text-slate-500 hidden sm:block -mt-1 font-medium truncate">
                Curry Essentials & Telangana Dals
              </p>
            </div>
          </Link>

          {/* Search bar (Desktop) */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-lg relative items-center mx-4"
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
          <div className="flex items-center gap-1 sm:gap-2.5 shrink-0 ml-auto">
            {/* Store Navigation Links (Desktop) */}
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
              {isAuthenticated && (
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
              className="relative p-1.5 sm:p-2 rounded-lg text-slate-700 hover:text-brand-600 hover:bg-slate-100 transition flex items-center shrink-0"
              title="View Cart"
            >
              <div className="relative">
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-4 h-4 px-1 text-[9px] font-black text-white bg-brand-600 rounded-full shadow-sm">
                    {totalItems}
                  </span>
                )}
              </div>
            </Link>

            {/* User Profile / Auth */}
            {isAuthenticated ? (
              <div className="relative shrink-0">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1 p-1 sm:p-1.5 rounded-xl hover:bg-slate-100 transition text-slate-700"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-xs border border-brand-200">
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
              <div className="flex items-center gap-1 shrink-0">
                <Link
                  to="/login"
                  className="px-2 py-1 rounded-lg text-[11px] sm:text-xs font-bold text-slate-700 hover:text-brand-600 hover:bg-slate-100 transition whitespace-nowrap"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-2 py-1 rounded-lg text-[11px] sm:text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition whitespace-nowrap"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile menu toggle (three lines) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition shrink-0"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile search bar */}
        <div className="md:hidden pb-2.5 pt-0.5">
          <form onSubmit={handleSearch} className="relative flex items-center w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search groceries..."
              className="w-full bg-slate-100 border border-slate-200 rounded-xl py-1.5 pl-8 pr-12 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5" />
            <button
              type="submit"
              className="absolute right-1 px-2.5 py-0.5 bg-brand-600 text-white rounded-lg text-xs font-semibold"
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
