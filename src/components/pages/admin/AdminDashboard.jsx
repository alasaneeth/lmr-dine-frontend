// src/components/pages/admin/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate }       from 'react-router-dom';
import PageHeader            from '../../common/PageHeader';
import StatCard              from '../../common/StatCard';
import { PageLoader, ErrorBanner, StatusBadge } from '../../common/ui';
import { dashboardApi }      from '../../../api/services';
import { useSocket }         from '../../../context/SocketContext';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { subscribe, unsubscribe } = useSocket();

  const [stats,   setStats]   = useState(null);
  const [sales,   setSales]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetchData = async () => {
    setLoading(true); setError(null);
    try {
      const [statsData, salesData] = await Promise.all([
        dashboardApi.adminStats(),
        dashboardApi.weeklySales(),
      ]);
      setStats(statsData);
      setSales(salesData);
    } catch (e) {
      setError(e.response?.data?.error?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Live update: re-fetch when a new order arrives
  useEffect(() => {
    const handler = () => fetchData();
    subscribe('order:new',    handler);
    subscribe('order:status', handler);
    return () => { unsubscribe('order:new', handler); unsubscribe('order:status', handler); };
  }, [subscribe, unsubscribe]);

  if (loading) return <PageLoader />;
  if (error)   return <div className="p-6"><ErrorBanner message={error} onRetry={fetchData} /></div>;

  const maxRevenue = Math.max(...sales.map((d) => parseFloat(d.revenue || 0)), 1);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <PageHeader title="Admin Dashboard" subtitle="Live overview of restaurant operations" />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Today's Revenue"  value={`LKR ${parseFloat(stats.todayRevenue||0).toLocaleString()}`} sub="Paid invoices today" accent icon="💰" />
          <StatCard label="Total Orders"     value={stats.totalOrders}   sub="All time"       icon="🧾" />
          <StatCard label="Pending Orders"   value={stats.pendingOrders} sub="Need attention" icon="⏳" />
          <StatCard label="Registered Users" value={stats.totalUsers}    sub="All roles"      icon="👥" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue chart */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Weekly Revenue (LKR)</h3>
            {sales.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-10">No sales data yet</p>
            ) : (
              <div className="flex items-end gap-3 h-40">
                {sales.map((d) => (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-gray-400">{(parseFloat(d.revenue||0)/1000).toFixed(1)}k</span>
                    <div
                      className="w-full bg-yellow-400 rounded-t-md transition-all"
                      style={{ height: `${(parseFloat(d.revenue||0) / maxRevenue) * 120}px`, minHeight: '4px' }}
                    />
                    <span className="text-xs text-gray-500">{new Date(d.day).toLocaleDateString('en',{weekday:'short'})}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top items */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Top Selling Items</h3>
            <div className="space-y-3">
              {(stats.topItems || []).map((item, i) => (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 w-4">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{item.name}</div>
                    <div className="text-xs text-gray-400">{item.total_sold} sold</div>
                  </div>
                  <span className="text-xs font-semibold text-gray-700">
                    LKR {parseFloat(item.total_revenue||0).toLocaleString()}
                  </span>
                </div>
              ))}
              {(stats.topItems||[]).length === 0 && <p className="text-gray-400 text-sm">No data yet</p>}
            </div>
          </div>
        </div>

        {/* Recent orders */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h3 className="font-semibold text-gray-900">Recent Orders</h3>
            <button onClick={() => navigate('/admin/process-orders')} className="text-xs text-yellow-600 font-medium hover:underline">
              View all →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <tr>{['Order', 'Table', 'Customer', 'Items', 'Total', 'Status', 'Time'].map((h) => (
                  <th key={h} className="text-left px-5 py-3 font-medium">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(stats.recentOrders || []).map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-mono text-xs text-gray-500">{o.order_no}</td>
                    <td className="px-5 py-3 text-gray-800">{o.table_no}</td>
                    <td className="px-5 py-3 text-gray-800">{o.customer_name || '—'}</td>
                    <td className="px-5 py-3 text-gray-500">{(o.items||[]).length} items</td>
                    <td className="px-5 py-3 font-medium">LKR {parseFloat(o.total).toLocaleString()}</td>
                    <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{new Date(o.placed_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(stats.recentOrders||[]).length === 0 && (
              <p className="text-center text-gray-400 py-8 text-sm">No orders yet</p>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Create New Item',    path: '/admin/create-item',   emoji: '✦' },
            { label: 'Process Orders',     path: '/admin/process-orders',emoji: '◉' },
            { label: 'Invoice Management', path: '/admin/invoices',      emoji: '◻' },
            { label: 'User Management',    path: '/admin/users',         emoji: '◎' },
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
