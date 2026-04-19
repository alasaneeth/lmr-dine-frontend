// src/components/pages/admin/CustomerDetail.jsx
// NEW FILE – Detailed customer profile page (Admin & Cashier read access; Admin can edit)
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../../common/PageHeader';
import { PageLoader, ErrorBanner, StatusBadge, useToast } from '../../common/ui';
import { customerApi, customerReportApi } from '../../../api/customerServices';
import { useAuth } from '../../../context/AuthContext';
import CustomerFormModal from './CustomerFormModal';

const TIER_COLORS = {
  bronze:   'bg-amber-100 text-amber-700 border-amber-200',
  silver:   'bg-gray-100 text-gray-600 border-gray-200',
  gold:     'bg-yellow-100 text-yellow-700 border-yellow-200',
  platinum: 'bg-indigo-100 text-indigo-700 border-indigo-200',
};

export default function CustomerDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const toast      = useToast();
  const { user }   = useAuth();
  const isAdmin    = user?.role === 'admin';

  const [customer,  setCustomer]  = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [showEdit,  setShowEdit]  = useState(false);
  const [tab,       setTab]       = useState('overview'); // 'overview' | 'transactions' | 'credit'

  const fetchCustomer = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [cust, salesData] = await Promise.all([
        customerApi.getById(id),
        customerReportApi.customerSalesDetail(id, { limit: 20 }),
      ]);
      setCustomer(cust);
      setPurchases(salesData?.transactions || []);
    } catch (e) {
      setError(e.response?.data?.error?.message || 'Failed to load customer');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchCustomer(); }, [fetchCustomer]);

  const handleEditSuccess = () => {
    toast('Customer updated', 'success');
    setShowEdit(false);
    fetchCustomer();
  };

  if (loading) return <PageLoader />;
  if (error)   return <div className="p-6"><ErrorBanner message={error} onRetry={fetchCustomer} /></div>;
  if (!customer) return null;

  const creditPct = customer.credit_limit > 0
    ? Math.min(100, Math.round((customer.credit_used / customer.credit_limit) * 100))
    : 0;

  const totalSpend  = purchases.reduce((s, p) => s + parseFloat(p.total || 0), 0);
  const tierCls     = TIER_COLORS[customer.tier] || 'bg-gray-100 text-gray-500 border-gray-200';

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <PageHeader
        title={customer.name}
        subtitle={`Customer #${customer.customer_code || customer.id}`}
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => navigate(-1)}
              className="text-sm border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition text-gray-600"
            >
              ← Back
            </button>
            {isAdmin && (
              <button
                onClick={() => setShowEdit(true)}
                className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
              >
                Edit Customer
              </button>
            )}
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Profile card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-yellow-100 text-yellow-700 flex items-center justify-center text-2xl font-bold shrink-0">
              {customer.name[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-semibold text-gray-900">{customer.name}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${tierCls}`}>
                  {customer.tier || 'none'} tier
                </span>
                <StatusBadge status={customer.status} />
              </div>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
                {customer.email && <span>✉ {customer.email}</span>}
                {customer.phone && <span>📞 {customer.phone}</span>}
                {customer.address && <span>📍 {customer.address}</span>}
              </div>
              {customer.notes && (
                <p className="mt-2 text-xs text-gray-400 italic">{customer.notes}</p>
              )}
            </div>
            <div className="text-right shrink-0 hidden sm:block">
              <div className="text-xs text-gray-400">Member since</div>
              <div className="text-sm font-medium text-gray-700">
                {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Spend',       value: `LKR ${totalSpend.toLocaleString()}`,             icon: '💰' },
            { label: 'Transactions',      value: purchases.length,                                  icon: '🧾' },
            { label: 'Credit Used',       value: `LKR ${(customer.credit_used || 0).toLocaleString()}`, icon: '📋' },
            { label: 'Credit Available',  value: `LKR ${Math.max(0, (customer.credit_limit || 0) - (customer.credit_used || 0)).toLocaleString()}`, icon: '✅' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="text-xl mb-2">{s.icon}</div>
              <div className="text-xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Credit bar */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900">Credit Usage</h3>
            <span className="text-sm font-semibold text-gray-700">{creditPct}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-700 ${
                creditPct >= 90 ? 'bg-red-500' :
                creditPct >= 70 ? 'bg-yellow-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${creditPct}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>LKR {(customer.credit_used || 0).toLocaleString()} used</span>
            <span>LKR {(customer.credit_limit || 0).toLocaleString()} limit</span>
          </div>
          {creditPct >= 90 && (
            <p className="mt-2 text-xs text-red-600 font-medium">⚠ Credit limit nearly reached</p>
          )}
        </div>

        {/* Tabs */}
        <div>
          <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit">
            {['overview', 'transactions'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm rounded-lg capitalize transition ${
                  tab === t
                    ? 'bg-gray-900 text-white font-medium'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === 'overview' && (
            <div className="mt-4 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="font-medium text-gray-900 mb-3">Customer Details</h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {[
                  ['Full Name',      customer.name],
                  ['Email',          customer.email || '—'],
                  ['Phone',          customer.phone || '—'],
                  ['Address',        customer.address || '—'],
                  ['Loyalty Tier',   (customer.tier || 'none').toUpperCase()],
                  ['Credit Limit',   `LKR ${(customer.credit_limit || 0).toLocaleString()}`],
                  ['Status',         customer.status],
                  ['Customer Code',  customer.customer_code || customer.id],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-0.5">
                    <dt className="text-xs text-gray-400 uppercase tracking-wide">{k}</dt>
                    <dd className="text-gray-800 font-medium capitalize">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {tab === 'transactions' && (
            <div className="mt-4 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                    <tr>
                      {['Invoice #', 'Date', 'Items', 'Amount', 'Status'].map((h) => (
                        <th key={h} className="text-left px-5 py-3 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {purchases.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3 font-mono text-xs text-gray-500">{p.invoice_no || p.id}</td>
                        <td className="px-5 py-3 text-gray-600">
                          {p.date ? new Date(p.date).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-5 py-3 text-gray-500">{p.item_count || '—'} items</td>
                        <td className="px-5 py-3 font-medium text-gray-900">
                          LKR {parseFloat(p.total || 0).toLocaleString()}
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge status={p.status || 'paid'} />
                        </td>
                      </tr>
                    ))}
                    {purchases.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center text-gray-400 py-10 text-sm">
                          No transactions found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {showEdit && (
        <CustomerFormModal
          customer={customer}
          onSuccess={handleEditSuccess}
          onClose={() => setShowEdit(false)}
        />
      )}
    </div>
  );
}
