import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Check, Plus, Minus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getImageUrl } from '../services/api';

const ProductCard = ({ product }) => {
  const { cartItems, addToCart, updateQuantity } = useCart();
  const variants = product.variants && product.variants.length > 0
    ? product.variants
    : [{ unit: 'Standard', price: 0, stock: 0 }];

  const [selectedUnitIndex, setSelectedUnitIndex] = useState(0);
  const currentVariant = variants[selectedUnitIndex] || variants[0];
  const itemKey = `${product._id}-${currentVariant.unit}`;

  // Find if this specific product variant is already in cart
  const existingCartItem = cartItems.find((item) => item.key === itemKey);
  const cartQty = existingCartItem ? existingCartItem.quantity : 0;

  const isOutOfStock = currentVariant.stock <= 0;
  const isLowStock = currentVariant.stock > 0 && currentVariant.stock <= (product.lowStockThreshold || 10);

  const handleAddFirstTime = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    addToCart(product, currentVariant, 1);
  };

  const handleIncrement = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (cartQty < currentVariant.stock) {
      updateQuantity(itemKey, cartQty + 1);
    }
  };

  const handleDecrement = (e) => {
    e.preventDefault();
    e.stopPropagation();
    updateQuantity(itemKey, cartQty - 1);
  };

  const handleUnitChange = (index, e) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedUnitIndex(index);
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden relative group">
      {/* Top badges: Stock indicator */}
      <div className="absolute top-2 left-2 z-10">
        {isOutOfStock ? (
          <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200 shadow-sm">
            Out of Stock
          </span>
        ) : isLowStock ? (
          <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">
            Low ({currentVariant.stock})
          </span>
        ) : null}
      </div>

      <div>
        {/* Product Image */}
        <Link
          to={`/products/${product._id}`}
          className="block relative aspect-square overflow-hidden bg-white p-2.5 border-b border-slate-100 flex items-center justify-center"
        >
          <img
            src={getImageUrl(product.image)}
            alt={product.name}
            className="w-full h-full object-contain group-hover:scale-105 transition duration-300"
            loading="lazy"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=60';
            }}
          />
        </Link>

        {/* Content */}
        <div className="p-3 sm:p-4">
          <span className="text-[10px] font-bold tracking-wider text-brand-700 uppercase block truncate">
            {product.category?.name || 'Grocery'}
          </span>

          <Link to={`/products/${product._id}`}>
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm mt-0.5 line-clamp-2 leading-tight group-hover:text-brand-700 transition">
              {product.name}
            </h3>
          </Link>

          {/* Dynamic Unit Selector */}
          <div className="mt-2">
            <div className="flex flex-wrap gap-1">
              {variants.map((variant, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => handleUnitChange(idx, e)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-bold transition ${
                    selectedUnitIndex === idx
                      ? 'bg-brand-600 text-white shadow-sm ring-1 ring-brand-600'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {variant.unit}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer: Price + Blinkit-style ADD/Stepper Button */}
      <div className="p-3 sm:p-4 pt-0 border-t border-slate-50 mt-1">
        <div className="flex items-center justify-between gap-2">
          {/* Price */}
          <div>
            <div className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none">
              ₹{currentVariant.price}
            </div>
            <span className="text-[10px] text-slate-400">/{currentVariant.unit}</span>
          </div>

          {/* ADD / Quantity Stepper Button */}
          {isOutOfStock ? (
            <span className="px-2.5 py-1 text-[11px] font-bold text-slate-400 bg-slate-100 rounded-xl">
              Unavailable
            </span>
          ) : cartQty > 0 ? (
            /* Active Stepper on Card */
            <div className="flex items-center bg-brand-600 text-white rounded-xl shadow-md p-0.5">
              <button
                type="button"
                onClick={handleDecrement}
                className="w-7 h-7 flex items-center justify-center hover:bg-brand-700 rounded-lg transition"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-6 text-center text-xs font-black">
                {cartQty}
              </span>
              <button
                type="button"
                onClick={handleIncrement}
                className="w-7 h-7 flex items-center justify-center hover:bg-brand-700 rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            /* One-Tap ADD Button */
            <button
              type="button"
              onClick={handleAddFirstTime}
              className="px-3.5 py-1.5 bg-brand-50 hover:bg-brand-600 text-brand-700 hover:text-white border border-brand-300 hover:border-brand-600 font-extrabold text-xs rounded-xl shadow-sm transition active:scale-95 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> ADD
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
