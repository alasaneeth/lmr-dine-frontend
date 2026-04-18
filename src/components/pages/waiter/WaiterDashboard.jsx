// src/components/pages/waiter/WaiterDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate }  from 'react-router-dom';
import PageHeader       from '../../common/PageHeader';
import StatCard         from '../../common/StatCard';
import { PageLoader, ErrorBanner, StatusBadge } from '../../common/ui';
import { orderApi, stockApi } from '../../../api/services';
import { useSocket }    from '../../../context/SocketContext';

export default function WaiterDashboard() {
  const navigate = useNavigate();
  const { subscribe, unsubscribe } = useSocket();

  const [orders,    setOrders]    = useState([]);
  const [lowStock,  setLowStock]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [ordersData, lowData] = await Promise.all([
        orderApi.getAll({ status: 'pending', limit: 20 }),
        stockApi.getLow(),
      ]);
      setOrders(ordersData.orders || []);
      setLowStock(Array.isArray(lowData) ? lowData : []);
    } catch (e) {
      setError(e.response?.data?.error?.message || 'Failed to load dashboard');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const handler = () => fetchData();
    subscribe('order:new',    handler);
    subscribe('order:status', handler);
    return () => { unsubscribe('order:new', handler); unsubscribe('order:status', handler); };
  }, [subscribe, unsubscribe, fetchData]);

  if (loading) return <PageLoader />;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <PageHeader title="Waiter Dashboard" subtitle="Active orders and stock alerts" />

      <div className="p-6 space-y-6">
        {error && <ErrorBanner message={error} onRetry={fetchData} />}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Pending Orders"  value={orders.filter(o=>o.status==='pending').length}   sub="Awaiting kitchen" icon="⏳" />
          <StatCard label="Low Stock Items" value={lowStock.length}  sub="Need restocking"  icon="⚠️" accent={lowStock.length>0} />
        </div>

        {lowStock.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <h3 className="font-semibold text-orange-800 mb-3">⚠️ Low Stock Alerts</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {lowStock.map((item) => (
                <div key={item.id} className="bg-white border border-orange-200 rounded-lg px-3 py-2 text-sm">
                  <div className="font-medium text-gray-900">{item.name}</div>
                  <div className="text-orange-600 text-xs">{parseFloat(item.qty).toFixed(1)} {item.unit} left (min: {parseFloat(item.min_qty).toFixed(1)})</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h3 className="font-semibold text-gray-900">Pending Orders</h3>
            <button onClick={() => navigate('/waiter/process-orders')} className="text-xs text-yellow-600 hover:underline font-medium">View all →</button>
          </div>
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {orders.length === 0
              ? <p className="text-center text-gray-400 py-10 text-sm">No pending orders 🎉</p>
              : orders.map((o) => (
                <div key={o.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <div className="font-mono text-xs text-gray-400">{o.order_no}</div>
                    <div className="text-sm font-medium text-gray-900">{o.table_no}</div>
                    <div className="text-xs text-gray-400">{(o.items||[]).length} items · {new Date(o.placed_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={o.status} />
                    <div className="text-sm font-semibold mt-1">LKR {parseFloat(o.total).toLocaleString()}</div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label:'Place Order',    path:'/waiter/place-order',     emoji:'◈' },
            { label:'Process Orders', path:'/waiter/process-orders',  emoji:'◉' },
            { label:'Add Stock',      path:'/waiter/stock',           emoji:'✦' },
          ].map((a) => (
            <button key={a.label} onClick={() => navigate(a.path)}
              className="bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-yellow-400 hover:shadow-md transition-all">
              <div className="text-2xl mb-2">{a.emoji}</div>
              <div className="text-sm font-medium text-gray-800">{a.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
