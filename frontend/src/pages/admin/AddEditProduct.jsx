import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import api, { getImageUrl } from '../../services/api';

const AddEditProduct = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [status, setStatus] = useState('active');
  const [isFeatured, setIsFeatured] = useState(false);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);

  // Dynamic Unit & Pricing Variants Array (Default: 250gm / 500gm / 1000gm)
  const [variants, setVariants] = useState([
    { unit: '250gm', price: '', stock: 50 },
    { unit: '500gm', price: '', stock: 50 },
    { unit: '1000gm', price: '', stock: 50 },
  ]);

  // Unit preset suggestions for quick buttons
  const presetUnits = [
    '250gm', '500gm', '1000gm', '2kg', '5kg', '10kg',
    '250ml', '500ml', '1000ml (1 Litre)', '2 Litres', '5 Litres',
    '1 Piece', 'Pack of 5', 'Pack of 10',
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const catRes = await api.get('/categories');
        if (catRes.data.success) {
          setCategories(catRes.data.categories);
          if (!isEditMode && catRes.data.categories.length > 0) {
            setCategoryId(catRes.data.categories[0]._id);
          }
        }

        if (isEditMode) {
          const prodRes = await api.get(`/products/${id}`);
          if (prodRes.data.success) {
            const p = prodRes.data.product;
            setName(p.name);
            setCategoryId(p.category?._id || p.category);
            setDescription(p.description || '');
            setImage(p.image || '');
            setImagePreview(p.image || '');
            setStatus(p.status || 'active');
            setIsFeatured(p.isFeatured || false);
            setLowStockThreshold(p.lowStockThreshold || 10);
            if (p.variants && p.variants.length > 0) {
              setVariants(
                p.variants.map((v) => ({
                  unit: v.unit,
                  price: v.price,
                  stock: v.stock,
                }))
              );
            }
          }
        }
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('Failed to fetch product data.');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchData();
  }, [id, isEditMode]);

  // Handle local image file selection
  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Add new dynamic variant row
  const addVariantRow = () => {
    setVariants([...variants, { unit: '', price: '', stock: 20 }]);
  };

  // Remove variant row
  const removeVariantRow = (index) => {
    if (variants.length <= 1) {
      alert('A product must have at least one unit/pricing variant!');
      return;
    }
    setVariants(variants.filter((_, idx) => idx !== index));
  };

  // Update specific variant field
  const handleVariantChange = (index, field, value) => {
    const updated = [...variants];
    updated[index][field] = value;
    setVariants(updated);
  };

  // Quick preset apply to the last empty variant or add new
  const applyPresetUnit = (preset) => {
    const emptyIndex = variants.findIndex((v) => !v.unit.trim());
    if (emptyIndex > -1) {
      handleVariantChange(emptyIndex, 'unit', preset);
    } else {
      setVariants([...variants, { unit: preset, price: '', stock: 30 }]);
    }
  };

  // Quick 1-click weight template (250gm / 500gm / 1000gm)
  const applyWeightTemplate = () => {
    setVariants([
      { unit: '250gm', price: '', stock: 50 },
      { unit: '500gm', price: '', stock: 50 },
      { unit: '1000gm', price: '', stock: 50 },
    ]);
  };

  // Quick 1-click volume/liquid template (250ml / 500ml / 1 Litre)
  const applyLiterTemplate = () => {
    setVariants([
      { unit: '250ml', price: '', stock: 40 },
      { unit: '500ml', price: '', stock: 40 },
      { unit: '1000ml (1 Litre)', price: '', stock: 40 },
    ]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Please provide product name');
      return;
    }

    if (!categoryId) {
      setError('Please select a product category');
      return;
    }

    // Validate variants
    if (variants.length === 0) {
      setError('Please add at least one unit variant (e.g. 500g, 1kg)');
      return;
    }

    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      if (!v.unit.trim()) {
        setError(`Variant #${i + 1} is missing unit label (e.g., 500g, 1L)`);
        return;
      }
      if (v.price === '' || Number(v.price) < 0) {
        setError(`Variant #${i + 1} (${v.unit}) must have a valid price`);
        return;
      }
      if (v.stock === '' || Number(v.stock) < 0) {
        setError(`Variant #${i + 1} (${v.unit}) must have a non-negative stock count`);
        return;
      }
    }

    setLoading(true);

    try {
      let finalImageUrl = image.trim();

      // If owner uploaded a file, send to upload endpoint first
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        const uploadRes = await api.post('/products/upload-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (uploadRes.data.success) {
          finalImageUrl = uploadRes.data.imageUrl;
        }
      }

      const productPayload = {
        name: name.trim(),
        category: categoryId,
        description: description.trim(),
        image: finalImageUrl,
        status,
        isFeatured,
        lowStockThreshold: Number(lowStockThreshold),
        variants: variants.map((v) => ({
          unit: v.unit.trim(),
          price: Number(v.price),
          stock: Number(v.stock),
        })),
      };

      if (isEditMode) {
        const res = await api.put(`/products/${id}`, productPayload);
        if (res.data.success) {
          setSuccess('Product updated successfully!');
          setTimeout(() => navigate('/admin/products'), 1200);
        }
      } else {
        const res = await api.post('/products', productPayload);
        if (res.data.success) {
          setSuccess('Product created successfully!');
          setTimeout(() => navigate('/admin/products'), 1200);
        }
      }
    } catch (err) {
      console.error('Save product error:', err);
      setError(
        err.response?.data?.message || 'Failed to save product. Check required fields.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center text-slate-500 animate-pulse">
        Loading product details...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/admin/products"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Product Inventory
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {isEditMode ? 'Edit Product & Pricing Units' : 'Add New Grocery Product'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Define custom units (250g, 500g, 1kg, 1L), individual pricing and initial inventory
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs sm:text-sm font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information Card */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5">
          <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
            Product Essentials
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Product Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Tata Salt Vacuum Evaporated / Fortune Sunlite Oil"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Low Stock Threshold (Units)
              </label>
              <input
                type="number"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                min="1"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Description & Cooking/Usage Details
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Key benefits, purity, origin or quality details..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>
        </div>

        {/* Product Image Card */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
          <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
            Product Image
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
            {/* Image Preview */}
            <div className="sm:col-span-4 aspect-square rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center relative">
              {imagePreview ? (
                <img
                  src={getImageUrl(imagePreview)}
                  alt="Preview"
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <div className="text-center p-4 text-slate-500">
                  <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <span className="text-xs">No image selected</span>
                </div>
              )}
            </div>

            {/* Upload or URL input */}
            <div className="sm:col-span-8 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Upload Image File (JPG, PNG, WEBP)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handleImageFileChange}
                  className="w-full text-slate-300 text-xs file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                />
              </div>

              <div>
                <label className="font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Or Provide Image Web URL (Unsplash, Cloudinary, etc.)
                </label>
                <input
                  type="url"
                  value={image}
                  onChange={(e) => {
                    setImage(e.target.value);
                    if (!imageFile) setImagePreview(e.target.value);
                  }}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Unit & Pricing System (Core Requirement) */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Dynamic Selling Units & Multi-Pricing System
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Add weight, volume, or quantity variations (e.g., 250g, 500g, 1kg, 5kg) with custom price & stock
              </p>
            </div>

            <button
              type="button"
              onClick={addVariantRow}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" /> Add Another Unit
            </button>
          </div>

          {/* 1-Click Package Templates */}
          <div className="bg-slate-900/80 border border-amber-500/20 rounded-2xl p-3.5 space-y-2">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
              ⚡ 1-Click Package Setup:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={applyWeightTemplate}
                className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 border border-amber-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                ⚖️ Standard Weight (250gm / 500gm / 1000gm)
              </button>
              <button
                type="button"
                onClick={applyLiterTemplate}
                className="px-3 py-1.5 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 hover:text-cyan-200 border border-cyan-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                🥛 Standard Volume (250ml / 500ml / 1000ml / Litre)
              </button>
            </div>
          </div>

          {/* Quick presets helper */}
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Quick Unit Presets (Click to add to list):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {presetUnits.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => applyPresetUnit(preset)}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-semibold border border-slate-800 transition"
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Variant Rows */}
          <div className="space-y-3 pt-2">
            <div className="hidden sm:grid grid-cols-12 gap-3 text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
              <div className="col-span-4">Unit Label (e.g., 250g, 1kg, 1L)</div>
              <div className="col-span-3">Price (₹)</div>
              <div className="col-span-3">Stock Count</div>
              <div className="col-span-2 text-center">Action</div>
            </div>

            {variants.map((v, idx) => (
              <div
                key={idx}
                className="bg-slate-900/90 border border-slate-800 p-4 sm:p-2 rounded-2xl sm:grid sm:grid-cols-12 sm:gap-3 sm:items-center flex flex-col gap-3"
              >
                {/* Unit Label */}
                <div className="sm:col-span-4">
                  <label className="sm:hidden text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Unit Variation
                  </label>
                  <input
                    type="text"
                    value={v.unit}
                    onChange={(e) => handleVariantChange(idx, 'unit', e.target.value)}
                    placeholder="e.g. 500g, 1kg, 1 Liter, 1 Piece"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                {/* Price */}
                <div className="sm:col-span-3">
                  <label className="sm:hidden text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Price (₹)
                  </label>
                  <div className="relative">
                    <span className="text-slate-500 absolute left-3 top-2.5 font-bold text-xs">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={v.price}
                      onChange={(e) => handleVariantChange(idx, 'price', e.target.value)}
                      placeholder="e.g. 75"
                      min="0"
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 pl-7 text-xs text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>

                {/* Stock */}
                <div className="sm:col-span-3">
                  <label className="sm:hidden text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Available Stock
                  </label>
                  <input
                    type="number"
                    value={v.stock}
                    onChange={(e) => handleVariantChange(idx, 'stock', e.target.value)}
                    placeholder="e.g. 50"
                    min="0"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                {/* Remove button */}
                <div className="sm:col-span-2 text-center">
                  <button
                    type="button"
                    onClick={() => removeVariantRow(idx)}
                    disabled={variants.length <= 1}
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-950 rounded-xl transition disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Remove Variant"
                  >
                    <Trash2 className="w-4 h-4 mx-auto" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status & Featured */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-wrap items-center justify-between gap-6 text-xs font-semibold">
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2.5 cursor-pointer text-slate-200">
              <input
                type="checkbox"
                checked={status === 'active'}
                onChange={(e) => setStatus(e.target.checked ? 'active' : 'inactive')}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-slate-900 border-slate-700"
              />
              Product is Active & Visible in Store
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer text-slate-200">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-slate-900 border-slate-700"
              />
              Feature on Homepage Essentials
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3.5 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 text-slate-950 font-black rounded-2xl text-sm shadow-xl shadow-amber-500/20 transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving Product...' : isEditMode ? 'Update Product' : 'Save Product'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddEditProduct;
