// src/App.jsx
import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider }   from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ToastProvider }  from './components/common/ui';
import ProtectedRoute     from './components/common/ProtectedRoute';
import Sidebar            from './components/common/Sidebar';
import { PageLoader }     from './components/common/ui';

// ── Eagerly loaded (small, needed at boot) ────────────────────────────────────
import Login        from './components/pages/Login';
import Unauthorized from './components/pages/Unauthorized';

// ── Lazy-loaded page chunks ───────────────────────────────────────────────────
const PlaceOrder   = lazy(() => import('./components/pages/PlaceOrder'));

// Admin
const AdminDashboard      = lazy(() => import('./components/pages/admin/AdminDashboard'));
const CreateNewItem       = lazy(() => import('./components/pages/admin/CreateNewItem'));
const ProcessOrders       = lazy(() => import('./components/pages/admin/ProcessOrders'));
const InvoiceManagement   = lazy(() => import('./components/pages/admin/InvoiceManagement'));
const SalesSummary        = lazy(() => import('./components/pages/admin/SalesSummary'));
const UserManagement      = lazy(() => import('./components/pages/admin/UserManagement'));
const FoodStockManagement = lazy(() => import('./components/pages/admin/FoodStockManagement'));

// Customer
const CustomerHome = lazy(() => import('./components/pages/customer/CustomerHome'));
const MyOrders     = lazy(() => import('./components/pages/customer/MyOrders'));

// Waiter
const WaiterDashboard     = lazy(() => import('./components/pages/waiter/WaiterDashboard'));
const AddNewStock         = lazy(() => import('./components/pages/waiter/AddNewStock'));
const WaiterProcessOrders = lazy(() => import('./components/pages/waiter/ProcessOrders'));
const ViewOrders          = lazy(() => import('./components/pages/waiter/ViewOrders'));
const WaiterFoodStock     = lazy(() => import('./components/pages/waiter/FoodStockManagement'));

// Cashier
const CashierDashboard = lazy(() => import('./components/pages/cashier/CashierDashboard'));
const InvoiceBilling   = lazy(() => import('./components/pages/cashier/InvoiceBilling'));
const CashierSales     = lazy(() => import('./components/pages/cashier/SalesSummary'));

const Guard = ({ roles, children }) => (
  <ProtectedRoute allowedRoles={roles}>{children}</ProtectedRoute>
);

const Lazy = ({ children }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <ToastProvider>
            <Routes>
              {/* Public */}
              <Route path="/login"        element={<Login />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/"             element={<Navigate to="/login" replace />} />

              {/* All authenticated routes wrapped in Sidebar */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <Sidebar>
                      <Routes>
                        {/* ── Admin ── */}
                        <Route path="admin/dashboard"      element={<Guard roles={['admin']}><Lazy><AdminDashboard /></Lazy></Guard>} />
                        <Route path="admin/create-item"    element={<Guard roles={['admin']}><Lazy><CreateNewItem /></Lazy></Guard>} />
                        <Route path="admin/food-stock"     element={<Guard roles={['admin']}><Lazy><FoodStockManagement /></Lazy></Guard>} />
                        <Route path="admin/place-order"    element={<Guard roles={['admin']}><Lazy><PlaceOrder /></Lazy></Guard>} />
                        <Route path="admin/process-orders" element={<Guard roles={['admin']}><Lazy><ProcessOrders /></Lazy></Guard>} />
                        <Route path="admin/invoices"       element={<Guard roles={['admin']}><Lazy><InvoiceManagement /></Lazy></Guard>} />
                        <Route path="admin/sales"          element={<Guard roles={['admin']}><Lazy><SalesSummary /></Lazy></Guard>} />
                        <Route path="admin/users"          element={<Guard roles={['admin']}><Lazy><UserManagement /></Lazy></Guard>} />

                        {/* ── Customer ── */}
                        <Route path="customer/home"        element={<Guard roles={['customer']}><Lazy><CustomerHome /></Lazy></Guard>} />
                        <Route path="customer/place-order" element={<Guard roles={['customer']}><Lazy><PlaceOrder /></Lazy></Guard>} />
                        <Route path="customer/my-orders"   element={<Guard roles={['customer']}><Lazy><MyOrders /></Lazy></Guard>} />

                        {/* ── Waiter ── */}
                        <Route path="waiter/dashboard"     element={<Guard roles={['waiter']}><Lazy><WaiterDashboard /></Lazy></Guard>} />
                        <Route path="waiter/food-stock"    element={<Guard roles={['waiter']}><Lazy><WaiterFoodStock /></Lazy></Guard>} />
                        <Route path="waiter/stock"         element={<Guard roles={['waiter']}><Lazy><AddNewStock /></Lazy></Guard>} />
                        <Route path="waiter/place-order"   element={<Guard roles={['waiter']}><Lazy><PlaceOrder /></Lazy></Guard>} />
                        <Route path="waiter/process-orders"element={<Guard roles={['waiter']}><Lazy><WaiterProcessOrders /></Lazy></Guard>} />
                        <Route path="waiter/view-orders"   element={<Guard roles={['waiter']}><Lazy><ViewOrders /></Lazy></Guard>} />

                        {/* ── Cashier ── */}
                        <Route path="cashier/dashboard"    element={<Guard roles={['cashier']}><Lazy><CashierDashboard /></Lazy></Guard>} />
                        <Route path="cashier/billing"      element={<Guard roles={['cashier']}><Lazy><InvoiceBilling /></Lazy></Guard>} />
                        <Route path="cashier/sales"        element={<Guard roles={['cashier']}><Lazy><CashierSales /></Lazy></Guard>} />

                        <Route path="*" element={<Unauthorized />} />
                      </Routes>
                    </Sidebar>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </ToastProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
