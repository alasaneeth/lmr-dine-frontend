// src/components/pages/_SalesSummary.jsx
import React, { useState, useEffect } from 'react';
import PageHeader from '../common/PageHeader';
import { PageLoader, ErrorBanner } from '../common/ui';
import { invoiceApi } from '../../api/services';

export default function SalesSummary() {
  const [report,  setReport]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [range,   setRange]   = useState(7); // days

  const fetchReport = async () => {
    setLoading(true); setError(null);
    try {
      const end   = new Date();
      const start = new Date(Date.now() - range * 86400000);
      const data  = await invoiceApi.salesReport({
        startDate: start.toISOString().split('T')[0],
        endDate:   end.toISOString().split('T')[0],
      });
      setReport(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.response?.data?.error?.message || 'Failed to load sales data');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchReport(); }, [range]);

  const totalRevenue = report.reduce((s, d) => s + parseFloat(d.total_revenue || 0), 0);
  const totalOrders  = report.reduce((s, d) => s + parseInt(d.total_invoices || 0, 10), 0);
  const avgOrder     = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const maxRev       = Math.max(...report.map((d) => parseFloat(d.total_revenue || 0)), 1);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <PageHeader title="Sales Summary" subtitle="Revenue and order analytics" />

      <div className="p-6 space-y-6">
        {/* Range selector */}
        <div className="flex gap-2">
          {[7, 14, 30].map((d) => (
            <button key={d} onClick={() => setRange(d)}
              className={`px-4 py-2 rounded-lg text-sm border transition ${range===d ? 'bg-gray-900 text-white border-gray-900' : 'hover:bg-gray-50 text-gray-600'}`}>
              Last {d} days
            </button>
          ))}
        </div>

        {error && <ErrorBanner message={error} onRetry={fetchReport} />}

        {loading ? <PageLoader /> : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Total Revenue',   value: `LKR ${totalRevenue.toLocaleString('en', {minimumFractionDigits:2})}`, icon: '💰' },
                { label: 'Total Orders',    value: totalOrders,                                                             icon: '🧾' },
                { label: 'Average Order',   value: `LKR ${avgOrder.toFixed(2)}`,                                           icon: '📊' },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <div className="text-2xl mb-2">{s.icon}</div>
                  <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                  <div className="text-sm text-gray-400 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Bar chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Daily Revenue (LKR)</h3>
              {report.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-10">No sales data for this period</p>
              ) : (
                <div className="flex items-end gap-2 h-48 overflow-x-auto pb-2">
                  {report.map((d) => {
                    const height = (parseFloat(d.total_revenue || 0) / maxRev) * 160;
                    return (
                      <div key={d.day} className="flex flex-col items-center gap-1 flex-shrink-0" style={{ minWidth: '40px' }}>
                        <span className="text-xs text-gray-400">{(parseFloat(d.total_revenue||0)/1000).toFixed(1)}k</span>
                        <div title={`LKR ${parseFloat(d.total_revenue||0).toLocaleString()}`}
                          className="w-8 bg-yellow-400 hover:bg-yellow-500 rounded-t-md transition-all cursor-pointer"
                          style={{ height: `${Math.max(height, 4)}px` }} />
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {new Date(d.day).toLocaleDateString('en',{month:'short',day:'numeric'})}
                        </span>
                        <span className="text-xs text-gray-400">{d.total_invoices} orders</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Data table */}
            {report.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b">
                  <h3 className="font-semibold text-gray-900">Daily Breakdown</h3>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                    <tr>
                      {['Date','Orders','Revenue','Avg Order'].map((h) => (
                        <th key={h} className="text-left px-5 py-3 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {report.map((d) => (
                      <tr key={d.day} className="hover:bg-gray-50">
                        <td className="px-5 py-3 text-gray-700">{new Date(d.day).toLocaleDateString('en',{weekday:'short',month:'short',day:'numeric'})}</td>
                        <td className="px-5 py-3 text-gray-700">{d.total_invoices}</td>
                        <td className="px-5 py-3 font-medium text-gray-900">LKR {parseFloat(d.total_revenue||0).toLocaleString()}</td>
                        <td className="px-5 py-3 text-gray-500">
                          LKR {d.total_invoices > 0 ? (parseFloat(d.total_revenue||0)/parseInt(d.total_invoices,10)).toFixed(2) : '0.00'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
