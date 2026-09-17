import React, { useState, useEffect } from 'react';
import { Tags, Plus, Edit2, Trash2, CheckCircle2, AlertCircle, Image as ImageIcon } from 'lucide-react';
import api from '../../services/api';
import ConfirmationModal from '../../components/ConfirmationModal';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('active');
  const [error, setError] = useState('');

  // Delete modal
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    catId: null,
    catName: '',
  });

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories?includeInactive=true');
      if (res.data.success) {
        setCategories(res.data.categories);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    setName('');
    setImage('');
    setDescription('');
    setStatus('active');
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setName(cat.name);
    setImage(cat.image || '');
    setDescription(cat.description || '');
    setStatus(cat.status || 'active');
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      if (editingCategory) {
        const res = await api.put(`/categories/${editingCategory._id}`, {
          name: name.trim(),
          image: image.trim(),
          description: description.trim(),
          status,
        });
        if (res.data.success) {
          setCategories((prev) =>
            prev.map((c) => (c._id === editingCategory._id ? res.data.category : c))
          );
          setModalOpen(false);
        }
      } else {
        const res = await api.post('/categories', {
          name: name.trim(),
          image: image.trim(),
          description: description.trim(),
          status,
        });
        if (res.data.success) {
          setCategories([...categories, res.data.category]);
          setModalOpen(false);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save category');
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.catId) return;
    try {
      const res = await api.delete(`/categories/${deleteModal.catId}`);
      if (res.data.success) {
        setCategories((prev) => prev.filter((c) => c._id !== deleteModal.catId));
        setDeleteModal({ isOpen: false, catId: null, catName: '' });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete category');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Category Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Organize products into intuitive grocery aisles and categories
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl text-xs shadow-lg shadow-amber-500/20 transition inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <div
            key={cat._id}
            className="bg-slate-950/70 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between group shadow-sm hover:border-slate-700 transition"
          >
            <div>
              <div className="w-full aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 mb-3">
                <img
                  src={
                    cat.image ||
                    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=60'
                  }
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition"
                />
              </div>

              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-base text-white">{cat.name}</h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    cat.status === 'active'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {cat.status}
                </span>
              </div>

              <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">
                {cat.description || 'Staple grocery department'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 mt-3 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => openEditModal(cat)}
                className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-xl transition"
                title="Edit Category"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setDeleteModal({
                    isOpen: true,
                    catId: cat._id,
                    catName: cat.name,
                  })
                }
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition"
                title="Delete Category"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Category Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-black text-white">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/20 text-rose-300 text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rice & Grains / Dairy & Eggs"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Cover Image URL
                </label>
                <input
                  type="url"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Items included in this section..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="active">Active (Visible)</option>
                  <option value="inactive">Inactive (Hidden)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-md"
                >
                  {editingCategory ? 'Update' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Delete Category?"
        message={`Are you sure you want to delete category "${deleteModal.catName}"?`}
        confirmText="Delete Category"
        type="danger"
        onConfirm={handleDelete}
        onCancel={() =>
          setDeleteModal({ isOpen: false, catId: null, catName: '' })
        }
      />
    </div>
  );
};

export default AdminCategories;
