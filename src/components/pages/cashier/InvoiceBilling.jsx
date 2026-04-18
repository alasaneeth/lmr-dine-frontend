// src/components/pages/cashier/InvoiceBilling.jsx
import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../common/PageHeader';
import { PageLoader, ErrorBanner, StatusBadge, useToast, Spinner } from '../../common/ui';
import { invoiceApi, orderApi } from '../../../api/services';

const PAYMENT_METHODS = ['cash', 'card', 'online'];

export default function InvoiceBilling() {
  const toast = useToast();

  const [servedOrders, setServedOrders] = useState([]);
  const [invoices,     setInvoices]     = useState([]);
  const [selected,     setSelected]     = useState(null); // selected order to bill
  const [viewInvoice,  setViewInvoice]  = useState(null);
  const [payMethod,    setPayMethod]    = useState('cash');
  const [loading,      setLoading]      = useState(true);
  const [billing,      setBilling]      = useState(false);
  const [paying,       setPaying]       = useState(false);
  const [error,        setError]        = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [ordData, invData] = await Promise.all([
        orderApi.getAll({ status: 'served', limit: 50 }),
        invoiceApi.getAll({ limit: 20, status: 'pending' }),
      ]);
      setServedOrders(ordData.orders || []);
      setInvoices(invData.invoices || []);
    } catch (e) { setError('Failed to load billing data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const createInvoice = async () => {
    if (!selected) return;
    setBilling(true);
    try {
      const inv = await invoiceApi.create({ orderId: selected.id, paymentMethod: payMethod });
      toast(`Invoice ${inv.invoice_no} created`, 'success');
      setSelected(null);
      fetchData();
    } catch (e) {
      toast(e.response?.data?.error?.message || 'Failed to create invoice', 'error');
    } finally { setBilling(false); }
  };

  const markPaid = async (invoiceId) => {
    setPaying(invoiceId);
    try {
      await invoiceApi.markPaid(invoiceId);
      toast('Invoice marked as paid', 'success');
      setViewInvoice(null);
      fetchData();
    } catch (e) {
      toast(e.response?.data?.error?.message || 'Failed to mark paid', 'error');
    } finally { setPaying(null); }
  };

  const printReceipt = (invoice) => {
    const items = (invoice.order?.items || [])
      .map((i) => `<tr><td>${i.name}</td><td style="text-align:center">${i.qty}</td><td style="text-align:right">LKR ${parseFloat(i.subtotal).toFixed(2)}</td></tr>`)
      .join('');
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><title>Receipt</title>
      <style>body{font-family:Arial,sans-serif;padding:32px;max-width:380px;margin:0 auto}
      h1{text-align:center;font-size:20px}table{width:100%;border-collapse:collapse}
      th{font-size:11px;color:#888;border-bottom:1px solid #eee;padding:4px 0;text-align:left}
      td{padding:5px 0;font-size:13px}th:nth-child(2),td:nth-child(2){text-align:center}
      th:last-child,td:last-child{text-align:right}.total{font-size:16px;font-weight:bold;border-top:1px solid #eee;padding-top:8px;display:flex;justify-content:space-between}
      .footer{text-align:center;color:#aaa;font-size:11px;margin-top:20px}</style></head>
      <body><h1>RestoMS</h1><p style="text-align:center;color:#888;font-size:12px">Receipt</p>
      <p style="font-size:13px"><b>Invoice:</b> ${invoice.invoice_no}</p>
      <p style="font-size:13px"><b>Table:</b> ${invoice.order?.table_no || '—'}</p>
      <hr/><table><thead><tr><th>Item</th><th>Qty</th><th>Amount</th></tr></thead>
      <tbody>${items}</tbody></table><hr/>
      <div class="total"><span>Total</span><span>LKR ${parseFloat(invoice.total).toFixed(2)}</span></div>
      <div class="footer">Thank you for dining with us!</div></body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <PageHeader title="Invoice / Billing" subtitle="Create and process customer payments" />

      <div className="p-6 space-y-5">
        {error && <ErrorBanner message={error} onRetry={fetchData} />}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create invoice from served order */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b">
              <h3 className="font-semibold text-gray-900">Create Invoice</h3>
              <p className="text-xs text-gray-400 mt-0.5">Select a served order to generate an invoice</p>
            </div>
            {loading ? <PageLoader /> : (
              <>
                <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                  {servedOrders.length === 0
                    ? <p className="text-center text-gray-400 py-8 text-sm">No served orders awaiting billing</p>
                    : servedOrders.map((o) => (
                      <div key={o.id} onClick={() => setSelected(selected?.id===o.id ? null : o)}
                        className={`px-5 py-3 cursor-pointer hover:bg-gray-50 flex justify-between items-center ${selected?.id===o.id?'bg-yellow-50 border-l-4 border-yellow-400':''}`}>
                        <div>
                          <div className="font-mono text-xs text-gray-400">{o.order_no}</div>
                          <div className="text-sm font-medium text-gray-900">{o.table_no}</div>
                          <div className="text-xs text-gray-400">{o.customer_name || 'Walk-in'} · {(o.items||[]).length} items</div>
                        </div>
                        <div className="font-semibold text-gray-900 text-sm">LKR {parseFloat(o.total).toLocaleString()}</div>
                      </div>
                    ))
                  }
                </div>
                {selected && (
                  <div className="p-4 border-t bg-gray-50">
                    <p className="text-sm text-gray-700 mb-3">Payment method for <span className="font-semibold">{selected.order_no}</span>:</p>
                    <div className="flex gap-2 mb-3">
                      {PAYMENT_METHODS.map((m) => (
                        <button key={m} onClick={() => setPayMethod(m)}
                          className={`flex-1 py-1.5 rounded-lg border text-xs capitalize transition ${payMethod===m?'bg-gray-900 text-white border-gray-900':'hover:bg-gray-50'}`}>
                          {m}
                        </button>
                      ))}
                    </div>
                    <button onClick={createInvoice} disabled={billing}
                      className="w-full bg-yellow-500 hover:bg-yellow-400 text-gray-900 rounded-lg py-2.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                      {billing ? <><Spinner size="sm" />Creating…</> : '+ Generate Invoice'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Pending invoices */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b">
              <h3 className="font-semibold text-gray-900">Pending Invoices</h3>
              <p className="text-xs text-gray-400 mt-0.5">Click to pay or print</p>
            </div>
            {loading ? <PageLoader /> : (
              <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                {invoices.length === 0
                  ? <p className="text-center text-gray-400 py-8 text-sm">No pending invoices</p>
                  : invoices.map((inv) => (
                    <div key={inv.id} onClick={() => setViewInvoice(viewInvoice?.id===inv.id ? null : inv)}
                      className={`px-5 py-3 cursor-pointer hover:bg-gray-50 ${viewInvoice?.id===inv.id?'bg-yellow-50 border-l-4 border-yellow-400':''}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-mono text-xs text-gray-400">{inv.invoice_no}</div>
                          <div className="text-sm font-medium text-gray-900">{inv.order?.table_no || '—'}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-900">LKR {parseFloat(inv.total).toLocaleString()}</div>
                          <StatusBadge status={inv.status} />
                        </div>
                      </div>
                      {viewInvoice?.id === inv.id && (
                        <div className="flex gap-2 mt-2">
                          <button onClick={(e) => { e.stopPropagation(); markPaid(inv.id); }}
                            disabled={paying === inv.id}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-1.5 text-xs font-medium flex items-center justify-center gap-1 disabled:opacity-60">
                            {paying === inv.id ? <Spinner size="sm" /> : '✓ Mark Paid'}
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); printReceipt(inv); }}
                            className="px-3 py-1.5 border rounded-lg text-xs hover:bg-gray-50 text-gray-600">
                            🖨 Print
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
