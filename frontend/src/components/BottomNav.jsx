import React from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, ShoppingCart, Package, User, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const BottomNav = () => {
  const { totalItems, grandTotal, deliveryOption } = useCart();
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  const isCartPage = location.pathname === '/cart' || location.pathname === '/checkout';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      {/* Floating Mini Cart Bar (Blinkit/Zepto style) */}
      {!isCartPage && totalItems > 0 && (
        <div className="max-w-md mx-auto px-3 pb-2 animate-in slide-in-from-bottom duration-200">
          <Link
            to="/cart"
            className="w-full bg-brand-700 hover:bg-brand-800 text-white p-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 border border-brand-500/40 ring-4 ring-brand-700/20"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold text-sm">
                <ShoppingCart className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-xs font-black tracking-wide">
                  {totalItems} {totalItems === 1 ? 'ITEM' : 'ITEMS'} • ₹{grandTotal}
                </div>
                <span className="text-[10px] text-brand-200 block -mt-0.5 font-medium">
                  {deliveryOption === 'delivery' ? 'Home Delivery (+₹40)' : 'Counter Pickup (FREE)'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-black bg-white text-brand-900 px-3.5 py-1.5 rounded-xl shadow-sm">
              View Cart <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>
      )}

      {/* Main Bottom Nav Bar */}
      <nav className="bg-white/95 backdrop-blur-lg border-t border-slate-200 px-2 py-1 shadow-lg pb-safe">
        <div className="max-w-md mx-auto flex items-center justify-around">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex flex-col items-center py-1.5 px-3 rounded-xl transition ${
                isActive ? 'text-brand-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Home</span>
          </NavLink>

          <NavLink
            to="/products"
            className={({ isActive }) =>
              `flex flex-col items-center py-1.5 px-3 rounded-xl transition ${
                isActive ? 'text-brand-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <LayoutGrid className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Categories</span>
          </NavLink>

          <NavLink
            to="/cart"
            className={({ isActive }) =>
              `flex flex-col items-center py-1.5 px-3 rounded-xl transition relative ${
                isActive ? 'text-brand-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-brand-600 text-white rounded-full text-[10px] font-black w-4 h-4 flex items-center justify-center shadow-sm">
                  {totalItems}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5">Cart</span>
          </NavLink>

          <NavLink
            to={isAuthenticated ? '/orders' : '/login'}
            className={({ isActive }) =>
              `flex flex-col items-center py-1.5 px-3 rounded-xl transition ${
                isActive ? 'text-brand-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <Package className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Orders</span>
          </NavLink>

          <NavLink
            to={isAuthenticated ? '/profile' : '/login'}
            className={({ isActive }) =>
              `flex flex-col items-center py-1.5 px-3 rounded-xl transition ${
                isActive ? 'text-brand-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Profile</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
};

export default BottomNav;
