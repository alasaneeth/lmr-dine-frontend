// src/components/pages/admin/CustomerFormModal.jsx
// NEW FILE – Reusable modal for Create / Edit customer (Admin only)
import React, { useState, useEffect } from 'react';
import { customerApi } from '../../../api/customerServices';

const TIERS = ['bronze', 'silver', 'gold', 'platinum'];

const EMPTY = {
  name:         '',
  email:        '',
  phone:        '',
  address:      '',
  tier:         'bronze',
  credit_limit: '',
  notes:        '',
};

function validate(form) {
  const errs = {};
  if (!form.name.trim())                          errs.name  = 'Name is required';
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                                                  errs.email = 'Invalid email address';
  if (!form.phone.trim())                         errs.phone = 'Phone is required';
  else if (!/^\+?[\d\s\-()]{7,20}$/.test(form.phone))
                                                  errs.phone = 'Invalid phone number';
  if (form.credit_limit !== '' && (isNaN(form.credit_limit) || Number(form.credit_limit) < 0))
                                                  errs.credit_limit = 'Must be a non-negative number';
  return errs;
}

export default function CustomerFormModal({ customer, onSuccess, onClose }) {
  const isEdit = !!customer;
  const [form,    setForm]    = useState(EMPTY);
  const [errors,  setErrors]  = useState({});
  const [saving,  setSaving]  = useState(false);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    if (customer) {
      setForm({
        name:         customer.name         || '',
        email:        customer.email        || '',
        phone:        customer.phone        || '',
        address:      customer.address      || '',
        tier:         customer.tier         || 'bronze',
        credit_limit: customer.credit_limit != null ? String(customer.credit_limit) : '',
        notes:        customer.notes        || '',
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
    setApiError(null);
  }, [customer]);

  const field = (key) => ({
    value:    form[key],
    onChange: (e) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
      if (errors[key]) setErrors((er) => { const n = { ...er }; delete n[key]; return n; });
    },
  });

  const handleSubmit = async () => {
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    setApiError(null);
    try {
      const payload = {
        ...form,
        credit_limit: form.credit_limit === '' ? 0 : Number(form.credit_limit),
      };
      if (isEdit) {
        await customerApi.update(customer.id, payload);
      } else {
        await customerApi.create(payload);
      }
      onSuccess(payload, !isEdit);
    } catch (e) {
      setApiError(e.response?.data?.error?.message || 'Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-lg">
            {isEdit ? 'Edit Customer' : 'Add New Customer'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {apiError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {apiError}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              {...field('name')}
              placeholder="e.g. Priya Jayawardena"
              className={inputCls(errors.name)}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input
                {...field('email')}
                type="email"
                placeholder="priya@example.com"
                className={inputCls(errors.email)}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                {...field('phone')}
                placeholder="+94 77 123 4567"
                className={inputCls(errors.phone)}
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
            <textarea
              {...field('address')}
              rows={2}
              placeholder="Street, City"
              className={`${inputCls()} resize-none`}
            />
          </div>

          {/* Tier + Credit Limit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Loyalty Tier</label>
              <select {...field('tier')} className={inputCls()}>
                {TIERS.map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Credit Limit (LKR)
              </label>
              <input
                {...field('credit_limit')}
                type="number"
                min="0"
                step="500"
                placeholder="0"
                className={inputCls(errors.credit_limit)}
              />
              {errors.credit_limit && (
                <p className="text-red-500 text-xs mt-1">{errors.credit_limit}</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea
              {...field('notes')}
              rows={2}
              placeholder="Optional internal notes…"
              className={`${inputCls()} resize-none`}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
          >
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Customer'}
          </button>
        </div>
      </div>
    </div>
  );
}

function inputCls(hasError) {
  return `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition ${
    hasError
      ? 'border-red-300 focus:ring-red-300'
      : 'border-gray-300 focus:ring-yellow-400'
  }`;
}
