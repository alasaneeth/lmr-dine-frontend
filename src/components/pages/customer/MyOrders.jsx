// src/components/pages/customer/MyOrders.jsx
import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../common/PageHeader';
import { PageLoader, ErrorBanner, StatusBadge, Pagination } from '../../common/ui';
import { orderApi } from '../../../api/services';
import { useSocket } from '../../../context/SocketContext';
import { usePagination } from '../../../hooks';

const STATUS_STEPS = ['pending','preparing','ready','served','paid'];

export default function MyOrders() {
  const { subscribe, unsubscribe, emit } = useSocket();
  const pagination = usePagination(8);

  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await orderApi.getMyOrders({ page: pagination.page, limit: pagination.limit });
      setOrders(data.orders || []);
      pagination.setTotal(data.total || 0);
    } catch (e) {
      setError(e.response?.data?.error?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Subscribe to real-time order status updates
  useEffect(() => {
    const handler = ({ orderId, status }) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
    };
    subscribe('order:status',    handler);
    subscribe('order:cancelled', ({ orderId }) => {
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: 'cancelled' } : o));
    });
    // Subscribe to each order's room for granular updates
    orders.forEach((o) => emit('order:subscribe', o.id));

    return () => {
      unsubscribe('order:status',    handler);
      orders.forEach((o) => emit('order:unsubscribe', o.id));
    };
  }, [subscribe, unsubscribe, emit, orders.length]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <PageHeader title="My Orders" subtitle="Track your current and past orders" />

      <div className="p-6 space-y-4">
        {error && <ErrorBanner message={error} onRetry={fetchOrders} />}

        {loading ? <PageLoader /> : orders.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
            <div className="text-5xl mb-3">🍽</div>
            <h3 className="text-gray-700 font-semibold">No orders yet</h3>
            <p className="text-gray-400 text-sm mt-1">Place an order to get started!</p>
          </div>
        ) : (
          <>
            {orders.map((order) => {
              const currentStep = STATUS_STEPS.indexOf(order.status);
              return (
                <div key={order.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="font-mono text-sm text-gray-400">{order.order_no}</div>
                      <div className="font-semibold text-gray-900 mt-0.5">{order.table_no}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {new Date(order.placed_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={order.status} />
                      <div className="text-sm font-semibold text-gray-900 mt-1">
                        LKR {parseFloat(order.total).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Progress tracker */}
                  {order.status !== 'cancelled' && (
                    <div className="mb-4">
                      <div className="flex items-center">
                        {STATUS_STEPS.slice(0, -1).map((s, i) => {
                          const done = i <= currentStep;
                          const active = i === currentStep;
                          return (
                            <React.Fragment key={s}>
                              <div className={`flex flex-col items-center ${i > 0 ? 'flex-1' : ''}`}>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                                  done ? 'bg-yellow-400 border-yellow-400 text-gray-900' : 'border-gray-200 text-gray-300'
                                } ${active ? 'ring-2 ring-yellow-300 ring-offset-1' : ''}`}>
                                  {done ? '✓' : i+1}
                                </div>
                                <span className={`text-xs mt-1 capitalize ${done ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>
                                  {s}
                                </span>
                              </div>
                              {i < STATUS_STEPS.length - 2 && (
                                <div className={`flex-1 h-0.5 mb-5 ${i < currentStep ? 'bg-yellow-400' : 'bg-gray-200'}`} />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Items */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 font-medium uppercase">Items</div>
                    {(order.items || []).map((item, i) => (
                      <div key={i} className="flex justify-between px-4 py-2 border-t text-sm">
                        <span className="text-gray-700">{item.qty}× {item.name}</span>
                        <span className="text-gray-500">LKR {parseFloat(item.subtotal).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <Pagination page={pagination.page} totalPages={pagination.totalPages}
                onNext={pagination.nextPage} onPrev={pagination.prevPage} onGoTo={pagination.goTo} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
