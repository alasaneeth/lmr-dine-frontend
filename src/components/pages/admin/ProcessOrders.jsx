// src/components/pages/admin/ProcessOrders.jsx
import React, { useState, useEffect, useCallback } from 'react';
import PageHeader    from '../../common/PageHeader';
import { PageLoader, ErrorBanner, StatusBadge, Pagination, useToast } from '../../common/ui';
import { orderApi }  from '../../../api/services';
import { useSocket } from '../../../context/SocketContext';
import { usePagination } from '../../../hooks';

const STATUS_FLOW = ['pending','preparing','ready','served','paid'];
const NEXT = { pending:'preparing', preparing:'ready', ready:'served', served:'paid' };

const statusColors = {
  pending:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  preparing: 'bg-blue-100 text-blue-700 border-blue-200',
  ready:     'bg-green-100 text-green-700 border-green-200',
  served:    'bg-gray-100 text-gray-600 border-gray-200',
  paid:      'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-100 text-red-600 border-red-200',
};

export default function ProcessOrders() {
  const toast = useToast();
  const { subscribe, unsubscribe } = useSocket();
  const pagination = usePagination(15);

  const [orders,    setOrders]    = useState([]);
  const [counts,    setCounts]    = useState({});
  const [selected,  setSelected]  = useState(null);
  const [filter,    setFilter]    = useState('all');
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [advancing, setAdvancing] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = { page: pagination.page, limit: pagination.limit };
      if (filter !== 'all') params.status = filter;
      const data = await orderApi.getAll(params);
      setOrders(data.orders || data.rows || []);
      pagination.setTotal(data.total || 0);

      // Fetch counts per status
      const countPromises = STATUS_FLOW.map((s) =>
        orderApi.getAll({ status: s, limit: 1 }).then((r) => [s, r.total || 0])
      );
      const entries = await Promise.all(countPromises);
      setCounts(Object.fromEntries(entries));
    } catch (e) {
      setError(e.response?.data?.error?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [filter, pagination.page, pagination.limit]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Real-time: refresh list when order status changes
  useEffect(() => {
    const handler = () => fetchOrders();
    subscribe('order:new',       handler);
    subscribe('order:status',    handler);
    subscribe('order:cancelled', handler);
    return () => {
      unsubscribe('order:new',       handler);
      unsubscribe('order:status',    handler);
      unsubscribe('order:cancelled', handler);
    };
  }, [subscribe, unsubscribe, fetchOrders]);

  const advance = async (id) => {
    setAdvancing(id);
    try {
      const updated = await orderApi.advance(id);
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
      if (selected?.id === id) setSelected(updated);
      toast(`Order advanced to ${updated.status}`, 'success');
    } catch (e) {
      toast(e.response?.data?.error?.message || 'Failed to advance order', 'error');
    } finally {
      setAdvancing(null);
    }
  };

  const cancel = async (id) => {
    if (!window.confirm('Cancel this order?')) return;
    try {
      await orderApi.cancel(id);
      fetchOrders();
      if (selected?.id === id) setSelected(null);
      toast('Order cancelled', 'info');
    } catch (e) {
      toast(e.response?.data?.error?.message || 'Failed to cancel', 'error');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <PageHeader title="Process Orders" subtitle="Track and advance order status in real time" />

      <div className="p-6 space-y-5">
        {/* Status summary buttons */}
        <div className="grid grid-cols-5 gap-3">
          {STATUS_FLOW.map((s) => (
            <button key={s}
              onClick={() => { setFilter(filter === s ? 'all' : s); pagination.resetPage(); }}
              className={`rounded-xl border px-3 py-3 text-center transition-all ${filter===s?'ring-2 ring-yellow-400':''}${statusColors[s]}`}
            >
              <div className="text-xl font-bold">{counts[s] ?? '…'}</div>
              <div className="text-xs capitalize mt-0.5">{s}</div>
            </button>
          ))}
        </div>

        {error && <ErrorBanner message={error} onRetry={fetchOrders} />}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
          {/* Orders list */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                Orders {filter !== 'all' && <span className="capitalize text-yellow-600">— {filter}</span>}
              </h3>
              <span className="text-xs text-gray-400">{pagination.total} orders</span>
            </div>

            {loading ? <PageLoader /> : (
              <>
                <div className="divide-y divide-gray-100 max-h-[calc(100vh-360px)] overflow-y-auto">
                  {orders.length === 0 && (
                    <div className="text-center text-gray-400 py-10 text-sm">No orders found.</div>
                  )}
                  {orders.map((o) => (
                    <div key={o.id} onClick={() => setSelected(o)}
                      className={`px-5 py-4 cursor-pointer hover:bg-gray-50 flex items-center gap-4 ${selected?.id === o.id ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-gray-400">{o.order_no}</span>
                          <StatusBadge status={o.status} />
                        </div>
                        <div className="text-sm font-medium text-gray-900 mt-0.5">{o.table_no}</div>
                        <div className="text-xs text-gray-400">
                          {o.customer_name || 'Walk-in'} · {(o.items||[]).length} items ·{' '}
                          {new Date(o.placed_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-semibold text-gray-900 text-sm">LKR {parseFloat(o.total).toLocaleString()}</div>
                        {NEXT[o.status] && (
                          <button
                            onClick={(e) => { e.stopPropagation(); advance(o.id); }}
                            disabled={advancing === o.id}
                            className="mt-1 text-xs bg-gray-900 text-white px-2.5 py-1 rounded-full hover:bg-gray-700 capitalize disabled:opacity-50"
                          >
                            {advancing === o.id ? '…' : `→ ${NEXT[o.status]}`}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <Pagination
                  page={pagination.page} totalPages={pagination.totalPages}
                  onNext={pagination.nextPage} onPrev={pagination.prevPage}
                  onGoTo={pagination.goTo}
                />
              </>
            )}
          </div>

          {/* Order detail panel */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 h-fit">
            {!selected ? (
              <div className="text-center text-gray-400 py-10 text-sm">Select an order to view details</div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{selected.table_no}</h3>
                    <p className="text-xs text-gray-400">{selected.order_no}</p>
                  </div>
                  <StatusBadge status={selected.status} />
                </div>

                <div className="text-sm text-gray-600 mb-4">
                  Customer: <span className="font-medium text-gray-900">{selected.customer_name || 'Walk-in'}</span>
                </div>

                <div className="border rounded-lg overflow-hidden mb-4">
                  <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 font-medium uppercase">Order Items</div>
                  {(selected.items || []).map((item, i) => (
                    <div key={i} className="flex justify-between px-4 py-2.5 border-t text-sm">
                      <span>{item.qty}× {item.name}</span>
                      <span className="text-gray-600">LKR {parseFloat(item.subtotal).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between font-semibold text-gray-900 mb-4">
                  <span>Total</span>
                  <span>LKR {parseFloat(selected.total).toLocaleString()}</span>
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-1 mb-5">
                  {STATUS_FLOW.filter((s) => s !== 'paid').map((s) => {
                    const idx  = STATUS_FLOW.indexOf(selected.status);
                    const sIdx = STATUS_FLOW.indexOf(s);
                    return <div key={s} className={`flex-1 h-1.5 rounded-full ${sIdx <= idx ? 'bg-yellow-400' : 'bg-gray-200'}`} />;
                  })}
                </div>

                <div className="flex flex-col gap-2">
                  {NEXT[selected.status] && (
                    <button onClick={() => advance(selected.id)} disabled={advancing === selected.id}
                      className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-lg py-2.5 text-sm font-medium capitalize disabled:opacity-50">
                      {advancing === selected.id ? 'Advancing…' : `Advance to "${NEXT[selected.status]}" →`}
                    </button>
                  )}
                  {!['paid','cancelled'].includes(selected.status) && (
                    <button onClick={() => cancel(selected.id)}
                      className="w-full border border-red-200 text-red-600 hover:bg-red-50 rounded-lg py-2 text-sm">
                      Cancel Order
                    </button>
                  )}
                  {selected.status === 'paid' && (
                    <div className="text-center text-green-600 text-sm font-medium py-2">✓ Order Completed</div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
