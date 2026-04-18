// src/components/pages/waiter/AddNewStock.jsx
import React, { useState, useEffect } from 'react';
import PageHeader  from '../../common/PageHeader';
import { PageLoader, ErrorBanner, useToast, Spinner } from '../../common/ui';
import { stockApi } from '../../../api/services';

export default function AddNewStock() {
  const toast = useToast();
  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [deltas,   setDeltas]   = useState({});   // { [id]: string }
  const [saving,   setSaving]   = useState({});   // { [id]: bool }
  const [newItem,  setNewItem]  = useState({ name:'', unit:'kg', qty:'', minQty:'', price:'' });
  const [creating, setCreating] = useState(false);

  const fetchItems = async () => {
    setLoading(true); setError(null);
    try {
      const data = await stockApi.getAll({ limit: 100 });
      setItems(data.items || []);
    } catch (e) { setError('Failed to load stock items'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleAdjust = async (item) => {
    const delta = parseFloat(deltas[item.id]);
    if (isNaN(delta) || delta === 0) { toast('Enter a valid quantity to add', 'warning'); return; }
    setSaving((s) => ({ ...s, [item.id]: true }));
    try {
      await stockApi.adjust(item.id, delta);
      toast(`${item.name} updated by ${delta > 0 ? '+' : ''}${delta} ${item.unit}`, 'success');
      setDeltas((d) => ({ ...d, [item.id]: '' }));
      fetchItems();
    } catch (e) {
      toast(e.response?.data?.error?.message || 'Failed to adjust', 'error');
    } finally { setSaving((s) => ({ ...s, [item.id]: false })); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.unit) { toast('Name and unit are required', 'warning'); return; }
    setCreating(true);
    try {
      await stockApi.create({
        name:   newItem.name,
        unit:   newItem.unit,
        qty:    parseFloat(newItem.qty) || 0,
        minQty: parseFloat(newItem.minQty) || 0,
        price:  parseFloat(newItem.price) || 0,
      });
      toast('Stock item created!', 'success');
      setNewItem({ name:'', unit:'kg', qty:'', minQty:'', price:'' });
      fetchItems();
    } catch (e) {
      toast(e.response?.data?.error?.message || 'Failed to create', 'error');
    } finally { setCreating(false); }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <PageHeader title="Add / Update Stock" subtitle="Restock ingredients and supplies" />

      <div className="p-6 space-y-6">
        {error && <ErrorBanner message={error} onRetry={fetchItems} />}

        {/* Add new stock item */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Add New Stock Item</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
              <input value={newItem.name} onChange={(e) => setNewItem((n) => ({...n,name:e.target.value}))}
                placeholder="e.g. Chicken" required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Unit *</label>
              <select value={newItem.unit} onChange={(e) => setNewItem((n) => ({...n,unit:e.target.value}))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400">
                {['kg','g','L','ml','units','pcs','boxes'].map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Initial Qty</label>
              <input type="number" min="0" step="0.1" value={newItem.qty}
                onChange={(e) => setNewItem((n) => ({...n,qty:e.target.value}))} placeholder="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Min Qty</label>
              <input type="number" min="0" step="0.1" value={newItem.minQty}
                onChange={(e) => setNewItem((n) => ({...n,minQty:e.target.value}))} placeholder="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
            </div>
            <div>
              <button type="submit" disabled={creating}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-lg py-2 text-sm flex items-center justify-center gap-1 disabled:opacity-60">
                {creating ? <Spinner size="sm" /> : '+ Add Item'}
              </button>
            </div>
          </form>
        </div>

        {/* Adjust existing stock */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h3 className="font-semibold text-gray-900">Restock Existing Items</h3>
            <p className="text-xs text-gray-400 mt-0.5">Enter a positive number to add, negative to remove</p>
          </div>
          {loading ? <PageLoader /> : (
            <div className="divide-y divide-gray-100">
              {items.map((item) => {
                const isLow = parseFloat(item.qty) <= parseFloat(item.min_qty);
                return (
                  <div key={item.id} className="px-5 py-3 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 text-sm">{item.name}</span>
                        {isLow && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Low</span>}
                      </div>
                      <div className="text-xs text-gray-400">
                        Current: <span className={`font-semibold ${isLow ? 'text-red-600' : 'text-gray-700'}`}>
                          {parseFloat(item.qty).toFixed(1)} {item.unit}
                        </span>
                        {' '}(min: {parseFloat(item.min_qty).toFixed(1)})
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="number" step="0.1"
                        value={deltas[item.id] || ''}
                        onChange={(e) => setDeltas((d) => ({ ...d, [item.id]: e.target.value }))}
                        placeholder="+5"
                        className="w-20 border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      />
                      <button onClick={() => handleAdjust(item)} disabled={saving[item.id]}
                        className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg px-3 py-1.5 text-xs disabled:opacity-50 flex items-center gap-1">
                        {saving[item.id] ? <Spinner size="sm" /> : 'Update'}
                      </button>
                    </div>
                  </div>
                );
              })}
              {items.length === 0 && <p className="text-center text-gray-400 py-10 text-sm">No stock items yet</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
