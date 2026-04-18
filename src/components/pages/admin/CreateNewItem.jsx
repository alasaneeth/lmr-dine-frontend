// ─────────────────────────────────────────────────────────────────────────────
// src/components/pages/admin/CreateNewItem.jsx
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import PageHeader from '../../common/PageHeader';
import { useToast, Spinner } from '../../common/ui';
import { menuApi } from '../../../api/services';
import apiClient   from '../../../api/apiClient';

export default function CreateNewItem() {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    categoryId: '', name: '', price: '', emoji: '🍽', stock: '', description: '', isAvailable: true,
  });
  const [image,    setImage]    = useState(null);
  const [preview,  setPreview]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);

  useEffect(() => {
    apiClient.get('/menu').then((r) => {
      const items = r.data.data.items || [];
      const catMap = {};
      items.forEach((i) => { if (i.category && !catMap[i.category.id]) catMap[i.category.id] = i.category; });
      setCategories(Object.values(catMap));
    }).catch(() => {});
    // Also fetch categories separately
    apiClient.get('/menu?limit=1').then(() => {}).catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.categoryId || !form.name || !form.price) { toast('Fill all required fields', 'warning'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (image) fd.append('image', image);
      await menuApi.create(fd);
      toast('Menu item created!', 'success');
      setSuccess(true);
      setForm({ categoryId: '', name: '', price: '', emoji: '🍽', stock: '0', description: '', isAvailable: true });
      setImage(null); setPreview(null);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      toast(err.response?.data?.error?.message || 'Failed to create item', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <PageHeader title="Create New Menu Item" subtitle="Add a new dish or product to the menu" />
      <div className="p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
          {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">✓ Item created successfully!</div>}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
              <select name="categoryId" value={form.categoryId} onChange={handleChange} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400">
                <option value="">Select category…</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Name <span className="text-red-500">*</span></label>
              <input name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Chicken Curry"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (LKR) <span className="text-red-500">*</span></label>
              <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} required placeholder="0.00"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock</label>
              <input name="stock" type="number" min="0" value={form.stock} onChange={handleChange} placeholder="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Emoji</label>
              <input name="emoji" value={form.emoji} onChange={handleChange} maxLength={10}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" name="isAvailable" checked={form.isAvailable} onChange={handleChange} id="avail" className="rounded" />
              <label htmlFor="avail" className="text-sm text-gray-700">Available for ordering</label>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Optional description…"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none" />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Image (optional)</label>
              <input type="file" accept="image/*" onChange={handleImage}
                className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100" />
              {preview && <img src={preview} alt="preview" className="mt-3 w-32 h-32 object-cover rounded-lg border" />}
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-lg py-2.5 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? <><Spinner size="sm" />Creating…</> : 'Create Item →'}
          </button>
        </form>
      </div>
    </div>
  );
}
