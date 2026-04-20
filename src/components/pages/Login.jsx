// src/components/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate }     from 'react-router-dom';
import { useAuth }         from '../../context/AuthContext';

const roleHome = {
  admin:    '/admin/dashboard',
  waiter:   '/waiter/dashboard',
  cashier:  '/cashier/dashboard',
  customer: '/customer/home',
};

const hints = [
  { role: 'Admin',    email: 'admin@resto.lk',    password: 'password' },
  { role: 'Waiter',   email: 'waiter@resto.lk',   password: 'password' },
  { role: 'Cashier',  email: 'cashier@resto.lk',  password: 'password' },
  { role: 'Customer', email: 'customer@resto.lk', password: 'password' },
];

export default function Login() {
  const { login, loading } = useAuth();
  const navigate           = useNavigate();

  const [form,     setForm]     = useState({ email: '', password: '' });
  const [mfaToken, setMfaToken] = useState('');
  const [step,     setStep]     = useState('credentials'); // 'credentials' | 'mfa'
  const [error,    setError]    = useState('');

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) { setError('Please fill in all fields.'); return; }

    const result = await login(form.email.trim(), form.password, step === 'mfa' ? mfaToken : null);

    if (result.requiresMfa) { setStep('mfa'); return; }
    if (result.success)     { navigate(roleHome[result.role] || '/'); return; }
    setError(result.message || 'Invalid email or password.');
  };

  const fillHint = (h) => { setForm({ email: h.email, password: h.password }); setStep('credentials'); };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gray-900 px-8 py-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-yellow-500 rounded-xl text-gray-900 font-bold text-2xl mb-4">
              R
            </div>
            <h1 className="text-white text-2xl font-bold">RestoMS</h1>
            <p className="text-gray-400 text-sm mt-1">Restaurant Management System</p>
          </div>

          {/* Form */}
          <div className="px-8 py-7">
            <h2 className="text-gray-900 font-semibold text-lg mb-5">
              {step === 'mfa' ? '🔐 Two-Factor Authentication' : 'Sign in to your account'}
            </h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {step === 'credentials' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input
                      type="email" name="email" value={form.email}
                      onChange={handleChange} placeholder="you@resto.lk"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                      type="password" name="password" value={form.password}
                      onChange={handleChange} placeholder="••••••••"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Enter the 6-digit code from your authenticator app
                  </label>
                  <input
                    type="text" value={mfaToken} onChange={(e) => setMfaToken(e.target.value)}
                    placeholder="000000" maxLength={6}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-center tracking-widest text-xl focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                  <button
                    type="button"
                    onClick={() => { setStep('credentials'); setMfaToken(''); setError(''); }}
                    className="text-xs text-gray-400 hover:text-gray-600 mt-2"
                  >
                    ← Back to login
                  </button>
                </div>
              )}

              <button
                type="submit" disabled={loading}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-lg py-2.5 text-sm font-medium transition-colors disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {step === 'mfa' ? 'Verifying…' : 'Signing in…'}
                  </span>
                ) : step === 'mfa' ? 'Verify →' : 'Sign In →'}
              </button>
            </form>
          </div>
        </div>

        {/* Demo credentials – only show in development */}
        {import.meta.env.DEV && (
          <div className="mt-5 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500 font-medium mb-3 uppercase tracking-wide">
              Demo Credentials — click to fill
            </p>
            <div className="grid grid-cols-2 gap-2">
              {hints.map((h) => (
                <button
                  key={h.role} onClick={() => fillHint(h)}
                  className="text-left text-xs border border-gray-200 rounded-lg px-3 py-2 hover:border-yellow-400 hover:bg-yellow-50 transition-colors"
                >
                  <span className="font-semibold text-gray-800 block">{h.role}</span>
                  <span className="text-gray-400">{h.email}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
