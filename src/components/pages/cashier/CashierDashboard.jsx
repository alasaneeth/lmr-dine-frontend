// src/components/pages/cashier/CashierDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader      from '../../common/PageHeader';
import StatCard        from '../../common/StatCard';
import { PageLoader, ErrorBanner, StatusBadge } from '../../common/ui';
import { invoiceApi, orderApi } from '../../../api/services';
import { useSocket } from '../../../context/SocketContext';

export default function CashierDashboard() {
  const navigate = useNavigate();
  const { subscribe, unsubscribe } = useSocket();

  const [invoices, setInvoices] = useState([]);
  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [invData, ordData] = await Promise.all([
        invoiceApi.getAll({ limit: 10, status: 'pending' }),
        orderApi.getAll({ status: 'served', limit: 10 }),
      ]);
      setInvoices(invData.invoices || []);
      setOrders(ordData.orders || []);
    } catch (e) { setError('Failed to load dashboard'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const h = () => fetchData();
    subscribe('order:status', h);
    return () => unsubscribe('order:status', h);
  }, [subscribe, unsubscribe, fetchData]);

  const todayTotal = invoices
    .filter((i) => i.status === 'paid')
    .reduce((s, i) => s + parseFloat(i.total), 0);

  if (loading) return <PageLoader />;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <PageHeader title="Cashier Dashboard" subtitle="Billing overview and pending payments" />

      <div className="p-6 space-y-6">
        {error && <ErrorBanner message={error} onRetry={fetchData} />}

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Pending Invoices" value={invoices.length}           sub="Awaiting payment"   icon="💳" accent />
          <StatCard label="Orders to Bill"   value={orders.length}             sub="Served, not billed" icon="🧾" />
          <StatCard label="Today's Revenue"  value={`LKR ${todayTotal.toLocaleString()}`} sub="Paid today" icon="💰" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending invoices */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex justify-between items-center px-5 py-4 border-b">
              <h3 className="font-semibold text-gray-900">Pending Invoices</h3>
              <button onClick={() => navigate('/cashier/billing')} className="text-xs text-yellow-600 hover:underline font-medium">Manage →</button>
            </div>
            <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
              {invoices.length === 0
                ? <p className="text-center text-gray-400 py-8 text-sm">All clear! No pending invoices.</p>
                : invoices.map((inv) => (
                  <div key={inv.id} className="px-5 py-3 flex justify-between items-center hover:bg-gray-50">
                    <div>
                      <div className="font-mono text-xs text-gray-400">{inv.invoice_no}</div>
                      <div className="text-sm text-gray-700">{inv.order?.table_no || '—'}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900 text-sm">LKR {parseFloat(inv.total).toLocaleString()}</div>
                      <StatusBadge status={inv.status} />
                    </div>
                  </div>
                ))
              }
            </div>
          </div>

          {/* Served orders awaiting billing */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex justify-between items-center px-5 py-4 border-b">
              <h3 className="font-semibold text-gray-900">Orders Ready to Bill</h3>
              <button onClick={() => navigate('/cashier/billing')} className="text-xs text-yellow-600 hover:underline font-medium">Bill now →</button>
            </div>
            <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
              {orders.length === 0
                ? <p className="text-center text-gray-400 py-8 text-sm">No orders awaiting billing.</p>
                : orders.map((o) => (
                  <div key={o.id} className="px-5 py-3 flex justify-between items-center hover:bg-gray-50">
                    <div>
                      <div className="font-mono text-xs text-gray-400">{o.order_no}</div>
                      <div className="text-sm font-medium text-gray-900">{o.table_no}</div>
                      <div className="text-xs text-gray-400">{o.customer_name || 'Walk-in'}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900 text-sm">LKR {parseFloat(o.total).toLocaleString()}</div>
                      <StatusBadge status={o.status} />
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label:'Invoice / Billing', path:'/cashier/billing', emoji:'◻' },
            { label:'Sales Summary',     path:'/cashier/sales',   emoji:'◈' },
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
