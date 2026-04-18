// src/components/pages/admin/FoodStockManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../common/PageHeader';
import { PageLoader, ErrorBanner, Pagination, useToast, ConfirmModal } from '../../common/ui';
import { stockApi }  from '../../../api/services';
import { usePagination } from '../../../hooks';

export default function FoodStockManagement() {
  const toast      = useToast();
  const pagination = usePagination(12);

  const [items,    setItems]   = useState([]);
  const [loading,  setLoading] = useState(true);
  const [error,    setError]   = useState(null);
  const [adjust,   setAdjust]  = useState(null);  // { id, name }
  const [delta,    setDelta]   = useState('');
  const [confirm,  setConfirm] = useState(null);
  const [lowCount, setLowCount]= useState(0);

  const fetchItems = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await stockApi.getAll({ page: pagination.page, limit: pagination.limit });
      setItems(data.items || []);
      pagination.setTotal(data.total || 0);
      const low  = await stockApi.getLow();
      setLowCount(Array.isArray(low) ? low.length : 0);
    } catch (e) {
      setError(e.response?.data?.error?.message || 'Failed to load stock');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleAdjust = async () => {
    const d = parseFloat(delta);
    if (isNaN(d) || d === 0) { toast('Enter a valid non-zero delta', 'warning'); return; }
    try {
      await stockApi.adjust(adjust.id, d);
      toast(`${adjust.name} adjusted by ${d > 0 ? '+' : ''}${d}`, 'success');
      setAdjust(null); setDelta('');
      fetchItems();
    } catch (e) {
      toast(e.response?.data?.error?.message || 'Adjust failed', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await stockApi.remove(id);
      toast('Item deleted', 'success');
      fetchItems();
    } catch (e) {
      toast(e.response?.data?.error?.message || 'Delete failed', 'error');
    } finally { setConfirm(null); }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <PageHeader title="Food Stock" subtitle="Monitor and adjust ingredient levels" />

      <div className="p-6 space-y-5">
        {lowCount > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-5 py-3 flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <p className="text-orange-700 text-sm font-medium">{lowCount} item{lowCount>1?'s':''} running low on stock</p>
          </div>
        )}

        {error && <ErrorBanner message={error} onRetry={fetchItems} />}

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? <PageLoader /> : (
            <>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  <tr>{['Item','Unit','Current Qty','Min Qty','Price/Unit','Status','Actions'].map((h)=>(
                    <th key={h} className="text-left px-5 py-3 font-medium">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item) => {
                    const isLow = parseFloat(item.qty) <= parseFloat(item.min_qty);
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3 font-medium text-gray-900">{item.name}</td>
                        <td className="px-5 py-3 text-gray-500">{item.unit}</td>
                        <td className={`px-5 py-3 font-semibold ${isLow ? 'text-red-600' : 'text-gray-900'}`}>
                          {parseFloat(item.qty).toFixed(1)}
                        </td>
                        <td className="px-5 py-3 text-gray-500">{parseFloat(item.min_qty).toFixed(1)}</td>
                        <td className="px-5 py-3 text-gray-700">LKR {parseFloat(item.price).toLocaleString()}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${isLow ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {isLow ? 'Low' : 'OK'}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => { setAdjust(item); setDelta(''); }}
                              className="text-xs border px-2.5 py-1 rounded-full hover:bg-gray-50 transition text-gray-600">
                              Adjust
                            </button>
                            <button onClick={() => setConfirm({ id: item.id, name: item.name })}
                              className="text-xs border border-red-200 text-red-600 px-2.5 py-1 rounded-full hover:bg-red-50 transition">
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {items.length === 0 && <p className="text-center text-gray-400 py-10 text-sm">No stock items</p>}
              <Pagination page={pagination.page} totalPages={pagination.totalPages}
                onNext={pagination.nextPage} onPrev={pagination.prevPage} onGoTo={pagination.goTo} />
            </>
          )}
        </div>
      </div>

      {/* Adjust modal */}
      {adjust && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <h3 className="font-semibold text-gray-900 text-lg mb-1">Adjust Stock</h3>
            <p className="text-gray-500 text-sm mb-4">{adjust.name} – current: {parseFloat(adjust.qty).toFixed(1)} {adjust.unit}</p>
            <input
              type="number" value={delta} onChange={(e) => setDelta(e.target.value)}
              placeholder="e.g. +5 or -2"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setAdjust(null)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleAdjust} className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800">Apply</button>
            </div>
          </div>
        </div>
      )}

      {confirm && (
        <ConfirmModal title="Delete Stock Item" message={`Delete ${confirm.name}?`}
          onConfirm={() => handleDelete(confirm.id)} onCancel={() => setConfirm(null)} danger />
      )}
    </div>
  );
}
