// src/components/pages/customer/CustomerHome.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth }     from '../../../context/AuthContext';
import { menuApi, orderApi } from '../../../api/services';
import { PageLoader, StatusBadge } from '../../common/ui';

export default function CustomerHome() {
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [categories, setCategories] = useState([]);
  const [menuItems,  setMenuItems]  = useState([]);
  const [recentOrders, setRecent]   = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [menuData, ordersData] = await Promise.all([
          menuApi.getAll({ limit: 100, isAvailable: true }),
          orderApi.getMyOrders({ limit: 3 }),
        ]);
        const items = menuData.items || [];
        const catMap = {};
        items.forEach((i) => { if (i.category && !catMap[i.category.id]) catMap[i.category.id] = i.category; });
        setCategories(Object.values(catMap).sort((a, b) => a.sort_order - b.sort_order));
        setMenuItems(items);
        setRecent(ordersData.orders || []);
      } catch (_) {}
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] || 'there';

  if (loading) return <PageLoader />;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Hero banner */}
      <div className="bg-gray-900 text-white px-8 py-10">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold mb-1">{greeting}, {firstName}! 👋</h1>
          <p className="text-gray-400 text-sm">Welcome to RestoMS. What would you like today?</p>
          <button onClick={() => navigate('/customer/place-order')}
            className="mt-5 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold px-6 py-3 rounded-xl text-sm transition">
            🍽 Order Now →
          </button>
        </div>
      </div>

      <div className="p-6 space-y-8 max-w-3xl">
        {/* Recent orders */}
        {recentOrders.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold text-gray-900">Your Recent Orders</h2>
              <button onClick={() => navigate('/customer/my-orders')} className="text-xs text-yellow-600 hover:underline font-medium">
                View all →
              </button>
            </div>
            <div className="space-y-3">
              {recentOrders.map((o) => (
                <div key={o.id} onClick={() => navigate('/customer/my-orders')}
                  className="bg-white rounded-xl border border-gray-200 p-4 flex justify-between items-center cursor-pointer hover:border-yellow-400 transition shadow-sm">
                  <div>
                    <div className="font-mono text-xs text-gray-400">{o.order_no}</div>
                    <div className="text-sm font-medium text-gray-900 mt-0.5">{o.table_no}</div>
                    <div className="text-xs text-gray-400">{(o.items||[]).length} items · {new Date(o.placed_at).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={o.status} />
                    <div className="font-semibold text-gray-900 text-sm mt-1">LKR {parseFloat(o.total).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Menu preview */}
        {categories.map((cat) => {
          const catItems = menuItems.filter((i) => i.category?.id === cat.id).slice(0, 4);
          if (catItems.length === 0) return null;
          return (
            <div key={cat.id}>
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-semibold text-gray-900">{cat.name}</h2>
                <button onClick={() => navigate('/customer/place-order')} className="text-xs text-yellow-600 hover:underline font-medium">
                  Order →
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {catItems.map((item) => (
                  <div key={item.id}
                    className="bg-white rounded-xl border border-gray-200 p-3 text-center shadow-sm hover:border-yellow-400 hover:shadow-md transition cursor-pointer"
                    onClick={() => navigate('/customer/place-order')}>
                    <div className="text-3xl mb-2">{item.emoji || '🍽'}</div>
                    <div className="text-sm font-medium text-gray-900 truncate">{item.name}</div>
                    <div className="text-yellow-600 text-xs font-semibold mt-1">LKR {item.price}</div>
                    {item.stock === 0 && <div className="text-xs text-red-400 mt-0.5">Out of stock</div>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
