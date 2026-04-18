// src/components/pages/admin/InvoiceManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../common/PageHeader';
import { PageLoader, ErrorBanner, StatusBadge, Pagination, useToast } from '../../common/ui';
import { invoiceApi } from '../../../api/services';
import { usePagination, useDebounce } from '../../../hooks';

export default function InvoiceManagement() {
  const toast      = useToast();
  const pagination = usePagination(12);

  const [invoices,  setInvoices]  = useState([]);
  const [selected,  setSelected]  = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [statusFilter, setStatus] = useState('all');
  const debouncedSearch = useDebounce(pagination.search);

  const fetchInvoices = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = { page: pagination.page, limit: pagination.limit, search: debouncedSearch };
      if (statusFilter !== 'all') params.status = statusFilter;
      const data = await invoiceApi.getAll(params);
      setInvoices(data.invoices || []);
      pagination.setTotal(data.total || 0);
    } catch (e) {
      setError(e.response?.data?.error?.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, debouncedSearch, statusFilter]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const handlePay = async (id) => {
    try {
      const updated = await invoiceApi.markPaid(id);
      setInvoices((prev) => prev.map((i) => i.id === id ? { ...i, status: 'paid' } : i));
      if (selected?.id === id) setSelected({ ...selected, status: 'paid' });
      toast('Invoice marked as paid', 'success');
    } catch (e) {
      toast(e.response?.data?.error?.message || 'Failed to mark paid', 'error');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <PageHeader title="Invoice Management" subtitle="Track and manage billing" />

      <div className="p-6 space-y-5">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3">
          <input
            placeholder="Search invoice number…"
            value={pagination.search}
            onChange={(e) => pagination.updateSearch(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 flex-1 min-w-48"
          />
          {['all','pending','paid','void'].map((s) => (
            <button key={s}
              onClick={() => { setStatus(s); pagination.resetPage(); }}
              className={`px-3 py-2 rounded-lg text-sm border transition capitalize ${statusFilter===s ? 'bg-gray-900 text-white border-gray-900' : 'hover:bg-gray-50'}`}
            >{s === 'all' ? 'All' : s}</button>
          ))}
        </div>

        {error && <ErrorBanner message={error} onRetry={fetchInvoices} />}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {loading ? <PageLoader /> : (
              <>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                    <tr>{['Invoice','Order','Table','Total','Status','Date'].map((h) => (
                      <th key={h} className="text-left px-5 py-3 font-medium">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {invoices.map((inv) => (
                      <tr key={inv.id} onClick={() => setSelected(inv)}
                        className={`cursor-pointer hover:bg-gray-50 ${selected?.id===inv.id?'bg-yellow-50':''}`}>
                        <td className="px-5 py-3 font-mono text-xs text-gray-500">{inv.invoice_no}</td>
                        <td className="px-5 py-3 font-mono text-xs text-gray-400">{inv.order?.order_no||'—'}</td>
                        <td className="px-5 py-3 text-gray-700">{inv.order?.table_no||'—'}</td>
                        <td className="px-5 py-3 font-semibold text-gray-900">LKR {parseFloat(inv.total).toLocaleString()}</td>
                        <td className="px-5 py-3"><StatusBadge status={inv.status} /></td>
                        <td className="px-5 py-3 text-gray-400 text-xs">{new Date(inv.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {invoices.length === 0 && <p className="text-center text-gray-400 py-10 text-sm">No invoices found</p>}
                <Pagination page={pagination.page} totalPages={pagination.totalPages}
                  onNext={pagination.nextPage} onPrev={pagination.prevPage} onGoTo={pagination.goTo} />
              </>
            )}
          </div>

          {/* Detail panel */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 h-fit">
            {!selected ? (
              <div className="text-center text-gray-400 py-10 text-sm">Select an invoice to view details</div>
            ) : (
              <>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 font-mono">{selected.invoice_no}</h3>
                    <p className="text-xs text-gray-400">{new Date(selected.created_at).toLocaleString()}</p>
                  </div>
                  <StatusBadge status={selected.status} />
                </div>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between"><span className="text-gray-500">Order</span><span className="font-mono text-xs">{selected.order?.order_no||'—'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Table</span><span>{selected.order?.table_no||'—'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>LKR {parseFloat(selected.subtotal).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Tax</span><span>LKR {parseFloat(selected.tax||0).toLocaleString()}</span></div>
                  <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t">
                    <span>Total</span><span>LKR {parseFloat(selected.total).toLocaleString()}</span>
                  </div>
                </div>
                {selected.status === 'pending' && (
                  <button onClick={() => handlePay(selected.id)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-2.5 text-sm font-medium">
                    ✓ Mark as Paid
                  </button>
                )}
                {selected.status === 'paid' && selected.paid_at && (
                  <p className="text-xs text-gray-400 text-center">Paid on {new Date(selected.paid_at).toLocaleString()}</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
