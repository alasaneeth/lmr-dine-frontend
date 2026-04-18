// src/components/common/StatCard.jsx
import React from 'react';

export default function StatCard({ label, value, sub, icon, accent }) {
  return (
    <div className={`rounded-xl border p-4 shadow-sm ${accent ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'}`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-xl">{icon}</span>
      </div>
      <div className={`text-2xl font-bold ${accent ? 'text-yellow-700' : 'text-gray-900'}`}>{value}</div>
      <div className="text-sm text-gray-500 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}
