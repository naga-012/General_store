import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Boxes,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Filter,
} from 'lucide-react';
import api from '../../services/api';
import ConfirmationModal from '../../components/ConfirmationModal';

const AdminProducts = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [lowStockOnly, setLowStockOnly] = useState(searchParams.get('filter') === 'low-stock');

  // Confirmation modal
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    productId: null,
    productName: '',
  });

  const fetchProducts = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/products?includeInactive=true'),
        api.get('/categories'),
      ]);

      if (prodRes.data.success) setProducts(prodRes.data.products);
      if (catRes.data.success) setCategories(catRes.data.categories);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleToggleStatus = async (id) => {
    try {
      const res = await api.patch(`/products/${id}/toggle-status`);
      if (res.data.success) {
        setProducts((prev) =>
          prev.map((p) => (p._id === id ? res.data.product : p))
        );
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.productId) return;
    try {
      const res = await api.delete(`/products/${deleteModal.productId}`);
      if (res.data.success) {
        setProducts((prev) => prev.filter((p) => p._id !== deleteModal.productId));
        setDeleteModal({ isOpen: false, productId: null, productName: '' });
      }
    } catch (err) {
      console.error('Failed to delete product:', err);
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.name?.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' ||
      p.category?._id === selectedCategory ||
      p.category?.slug === selectedCategory;

    const totalStock = p.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
    const isLowStock = totalStock <= (p.lowStockThreshold || 10);

    const matchesLowStock = !lowStockOnly || isLowStock;

    return matchesSearch && matchesCategory && matchesLowStock;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Product Inventory & Unit Pricing
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage your store catalog, custom units (250g, 1kg, 1L), prices and stock levels
          </p>
        </div>

        <Link
          to="/admin/products/add"
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl text-xs shadow-lg shadow-amber-500/20 transition inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add New Product
        </Link>
      </div>

      {/* Filter and Search controls */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative max-w-xs w-full">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Low stock checkbox */}
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-slate-900 border-slate-700"
            />
            Low Stock Only
          </label>
        </div>

        <span className="text-xs text-slate-400 font-semibold">
          {filteredProducts.length} Items Listed
        </span>
      </div>

      {/* Products Table */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-500 animate-pulse">
            Loading products...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <Boxes className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-bold text-slate-400">No products found</p>
            <p className="text-xs text-slate-600 mt-1">
              Add a new product to your inventory or adjust filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">Product Details</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Unit Pricing & Stock</th>
                  <th className="p-4 text-center">Total Stock</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredProducts.map((product) => {
                  const totalStock =
                    product.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
                  const isLow = totalStock <= (product.lowStockThreshold || 10);
                  const isOut = totalStock <= 0;

                  return (
                    <tr key={product._id} className="hover:bg-slate-900/40 transition">
                      {/* Product details */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              product.image ||
                              'https://images.unsplash.com/photo-1542838132-92c53300491e?w=80&auto=format&fit=crop&q=60'
                            }
                            alt={product.name}
                            className="w-12 h-12 rounded-2xl object-cover bg-slate-900 border border-slate-800 shrink-0"
                          />
                          <div>
                            <p className="font-bold text-white text-sm">
                              {product.name}
                            </p>
                            <span className="text-[10px] text-slate-500">
                              {product.variants?.length} unit variation
                              {product.variants?.length > 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-xl bg-slate-900 text-slate-300 border border-slate-800 font-semibold text-[11px]">
                          {product.category?.name || 'General'}
                        </span>
                      </td>

                      {/* Unit Variations pills */}
                      <td className="p-4 max-w-sm">
                        <div className="flex flex-wrap gap-1.5">
                          {product.variants?.map((v, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-mono"
                            >
                              <strong className="text-amber-400">{v.unit}</strong>: ₹{v.price} ({v.stock} in stock)
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Total Stock */}
                      <td className="p-4 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                            isOut
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : isLow
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {isOut ? 'Out of Stock' : isLow ? `⚠️ ${totalStock} Low` : `${totalStock} In Stock`}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(product._id)}
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition ${
                            product.status === 'active'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30'
                              : 'bg-slate-800 text-slate-500 border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          {product.status === 'active' ? 'Active' : 'Disabled'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/admin/products/edit/${product._id}`}
                            className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-xl transition"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteModal({
                                isOpen: true,
                                productId: product._id,
                                productName: product.name,
                              })
                            }
                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Delete Product?"
        message={`Are you sure you want to permanently delete "${deleteModal.productName}" from your store catalog?`}
        confirmText="Delete Product"
        type="danger"
        onConfirm={handleDelete}
        onCancel={() =>
          setDeleteModal({ isOpen: false, productId: null, productName: '' })
        }
      />
    </div>
  );
};

export default AdminProducts;
