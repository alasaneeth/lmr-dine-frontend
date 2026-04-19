// src/components/pages/admin/CustomerManagement.jsx
// NEW FILE – Admin & Cashier can view; only Admin can create/edit/delete
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../common/PageHeader';
import {
  PageLoader, ErrorBanner, StatusBadge, Pagination,
  ConfirmModal, useToast,
} from '../../common/ui';
import { customerApi } from '../../../api/customerServices';
import { useDebounce, usePagination } from '../../../hooks';
import { useAuth } from '../../../context/AuthContext';
import CustomerFormModal from './CustomerFormModal';

const STATUSES = ['all', 'active', 'inactive', 'suspended'];
const TIERS    = ['all', 'bronze', 'silver', 'gold', 'platinum'];

export default function CustomerManagement() {
  const { user }   = useAuth();
  const toast      = useToast();
  const navigate   = useNavigate();
  const isAdmin    = user?.role === 'admin';
  const pagination = usePagination(10);

  const [customers,     setCustomers]     = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [statusFilter,  setStatusFilter]  = useState('all');
  const [tierFilter,    setTierFilter]    = useState('all');
  const [confirm,       setConfirm]       = useState(null);
  const [showForm,      setShowForm]      = useState(false);
  const [editTarget,    setEditTarget]    = useState(null);

  const debouncedSearch = useDebounce(pagination.search);

  const fetchCustomers = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = {
        page:   pagination.page,
        limit:  pagination.limit,
        search: debouncedSearch,
      };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (tierFilter   !== 'all') params.tier   = tierFilter;
      const data = await customerApi.getAll(params);
      setCustomers(data.customers || []);
      pagination.setTotal(data.total || 0);
    } catch (e) {
      setError(e.response?.data?.error?.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, debouncedSearch, statusFilter, tierFilter]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handleDelete = async (id) => {
    try {
      await customerApi.remove(id);
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      toast('Customer deleted', 'success');
    } catch (e) {
      toast(e.response?.data?.error?.message || 'Failed to delete customer', 'error');
    } finally {
      setConfirm(null);
    }
  };

  const handleStatusToggle = async (customer) => {
    const next = customer.status === 'active' ? 'inactive' : 'active';
    try {
      await customerApi.setStatus(customer.id, next);
      setCustomers((prev) =>
        prev.map((c) => (c.id === customer.id ? { ...c, status: next } : c))
      );
      toast(`${customer.name} set to ${next}`, 'success');
    } catch (e) {
      toast(e.response?.data?.error?.message || 'Status update failed', 'error');
    }
  };

  const handleFormSuccess = (saved, isNew) => {
    toast(`Customer ${isNew ? 'created' : 'updated'} successfully`, 'success');
    setShowForm(false);
    setEditTarget(null);
    fetchCustomers();
  };

  const openCreate = () => { setEditTarget(null); setShowForm(true); };
  const openEdit   = (c)  => { setEditTarget(c);   setShowForm(true); };

  const tierBadge = (tier) => {
    const map = {
      bronze:   'bg-amber-100 text-amber-700',
      silver:   'bg-gray-100 text-gray-600',
      gold:     'bg-yellow-100 text-yellow-700',
      platinum: 'bg-indigo-100 text-indigo-700',
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${map[tier] || 'bg-gray-100 text-gray-500'}`}>
        {tier || 'none'}
      </span>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <PageHeader
        title="Customer Management"
        subtitle="Manage customer profiles, credit limits, and tiers"
        actions={
          isAdmin && (
            <button
              onClick={openCreate}
              className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
            >
              <span>+</span> Add Customer
            </button>
          )
        }
      />

      <div className="p-6 space-y-4">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-center">
          <input
            placeholder="Search name, email, or phone…"
            value={pagination.search}
            onChange={(e) => pagination.updateSearch(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 flex-1 min-w-52"
          />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); pagination.resetPage(); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
          <select
            value={tierFilter}
            onChange={(e) => { setTierFilter(e.target.value); pagination.resetPage(); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
          >
            {TIERS.map((t) => (
              <option key={t} value={t}>
                {t === 'all' ? 'All Tiers' : t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
          <button
            onClick={() => navigate('/admin/customer-reports')}
            className="text-sm border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition text-gray-600 flex items-center gap-2"
          >
            📊 Reports
          </button>
        </div>

        {error && <ErrorBanner message={error} onRetry={fetchCustomers} />}

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <PageLoader />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                    <tr>
                      {['Customer', 'Contact', 'Tier', 'Credit Used / Limit', 'Status', 'Joined', 'Actions'].map((h) => (
                        <th key={h} className="text-left px-5 py-3 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {customers.map((c) => {
                      const creditPct = c.credit_limit > 0
                        ? Math.min(100, Math.round((c.credit_used / c.credit_limit) * 100))
                        : 0;
                      return (
                        <tr key={c.id} className="hover:bg-gray-50">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center text-sm font-bold shrink-0">
                                {(c.name || '?')[0].toUpperCase()}
                              </div>
                              <div>
                                <button
                                  onClick={() => navigate(`/admin/customers/${c.id}`)}
                                  className="font-medium text-gray-900 hover:text-yellow-600 transition text-left"
                                >
                                  {c.name}
                                </button>
                                <div className="text-xs text-gray-400"># {c.customer_code || c.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <div className="text-gray-700">{c.email}</div>
                            <div className="text-xs text-gray-400">{c.phone}</div>
                          </td>
                          <td className="px-5 py-3">{tierBadge(c.tier)}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-100 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full transition-all ${
                                    creditPct >= 90 ? 'bg-red-500' :
                                    creditPct >= 70 ? 'bg-yellow-400' : 'bg-emerald-400'
                                  }`}
                                  style={{ width: `${creditPct}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500 whitespace-nowrap">
                                LKR {(c.credit_used || 0).toLocaleString()} / {(c.credit_limit || 0).toLocaleString()}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <StatusBadge status={c.status} />
                          </td>
                          <td className="px-5 py-3 text-gray-400 text-xs">
                            {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex gap-2 items-center">
                              <button
                                onClick={() => navigate(`/admin/customers/${c.id}`)}
                                className="text-xs border px-2.5 py-1 rounded-full hover:bg-gray-50 transition text-gray-600"
                              >
                                View
                              </button>
                              {isAdmin && (
                                <>
                                  <button
                                    onClick={() => openEdit(c)}
                                    className="text-xs border px-2.5 py-1 rounded-full hover:bg-gray-50 transition text-gray-600"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleStatusToggle(c)}
                                    className="text-xs border px-2.5 py-1 rounded-full hover:bg-gray-50 transition text-gray-600"
                                  >
                                    {c.status === 'active' ? 'Deactivate' : 'Activate'}
                                  </button>
                                  <button
                                    onClick={() => setConfirm({ id: c.id, name: c.name })}
                                    className="text-xs border border-red-200 text-red-600 px-2.5 py-1 rounded-full hover:bg-red-50 transition"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {customers.length === 0 && (
                  <div className="text-center text-gray-400 py-12 text-sm">
                    No customers found
                  </div>
                )}
              </div>
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                onNext={pagination.nextPage}
                onPrev={pagination.prevPage}
                onGoTo={pagination.goTo}
              />
            </>
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showForm && (
        <CustomerFormModal
          customer={editTarget}
          onSuccess={handleFormSuccess}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
        />
      )}

      {/* Delete Confirmation */}
      {confirm && (
        <ConfirmModal
          title="Delete Customer"
          message={`Are you sure you want to delete ${confirm.name}? This cannot be undone.`}
          onConfirm={() => handleDelete(confirm.id)}
          onCancel={() => setConfirm(null)}
          danger
        />
      )}
    </div>
  );
}
