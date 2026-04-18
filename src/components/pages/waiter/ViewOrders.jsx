// src/components/pages/waiter/ViewOrders.jsx
import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../common/PageHeader';
import { PageLoader, ErrorBanner, StatusBadge, Pagination } from '../../common/ui';
import { orderApi }      from '../../../api/services';
import { useSocket }     from '../../../context/SocketContext';
import { usePagination } from '../../../hooks';

const STATUSES = ['all','pending','preparing','ready','served','paid','cancelled'];

export default function ViewOrders() {
  const { subscribe, unsubscribe } = useSocket();
  const pagination = usePagination(15);

  const [orders,   setOrders]   = useState([]);
  const [selected, setSelected] = useState(null);
  const [filter,   setFilter]   = useState('all');
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = { page: pagination.page, limit: pagination.limit };
      if (filter !== 'all') params.status = filter;
      const data = await orderApi.getAll(params);
      setOrders(data.orders || []);
      pagination.setTotal(data.total || 0);
    } catch (e) { setError('Failed to load orders'); }
    finally { setLoading(false); }
  }, [filter, pagination.page, pagination.limit]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    const h = () => fetchOrders();
    subscribe('order:new', h); subscribe('order:status', h);
    return () => { unsubscribe('order:new', h); unsubscribe('order:status', h); };
  }, [subscribe, unsubscribe, fetchOrders]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <PageHeader title="View Orders" subtitle="Browse all active and past orders" />

      <div className="p-6 space-y-4">
        {/* Status filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map((s) => (
            <button key={s} onClick={() => { setFilter(s); pagination.resetPage(); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition ${
                filter===s ? 'bg-gray-900 text-white border-gray-900' : 'hover:bg-gray-50 text-gray-600'
              }`}>
              {s}
            </button>
          ))}
        </div>

        {error && <ErrorBanner message={error} onRetry={fetchOrders} />}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {loading ? <PageLoader /> : (
              <>
                <div className="divide-y divide-gray-100 max-h-[calc(100vh-280px)] overflow-y-auto">
                  {orders.length === 0
                    ? <p className="text-center text-gray-400 py-10 text-sm">No orders found</p>
                    : orders.map((o) => (
                      <div key={o.id} onClick={() => setSelected(o)}
                        className={`px-5 py-4 cursor-pointer hover:bg-gray-50 ${selected?.id===o.id?'bg-yellow-50 border-l-4 border-yellow-400':''}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-gray-400">{o.order_no}</span>
                              <StatusBadge status={o.status} />
                            </div>
                            <div className="text-sm font-medium text-gray-900 mt-0.5">{o.table_no}</div>
                            <div className="text-xs text-gray-400">
                              {o.customer_name||'Walk-in'} · {(o.items||[]).length} items
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-sm text-gray-900">LKR {parseFloat(o.total).toLocaleString()}</div>
                            <div className="text-xs text-gray-400">{new Date(o.placed_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </div>
                <Pagination page={pagination.page} totalPages={pagination.totalPages}
                  onNext={pagination.nextPage} onPrev={pagination.prevPage} onGoTo={pagination.goTo} />
              </>
            )}
          </div>

          {/* Detail panel */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 h-fit">
            {!selected ? (
              <p className="text-center text-gray-400 py-10 text-sm">Select an order to view details</p>
            ) : (
              <>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{selected.table_no}</h3>
                    <p className="text-xs text-gray-400 font-mono">{selected.order_no}</p>
                    <p className="text-xs text-gray-400">{new Date(selected.placed_at).toLocaleString()}</p>
                  </div>
                  <StatusBadge status={selected.status} />
                </div>
                {selected.customer_name && (
                  <p className="text-sm text-gray-600 mb-3">Customer: <span className="font-medium">{selected.customer_name}</span></p>
                )}
                {selected.notes && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-xs text-yellow-800 mb-3">
                    📝 {selected.notes}
                  </div>
                )}
                <div className="border rounded-lg overflow-hidden mb-4">
                  <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 font-medium uppercase">Items</div>
                  {(selected.items||[]).map((item, i) => (
                    <div key={i} className="flex justify-between px-4 py-2.5 border-t text-sm">
                      <span>{item.qty}× {item.name}</span>
                      <span className="text-gray-600">LKR {parseFloat(item.subtotal).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-bold text-gray-900">
                  <span>Total</span>
                  <span>LKR {parseFloat(selected.total).toLocaleString()}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
