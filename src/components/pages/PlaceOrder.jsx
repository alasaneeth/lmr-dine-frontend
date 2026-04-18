// src/components/pages/PlaceOrder.jsx
import React, { useState, useEffect } from 'react';
import { useAuth }    from '../../context/AuthContext';
import { menuApi, orderApi } from '../../api/services';
import { PageLoader, ErrorBanner, Spinner, useToast } from '../common/ui';

export default function PlaceOrder() {
  const { user }    = useAuth();
  const toast       = useToast();

  const [categories,  setCategories]  = useState([]);
  const [menuItems,   setMenuItems]   = useState([]);
  const [activeTab,   setActiveTab]   = useState(null);
  const [cart,        setCart]        = useState({});
  const [tableNo,     setTableNo]     = useState('Table 01');
  const [submitted,   setSubmitted]   = useState(false);
  const [lastOrderNo, setLastOrderNo] = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState(null);

  // Fetch menu on mount
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const data = await menuApi.getAll({ limit: 100, isAvailable: true });
        const items = data.items || [];
        // Extract unique categories from items
        const catMap = {};
        items.forEach((item) => {
          if (item.category && !catMap[item.category.id]) {
            catMap[item.category.id] = item.category;
          }
        });
        const cats = Object.values(catMap).sort((a, b) => a.sort_order - b.sort_order);
        setCategories(cats);
        setMenuItems(items);
        if (cats.length > 0) setActiveTab(cats[0].id);
      } catch (e) {
        setError('Failed to load menu. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  const addItem = (item, qty) => {
    setCart((prev) => ({
      ...prev,
      [item.id]: { ...item, qty: (prev[item.id]?.qty || 0) + qty },
    }));
  };

  const removeItem = (id) => setCart((prev) => { const n = {...prev}; delete n[id]; return n; });
  const clearOrder = ()   => setCart({});

  const subtotal = Object.values(cart).reduce((s, i) => s + i.price * i.qty, 0);

  const handlePlace = async () => {
    if (Object.keys(cart).length === 0) return;
    setSubmitting(true);
    try {
      const orderData = {
        tableNo,
        customerName: user?.name || '',
        items: Object.values(cart).map((i) => ({ menuItemId: i.id, qty: i.qty })),
      };
      const order = await orderApi.create(orderData);
      setLastOrderNo(order.order_no);
      setSubmitted(true);
      clearOrder();
      toast(`Order ${order.order_no} placed!`, 'success');
      setTimeout(() => setSubmitted(false), 5000);
    } catch (e) {
      toast(e.response?.data?.error?.message || 'Failed to place order', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const tabItems = menuItems.filter((i) => i.category?.id === activeTab);

  if (loading) return <PageLoader />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_350px] min-h-screen bg-gray-100">
      {/* Menu side */}
      <div className="bg-gray-100">
        {/* Header */}
        <div className="bg-gray-900 text-white flex justify-between items-center px-6 py-4">
          <h1 className="text-lg font-semibold">Place Order</h1>
          <div className="flex items-center gap-3">
            <select
              value={tableNo} onChange={(e) => setTableNo(e.target.value)}
              className="bg-yellow-200 text-yellow-800 text-xs px-3 py-1 rounded-full border-none focus:outline-none cursor-pointer"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1}>{`Table ${String(i + 1).padStart(2, '0')}`}</option>
              ))}
            </select>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <div className="w-7 h-7 rounded-full bg-yellow-500 text-gray-900 flex items-center justify-center text-xs font-bold">
                {user?.initials || '?'}
              </div>
              {user?.name?.split(' ')[0] || 'User'}
            </div>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex border-b bg-white px-6">
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => setActiveTab(cat.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition ${activeTab === cat.id ? 'border-yellow-500 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {error && <div className="p-4"><ErrorBanner message={error} /></div>}

        {/* Items grid */}
        <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
          {tabItems.map((item) => (
            <ItemCard key={item.id} item={item} addItem={addItem} />
          ))}
          {tabItems.length === 0 && (
            <div className="col-span-full text-center text-gray-400 py-10">No items in this category</div>
          )}
        </div>
      </div>

      {/* Cart side */}
      <div className="bg-white border-l flex flex-col">
        <div className="p-5 border-b">
          <h2 className="text-lg font-semibold">Current Order</h2>
          <p className="text-sm text-gray-400">
            {Object.keys(cart).length === 0
              ? 'No items added yet'
              : `${Object.values(cart).reduce((a, b) => a + b.qty, 0)} items · ${tableNo}`}
          </p>
        </div>

        <div className="flex-1 p-5 overflow-y-auto">
          {submitted ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-10">
              <div className="text-4xl mb-3">✅</div>
              <div className="font-semibold text-gray-900">Order Placed!</div>
              <div className="text-sm text-yellow-600 font-mono mt-1">{lastOrderNo}</div>
              <div className="text-sm text-gray-400 mt-1">Sent to the kitchen.</div>
            </div>
          ) : Object.keys(cart).length === 0 ? (
            <div className="text-center text-gray-400 mt-10 text-sm">🍽 Add items to get started</div>
          ) : (
            Object.values(cart).map((item) => (
              <div key={item.id} className="flex justify-between mb-3">
                <div>
                  <div className="font-medium text-sm">{item.name}</div>
                  <div className="text-xs text-gray-400">{item.qty} × LKR {item.price}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm">LKR {(item.qty * item.price).toFixed(2)}</div>
                  <button onClick={() => removeItem(item.id)} className="text-red-500 text-xs hover:underline">Remove</button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-5 border-t">
          <div className="flex justify-between font-semibold text-lg mb-4">
            <span>Total</span>
            <span>LKR {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={clearOrder} disabled={submitting}
              className="flex-1 border rounded-md py-2 text-sm hover:bg-gray-50 disabled:opacity-40">
              Clear
            </button>
            <button onClick={handlePlace}
              disabled={Object.keys(cart).length === 0 || submitting}
              className="flex-1 bg-gray-900 text-white rounded-md py-2 text-sm hover:bg-gray-700 disabled:opacity-40 flex items-center justify-center gap-2">
              {submitting ? <><Spinner size="sm" />Placing…</> : 'Place Order →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ItemCard({ item, addItem }) {
  const [qty, setQty] = useState(1);
  const isLow = item.stock <= 5 && item.stock > 0;
  return (
    <div className={`bg-white rounded-xl border p-3 shadow-sm hover:shadow-md transition ${item.stock === 0 ? 'opacity-50' : ''}`}>
      <div className="text-3xl text-center mb-2">{item.emoji || '🍽'}</div>
      <div className="text-sm font-medium truncate">{item.name}</div>
      <div className="text-yellow-600 text-sm mb-1">LKR {item.price}</div>
      {isLow && <div className="text-xs text-orange-500 mb-1">Only {item.stock} left</div>}
      {item.stock === 0 ? (
        <div className="text-xs text-red-400 text-center py-1">Out of stock</div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-6 h-6 border rounded-full text-sm hover:bg-gray-100">-</button>
            <input value={qty} onChange={(e) => setQty(Math.max(1, parseInt(e.target.value)||1))}
              className="w-10 text-center border rounded text-sm" />
            <button onClick={() => setQty((q) => Math.min(item.stock, q + 1))} className="w-6 h-6 border rounded-full text-sm hover:bg-gray-100">+</button>
          </div>
          <button onClick={() => addItem(item, qty)}
            className="text-xs border border-yellow-500 text-yellow-600 px-2 py-1 rounded-full hover:bg-yellow-500 hover:text-white transition">
            Add
          </button>
        </div>
      )}
    </div>
  );
}
