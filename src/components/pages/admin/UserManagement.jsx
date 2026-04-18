// src/components/pages/admin/UserManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../common/PageHeader';
import {
  PageLoader, ErrorBanner, StatusBadge, Pagination,
  ConfirmModal, useToast,
} from '../../common/ui';
import { userApi }       from '../../../api/services';
import { useDebounce, usePagination } from '../../../hooks';

const ROLES   = ['all','admin','waiter','cashier','customer'];
const STATUSES= ['all','active','inactive','suspended'];

export default function UserManagement() {
  const toast      = useToast();
  const pagination = usePagination(10);

  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [roleFilter,   setRoleFilter]   = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [confirm,  setConfirm]  = useState(null);
  const debouncedSearch = useDebounce(pagination.search);

  const fetchUsers = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = { page: pagination.page, limit: pagination.limit, search: debouncedSearch };
      if (roleFilter   !== 'all') params.role   = roleFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      const data = await userApi.getAll(params);
      setUsers(data.users || []);
      pagination.setTotal(data.total || 0);
    } catch (e) {
      setError(e.response?.data?.error?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, debouncedSearch, roleFilter, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleStatus = async (user) => {
    const next = user.status === 'active' ? 'inactive' : 'active';
    try {
      await userApi.setStatus(user.id, next);
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, status: next } : u));
      toast(`${user.name} set to ${next}`, 'success');
    } catch (e) {
      toast(e.response?.data?.error?.message || 'Failed to update status', 'error');
    }
  };

  const deleteUser = async (id) => {
    try {
      await userApi.remove(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast('User deleted', 'success');
    } catch (e) {
      toast(e.response?.data?.error?.message || 'Failed to delete user', 'error');
    } finally {
      setConfirm(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <PageHeader title="User Management" subtitle="Manage staff and customer accounts" />

      <div className="p-6 space-y-4">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-center">
          <input
            placeholder="Search name or email…"
            value={pagination.search}
            onChange={(e) => pagination.updateSearch(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 flex-1 min-w-48"
          />
          <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); pagination.resetPage(); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400">
            {ROLES.map((r) => <option key={r} value={r}>{r === 'all' ? 'All Roles' : r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); pagination.resetPage(); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400">
            {STATUSES.map((s) => <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
          </select>
        </div>

        {error && <ErrorBanner message={error} onRetry={fetchUsers} />}

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? <PageLoader /> : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                    <tr>{['User','Email','Role','Status','Joined','Actions'].map((h) => (
                      <th key={h} className="text-left px-5 py-3 font-medium">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center text-xs font-bold shrink-0">
                              {u.initials || u.name?.[0]}
                            </div>
                            <span className="font-medium text-gray-900">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-gray-500">{u.email}</td>
                        <td className="px-5 py-3 capitalize text-gray-700">{u.role}</td>
                        <td className="px-5 py-3"><StatusBadge status={u.status} /></td>
                        <td className="px-5 py-3 text-gray-400 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="px-5 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => toggleStatus(u)}
                              className="text-xs border px-2.5 py-1 rounded-full hover:bg-gray-50 transition text-gray-600"
                            >
                              {u.status === 'active' ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => setConfirm({ id: u.id, name: u.name })}
                              className="text-xs border border-red-200 text-red-600 px-2.5 py-1 rounded-full hover:bg-red-50 transition"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && (
                  <div className="text-center text-gray-400 py-10 text-sm">No users found</div>
                )}
              </div>
              <Pagination
                page={pagination.page} totalPages={pagination.totalPages}
                onNext={pagination.nextPage} onPrev={pagination.prevPage}
                onGoTo={pagination.goTo}
              />
            </>
          )}
        </div>
      </div>

      {confirm && (
        <ConfirmModal
          title="Delete User"
          message={`Are you sure you want to delete ${confirm.name}? This action cannot be undone.`}
          onConfirm={() => deleteUser(confirm.id)}
          onCancel={() => setConfirm(null)}
          danger
        />
      )}
    </div>
  );
}
