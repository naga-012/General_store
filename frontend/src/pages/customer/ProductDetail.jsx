import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShoppingCart,
  Check,
  ShieldCheck,
  Clock,
  Plus,
  Minus,
  Sparkles,
  Package,
} from 'lucide-react';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedUnitIndex, setSelectedUnitIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        if (res.data.success) {
          setProduct(res.data.product);
        }
      } catch (err) {
        console.error('Failed to load product:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-pulse">
          <div className="h-96 bg-slate-100 rounded-3xl" />
          <div className="space-y-4">
            <div className="h-8 bg-slate-100 rounded-xl w-3/4" />
            <div className="h-4 bg-slate-100 rounded-xl w-1/4" />
            <div className="h-24 bg-slate-100 rounded-xl" />
            <div className="h-12 bg-slate-100 rounded-xl w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 px-4">
        <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Product Not Found</h2>
        <p className="text-sm text-slate-500 mt-2">
          This product might have been moved or removed from our inventory.
        </p>
        <button
          onClick={() => navigate('/products')}
          className="mt-6 px-6 py-2.5 bg-brand-600 text-white font-bold text-xs rounded-xl shadow-sm"
        >
          Back to Store Catalog
        </button>
      </div>
    );
  }

  const variants = product.variants || [];
  const currentVariant = variants[selectedUnitIndex] || variants[0];
  const isOutOfStock = !currentVariant || currentVariant.stock <= 0;
  const isLowStock = currentVariant && currentVariant.stock > 0 && currentVariant.stock <= (product.lowStockThreshold || 10);

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product, currentVariant, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-brand-700 mb-6 group transition"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition" /> Back to Products
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-sm">
        {/* Product Image Column */}
        <div className="space-y-4">
          <div className="aspect-square rounded-3xl overflow-hidden bg-slate-50 border border-slate-100 relative shadow-inner">
            <img
              src={product.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80'}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80';
              }}
            />
            {/* Status pill */}
            <div className="absolute top-4 left-4">
              {isOutOfStock ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-sm">
                  Out of Stock
                </span>
              ) : isLowStock ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-sm">
                  ⚠️ Low Stock (Only {currentVariant.stock} available)
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm">
                  ✓ Fresh Stock In Store
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Product Info Column */}
        <div className="flex flex-col justify-between space-y-6">
          <div>
            <span className="px-3 py-1 bg-brand-50 text-brand-700 font-bold text-xs uppercase tracking-wider rounded-full">
              {product.category?.name || 'Kirana'}
            </span>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-3 tracking-tight">
              {product.name}
            </h1>

            {/* Description */}
            <p className="text-slate-600 text-sm mt-3 leading-relaxed">
              {product.description || 'Authentic quality product sourced directly for our neighborhood store.'}
            </p>

            {/* Dynamic Unit Selector */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-3">
                Select Size / Unit Variation:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {variants.map((v, idx) => {
                  const selected = selectedUnitIndex === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedUnitIndex(idx);
                        setQuantity(1);
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        selected
                          ? 'border-brand-600 bg-brand-50/60 ring-2 ring-brand-600 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="text-xs font-extrabold text-slate-800">
                        {v.unit}
                      </div>
                      <div className="text-sm font-black text-brand-700 mt-0.5">
                        ₹{v.price}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        Stock: {v.stock > 0 ? `${v.stock} in shop` : 'Sold out'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Price Display & Stepper */}
            <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs text-slate-400 block font-medium">Total for item:</span>
                <div className="text-2xl sm:text-3xl font-black text-slate-900">
                  ₹{currentVariant ? currentVariant.price * quantity : 0}
                  <span className="text-xs text-slate-500 font-normal ml-2">
                    (₹{currentVariant?.price} × {quantity})
                  </span>
                </div>
              </div>

              {!isOutOfStock && (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-600">Quantity:</span>
                  <div className="flex items-center bg-white rounded-xl p-1 border border-slate-300 shadow-sm">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-8 h-8 flex items-center justify-center text-slate-700 hover:bg-slate-100 rounded-lg transition"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center font-bold text-sm text-slate-900">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(currentVariant.stock, q + 1))}
                      className="w-8 h-8 flex items-center justify-center text-slate-700 hover:bg-slate-100 rounded-lg transition"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleAddToCart}
              className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-all ${
                isOutOfStock
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : isAdded
                  ? 'bg-emerald-600 text-white shadow-emerald-500/30 ring-2 ring-emerald-500'
                  : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/20 active:scale-[0.99]'
              }`}
            >
              {isOutOfStock ? (
                'Currently Out of Stock'
              ) : isAdded ? (
                <>
                  <Check className="w-5 h-5" /> Added to Cart!
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" /> Add {quantity} to Shopping Cart
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-600" /> Fast in-store counter packing
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-600" /> Direct inspection on pickup
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
