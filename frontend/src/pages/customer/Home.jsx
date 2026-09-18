import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
  ShoppingBag,
  Store,
  ChevronRight,
} from 'lucide-react';
import api, { getImageUrl } from '../../services/api';
import ProductCard from '../../components/ProductCard';
import { useSocket } from '../../context/SocketContext';

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [settings, setSettings] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { productEvent } = useSocket() || {};
  const navigate = useNavigate();

  const fetchHomeData = async () => {
    try {
      const [catRes, prodRes, settingsRes] = await Promise.allSettled([
        api.get('/categories'),
        api.get('/products?includeInactive=false'),
        api.get('/admin/settings'),
      ]);

      if (catRes.status === 'fulfilled' && catRes.value.data.success) {
        setCategories(catRes.value.data.categories);
      }
      if (prodRes.status === 'fulfilled' && prodRes.value.data.success) {
        const prods = prodRes.value.data.products;
        setFeaturedProducts(prods);
      }
      if (settingsRes.status === 'fulfilled' && settingsRes.value.data.success) {
        setSettings(settingsRes.value.data.settings);
      }
    } catch (err) {
      console.error('Failed to load home data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

  useEffect(() => {
    if (productEvent) {
      fetchHomeData();
    }
  }, [productEvent]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?keyword=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Banner */}
      <section className="hidden md:block relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-900 via-brand-800 to-slate-900 text-white shadow-2xl mx-4 sm:mx-0 mt-4 sm:mt-6 p-6 sm:p-12">
        <div className="absolute -right-16 -top-16 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-3 mb-4">
            <img
              src="/logo.png"
              alt="Manikanta Supermarket"
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-contain bg-white p-1 border-2 border-amber-400/50 shadow-xl"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Telangana Curry Cooking Essentials & All Dals
            </div>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Welcome to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-emerald-400">
              {settings?.shopName || 'Manikanta Supermarket'}
            </span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
            {settings?.tagline ||
              'Order farm-fresh Toor Dal, Moong Dal, Chana Dal, pure cooking oils, Warangal chilli powder, whole tadka spices, and curry essentials at Telangana wholesale rates!'}
          </p>

          {/* Quick Search in Hero */}
          <form
            onSubmit={handleSearch}
            className="mt-8 flex flex-col sm:flex-row gap-2 max-w-xl bg-white/10 p-1.5 rounded-2xl backdrop-blur-md border border-white/20"
          >
            <div className="relative flex-1 flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search basmati rice, toor dal, sunflower oil, salt..."
                className="w-full bg-white text-slate-900 placeholder-slate-400 rounded-xl py-3 pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-inner"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
            >
              Search <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Store USPs */}
          <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-medium text-slate-300">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Packed in 15 Minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Certified Accurate Weight</span>
            </div>
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Pay Cash or UPI at Counter</span>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Horizontal Scroll / Grid (Blinkit / Zepto App style) */}
      <section className="px-4 sm:px-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
              Explore Categories
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500">
              Tap to browse by grocery department
            </p>
          </div>
          <Link
            to="/products"
            className="text-xs font-bold text-brand-700 hover:text-brand-800 flex items-center gap-1 group"
          >
            All Categories <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
          </Link>
        </div>

        {/* Horizontal scrolling on mobile, grid on desktop */}
        <div className="flex sm:grid sm:grid-cols-4 lg:grid-cols-8 gap-3 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          {categories.map((cat) => (
            <Link
              key={cat._id}
              to={`/products?category=${encodeURIComponent(cat.slug || cat.name)}`}
              className="group bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-200/80 hover:border-brand-400 shadow-sm hover:shadow-md transition text-center flex flex-col items-center justify-between shrink-0 w-24 sm:w-auto"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-slate-100 mb-2 group-hover:scale-105 transition duration-300">
                <img
                  src={getImageUrl(cat.image, 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=60')}
                  alt={cat.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <span className="text-[11px] font-bold text-slate-800 group-hover:text-brand-700 line-clamp-2 leading-tight">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured / Daily Essentials (2 Columns on Mobile!) */}
      <section className="px-4 sm:px-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
              Daily Supermarket Essentials
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500">
              Kitchen staples with multi-weight options
            </p>
          </div>
          <Link
            to="/products"
            className="text-xs font-bold text-brand-700 hover:text-brand-800 flex items-center gap-1 group"
          >
            See All <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-slate-100 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {featuredProducts.slice(0, 8).map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Counter Pickup Workflow Steps Banner */}
      <section className="bg-amber-50/80 border border-amber-200/80 rounded-3xl p-6 sm:p-10 mx-4 sm:mx-0">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
            How Counter Ordering Works
          </span>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-3">
            Skip the Store Line in 4 Simple Steps
          </h3>
          <p className="text-sm text-slate-600 mt-2 max-w-xl mx-auto">
            Order your household list on your mobile before coming. We weigh and pack everything so it's ready the moment you arrive.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mt-8 text-left">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-amber-100">
              <span className="w-8 h-8 rounded-full bg-brand-600 text-white font-black text-sm flex items-center justify-center mb-3">
                1
              </span>
              <h4 className="font-bold text-sm text-slate-800">Choose Units</h4>
              <p className="text-xs text-slate-500 mt-1">
                Select 250g, 500g, 1kg, 5kg or packets for each grocery item.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-amber-100">
              <span className="w-8 h-8 rounded-full bg-brand-600 text-white font-black text-sm flex items-center justify-center mb-3">
                2
              </span>
              <h4 className="font-bold text-sm text-slate-800">Place Order</h4>
              <p className="text-xs text-slate-500 mt-1">
                Instant confirmation with unique Order ID sent to shopkeeper.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-amber-100">
              <span className="w-8 h-8 rounded-full bg-brand-600 text-white font-black text-sm flex items-center justify-center mb-3">
                3
              </span>
              <h4 className="font-bold text-sm text-slate-800">Shop Packs It</h4>
              <p className="text-xs text-slate-500 mt-1">
                Owner accepts and prepares your order. You get notified when packed.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-amber-100">
              <span className="w-8 h-8 rounded-full bg-brand-600 text-white font-black text-sm flex items-center justify-center mb-3">
                4
              </span>
              <h4 className="font-bold text-sm text-slate-800">Pickup & Pay</h4>
              <p className="text-xs text-slate-500 mt-1">
                Collect from the store counter in 2 mins. Pay with Cash or UPI.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

