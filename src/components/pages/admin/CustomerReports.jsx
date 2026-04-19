// src/components/pages/admin/CustomerReports.jsx
// NEW FILE – Customer-based reporting: Sales Report + Credit Report
// Access: Admin (full) & Cashier (read-only)
import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../common/PageHeader';
import { PageLoader, ErrorBanner } from '../../common/ui';
import { customerReportApi } from '../../../api/customerServices';
import { useAuth } from '../../../context/AuthContext';

// ── Tiny bar chart using pure CSS/divs ───────────────────────────────────────
function MiniBar({ value, max, colorClass = 'bg-yellow-400' }) {
  const pct = max > 0 ? Math.max(2, (value / max) * 100) : 2;
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5">
      <div className={`${colorClass} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ── Export to CSV helper ──────────────────────────────────────────────────────
function exportCSV(rows, filename) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── Date helpers ─────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().split('T')[0];
const daysAgo = (n) => {
  const d = new Date(); d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
};

// ── SALES REPORT TAB ─────────────────────────────────────────────────────────
function SalesReportTab({ isAdmin }) {
  const [report,   setReport]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [startDate, setStart]   = useState(daysAgo(30));
  const [endDate,   setEnd]     = useState(today());

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await customerReportApi.salesReport({ startDate, endDate });
      setReport(Array.isArray(data) ? data : (data.customers || []));
    } catch (e) {
      setError(e.response?.data?.error?.message || 'Failed to load sales report');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => { fetch(); }, [fetch]);

  const totalRevenue    = report.reduce((s, r) => s + parseFloat(r.total_spend || 0), 0);
  const totalOrders     = report.reduce((s, r) => s + parseInt(r.order_count || 0), 0);
  const maxSpend        = Math.max(...report.map((r) => parseFloat(r.total_spend || 0)), 1);

  const handleExport = () => {
    exportCSV(
      report.map((r) => ({
        'Customer Name': r.name,
        'Email':         r.email,
        'Phone':         r.phone,
        'Order Count':   r.order_count,
        'Total Spend':   r.total_spend,
        'Last Purchase': r.last_purchase || '',
      })),
      `customer-sales-${startDate}-to-${endDate}.csv`
    );
  };

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 font-medium">From</label>
          <input
            type="date" value={startDate}
            onChange={(e) => setStart(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 font-medium">To</label>
          <input
            type="date" value={endDate}
            onChange={(e) => setEnd(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>
        <div className="flex gap-2 ml-auto">
          {[7, 30, 90].map((d) => (
            <button key={d} onClick={() => { setStart(daysAgo(d)); setEnd(today()); }}
              className="text-xs border px-3 py-1.5 rounded-lg hover:bg-gray-50 transition text-gray-600">
              {d}d
            </button>
          ))}
        </div>
        {isAdmin && (
          <button
            onClick={handleExport}
            disabled={!report.length}
            className="text-sm border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition text-gray-600 flex items-center gap-2 disabled:opacity-40"
          >
            ⬇ Export CSV
          </button>
        )}
      </div>

      {error && <ErrorBanner message={error} onRetry={fetch} />}

      {loading ? <PageLoader /> : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Total Revenue',   value: `LKR ${totalRevenue.toLocaleString('en', { minimumFractionDigits: 2 })}`, icon: '💰', accent: true },
              { label: 'Total Orders',    value: totalOrders,           icon: '🧾' },
              { label: 'Active Customers',value: report.filter((r) => r.order_count > 0).length, icon: '👥' },
            ].map((s) => (
              <div key={s.label} className={`rounded-xl border p-5 shadow-sm ${s.accent ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'}`}>
                <div className="text-2xl mb-2">{s.icon}</div>
                <div className={`text-2xl font-bold ${s.accent ? 'text-yellow-700' : 'text-gray-900'}`}>{s.value}</div>
                <div className="text-sm text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Customer Sales Breakdown</h3>
              <span className="text-xs text-gray-400">{report.length} customers</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  <tr>
                    {['Rank', 'Customer', 'Orders', 'Total Spend', 'Avg Order', 'Last Purchase', 'Share'].map((h) => (
                      <th key={h} className="text-left px-5 py-3 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {report.map((r, i) => {
                    const spend    = parseFloat(r.total_spend || 0);
                    const orders   = parseInt(r.order_count || 0);
                    const avgOrd   = orders > 0 ? spend / orders : 0;
                    const sharePct = totalRevenue > 0 ? ((spend / totalRevenue) * 100).toFixed(1) : '0.0';
                    return (
                      <tr key={r.id || i} className="hover:bg-gray-50">
                        <td className="px-5 py-3">
                          <span className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-bold ${
                            i === 0 ? 'bg-yellow-400 text-gray-900' :
                            i === 1 ? 'bg-gray-200 text-gray-700' :
                            i === 2 ? 'bg-amber-200 text-amber-800' : 'text-gray-400'
                          }`}>
                            {i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="font-medium text-gray-900">{r.name}</div>
                          <div className="text-xs text-gray-400">{r.email}</div>
                        </td>
                        <td className="px-5 py-3 text-gray-700">{orders}</td>
                        <td className="px-5 py-3 font-semibold text-gray-900">
                          LKR {spend.toLocaleString()}
                          <MiniBar value={spend} max={maxSpend} />
                        </td>
                        <td className="px-5 py-3 text-gray-600">LKR {avgOrd.toFixed(0)}</td>
                        <td className="px-5 py-3 text-gray-400 text-xs">
                          {r.last_purchase ? new Date(r.last_purchase).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-5 py-3 text-gray-600">{sharePct}%</td>
                      </tr>
                    );
                  })}
                  {report.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center text-gray-400 py-12 text-sm">
                        No sales data for this period
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── CREDIT REPORT TAB ────────────────────────────────────────────────────────
function CreditReportTab({ isAdmin }) {
  const [report,  setReport]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [filter,  setFilter]  = useState('all'); // 'all' | 'overdue' | 'near-limit'

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await customerReportApi.creditReport();
      setReport(Array.isArray(data) ? data : (data.customers || []));
    } catch (e) {
      setError(e.response?.data?.error?.message || 'Failed to load credit report');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const filtered = report.filter((r) => {
    const pct = r.credit_limit > 0 ? (r.credit_used / r.credit_limit) * 100 : 0;
    if (filter === 'overdue')    return r.overdue_amount > 0;
    if (filter === 'near-limit') return pct >= 80;
    return true;
  });

  const totalOutstanding = report.reduce((s, r) => s + parseFloat(r.credit_used || 0), 0);
  const totalLimit       = report.reduce((s, r) => s + parseFloat(r.credit_limit || 0), 0);
  const overdueCnt       = report.filter((r) => r.overdue_amount > 0).length;

  const handleExport = () => {
    exportCSV(
      filtered.map((r) => ({
        'Customer':          r.name,
        'Email':             r.email,
        'Credit Limit':      r.credit_limit,
        'Credit Used':       r.credit_used,
        'Available Credit':  Math.max(0, (r.credit_limit || 0) - (r.credit_used || 0)),
        'Overdue Amount':    r.overdue_amount || 0,
        'Usage %':           r.credit_limit > 0 ? ((r.credit_used / r.credit_limit) * 100).toFixed(1) : '0',
      })),
      `credit-report-${today()}.csv`
    );
  };

  return (
    <div className="space-y-5">
      {/* Filter chips */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-center">
        {[
          { key: 'all',        label: 'All Customers' },
          { key: 'overdue',    label: `⚠ Overdue (${report.filter((r) => r.overdue_amount > 0).length})` },
          { key: 'near-limit', label: `🔴 Near Limit (${report.filter((r) => r.credit_limit > 0 && (r.credit_used / r.credit_limit) >= 0.8).length})` },
        ].map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-lg text-sm border transition ${filter === f.key ? 'bg-gray-900 text-white border-gray-900' : 'hover:bg-gray-50 text-gray-600'}`}>
            {f.label}
          </button>
        ))}
        {isAdmin && (
          <button
            onClick={handleExport}
            disabled={!filtered.length}
            className="ml-auto text-sm border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition text-gray-600 flex items-center gap-2 disabled:opacity-40"
          >
            ⬇ Export CSV
          </button>
        )}
      </div>

      {error && <ErrorBanner message={error} onRetry={fetch} />}

      {loading ? <PageLoader /> : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Total Outstanding', value: `LKR ${totalOutstanding.toLocaleString()}`, icon: '📋', accent: totalOutstanding > 0 },
              { label: 'Total Credit Issued', value: `LKR ${totalLimit.toLocaleString()}`, icon: '🏦' },
              { label: 'Overdue Accounts', value: overdueCnt, icon: '⚠️', warn: overdueCnt > 0 },
            ].map((s) => (
              <div key={s.label} className={`rounded-xl border p-5 shadow-sm ${
                s.warn && s.value > 0 ? 'bg-red-50 border-red-200' :
                s.accent ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'
              }`}>
                <div className="text-2xl mb-2">{s.icon}</div>
                <div className={`text-2xl font-bold ${
                  s.warn && s.value > 0 ? 'text-red-700' :
                  s.accent ? 'text-yellow-700' : 'text-gray-900'
                }`}>{s.value}</div>
                <div className="text-sm text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Credit table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Credit Overview</h3>
              <span className="text-xs text-gray-400">{filtered.length} customers</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  <tr>
                    {['Customer', 'Credit Limit', 'Used', 'Available', 'Usage', 'Overdue', 'Tier'].map((h) => (
                      <th key={h} className="text-left px-5 py-3 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((r, i) => {
                    const used      = parseFloat(r.credit_used || 0);
                    const limit     = parseFloat(r.credit_limit || 0);
                    const available = Math.max(0, limit - used);
                    const pct       = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
                    const overdue   = parseFloat(r.overdue_amount || 0);
                    return (
                      <tr key={r.id || i} className={`hover:bg-gray-50 ${overdue > 0 ? 'bg-red-50/30' : ''}`}>
                        <td className="px-5 py-3">
                          <div className="font-medium text-gray-900">{r.name}</div>
                          <div className="text-xs text-gray-400">{r.phone}</div>
                        </td>
                        <td className="px-5 py-3 text-gray-700">LKR {limit.toLocaleString()}</td>
                        <td className="px-5 py-3 font-medium text-gray-900">LKR {used.toLocaleString()}</td>
                        <td className="px-5 py-3 text-emerald-700">LKR {available.toLocaleString()}</td>
                        <td className="px-5 py-3 min-w-36">
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <MiniBar
                                value={pct}
                                max={100}
                                colorClass={pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-400' : 'bg-emerald-400'}
                              />
                            </div>
                            <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          {overdue > 0 ? (
                            <span className="text-red-600 font-medium">LKR {overdue.toLocaleString()}</span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                            r.tier === 'gold'     ? 'bg-yellow-100 text-yellow-700' :
                            r.tier === 'platinum' ? 'bg-indigo-100 text-indigo-700' :
                            r.tier === 'silver'   ? 'bg-gray-100 text-gray-600' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {r.tier || 'bronze'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center text-gray-400 py-12 text-sm">
                        No records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── MAIN REPORTS PAGE ─────────────────────────────────────────────────────────
export default function CustomerReports() {
  const { user } = useAuth();
  const isAdmin  = user?.role === 'admin';
  const [tab, setTab] = useState('sales');

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <PageHeader
        title="Customer Reports"
        subtitle={isAdmin ? 'Full access — sales & credit analytics' : 'Read-only view'}
      />

      <div className="p-6 space-y-5">
        {/* Tab switcher */}
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit">
          {[
            { key: 'sales',  label: '📊 Sales Report' },
            { key: 'credit', label: '📋 Credit Report' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-2 text-sm rounded-lg transition font-medium ${
                tab === t.key
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'sales'  && <SalesReportTab  isAdmin={isAdmin} />}
        {tab === 'credit' && <CreditReportTab isAdmin={isAdmin} />}
      </div>
    </div>
  );
}
