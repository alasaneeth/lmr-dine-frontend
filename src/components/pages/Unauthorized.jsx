// src/components/pages/Unauthorized.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth }     from '../../context/AuthContext';

const roleHome = { admin:'/admin/dashboard', waiter:'/waiter/dashboard', cashier:'/cashier/dashboard', customer:'/customer/home' };

export default function Unauthorized() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const home       = user ? (roleHome[user.role] || '/login') : '/login';

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-6">🚫</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-500 text-sm mb-6">You don't have permission to view this page.</p>
        <button onClick={() => navigate(home)}
          className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition">
          ← Go Back Home
        </button>
      </div>
    </div>
  );
}
