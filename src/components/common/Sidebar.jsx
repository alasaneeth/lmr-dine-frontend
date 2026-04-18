import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const roleNav = {
  admin: [
    { label: "Dashboard",           path: "/admin/dashboard",    icon: "⬡" },
    { label: "Create New Item",     path: "/admin/create-item",  icon: "✦" },
    { label: "Food Stock",          path: "/admin/food-stock",   icon: "📦" },
    { label: "Place Order",         path: "/admin/place-order",  icon: "◈" },
    { label: "Process Orders",      path: "/admin/process-orders",icon: "◉" },
    { label: "Invoice Management",  path: "/admin/invoices",     icon: "◻" },
    { label: "Sales Summary",       path: "/admin/sales",        icon: "◈" },
    { label: "User Management",     path: "/admin/users",        icon: "◎" },
  ],
  waiter: [
    { label: "Dashboard",     path: "/waiter/dashboard",       icon: "⬡" },
    { label: "Food Stock",    path: "/waiter/food-stock",      icon: "📦" },
    { label: "Add New Stock", path: "/waiter/stock",           icon: "✦" },
    { label: "Place Order",   path: "/waiter/place-order",     icon: "◈" },
    { label: "Process Orders",path: "/waiter/process-orders",  icon: "◉" },
    { label: "View Orders",   path: "/waiter/view-orders",     icon: "◻" },
  ],
  cashier: [
    { label: "Dashboard",    path: "/cashier/dashboard",       icon: "⬡" },
    { label: "Invoice / Billing",path: "/cashier/billing",     icon: "◻" },
    { label: "Sales Summary",path: "/cashier/sales",           icon: "◈" },
  ],
  customer: [
    { label: "Home",         path: "/customer/home",           icon: "⬡" },
    { label: "Place Order",  path: "/customer/place-order",    icon: "◈" },
    { label: "My Orders",    path: "/customer/my-orders",      icon: "◉" },
  ],
};

const roleColors = {
  admin:    "from-gray-900 to-gray-800",
  waiter:   "from-gray-900 to-gray-800",
  cashier:  "from-gray-900 to-gray-800",
  customer: "from-gray-900 to-gray-800",
};

export default function Sidebar({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return <>{children}</>;

  const navItems = roleNav[user.role] || [];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`${collapsed ? "w-16" : "w-60"} bg-gray-900 flex flex-col transition-all duration-300 shrink-0`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-700">
          <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center text-gray-900 font-bold text-sm shrink-0">
            R
          </div>
          {!collapsed && (
            <div>
              <div className="text-white font-semibold text-sm leading-tight">RestoMS</div>
              <div className="text-gray-400 text-xs capitalize">{user.role}</div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto text-gray-400 hover:text-white text-xs"
          >
            {collapsed ? "›" : "‹"}
          </button>
        </div>

        {/* User badge */}
        {!collapsed && (
          <div className="mx-3 mt-4 mb-2 bg-gray-800 rounded-lg px-3 py-2 flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-yellow-500 text-gray-900 text-xs font-bold flex items-center justify-center shrink-0">
              {user.initials}
            </div>
            <div className="overflow-hidden">
              <div className="text-white text-xs font-medium truncate">{user.name}</div>
              <div className="text-gray-400 text-xs truncate">{user.email}</div>
            </div>
          </div>
        )}

        {/* Nav Links */}
        <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-yellow-500 text-gray-900 font-semibold"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`
              }
            >
              <span className="text-base shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-red-900 hover:text-red-300 transition-colors`}
          >
            <span className="shrink-0">⏻</span>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
