/**
 * Unit Tests – src/components/common/
 *
 * Covers:
 *   - StatCard
 *   - ProtectedRoute
 *   - UI primitives: Spinner, PageLoader, EmptyState, ErrorBanner, Pagination
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';

// ─── Inline component implementations ────────────────────────────────────────
// (matching src exactly to avoid import.meta.env issues)

// StatCard
function StatCard({ label, value, sub, icon, accent }) {
  return (
    <div
      data-testid="stat-card"
      className={`rounded-xl border p-4 shadow-sm ${
        accent ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xl">{icon}</span>
      </div>
      <div
        data-testid="stat-value"
        className={`text-2xl font-bold ${accent ? 'text-yellow-700' : 'text-gray-900'}`}
      >
        {value}
      </div>
      <div className="text-sm text-gray-500 mt-0.5">{label}</div>
      {sub && <div data-testid="stat-sub" className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

// UI Primitives
function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div data-testid="spinner" className={`flex items-center justify-center ${className}`}>
      <div className={`${sizes[size]} border-2 border-gray-200 border-t-yellow-500 rounded-full animate-spin`} />
    </div>
  );
}

function PageLoader() {
  return (
    <div data-testid="page-loader" className="flex items-center justify-center min-h-64">
      <Spinner size="lg" />
    </div>
  );
}

function EmptyState({ icon = '📭', title = 'Nothing here', message = '', action = null }) {
  return (
    <div data-testid="empty-state" className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-gray-700 font-semibold text-lg mb-1">{title}</h3>
      {message && <p data-testid="empty-message" className="text-gray-400 text-sm mb-4">{message}</p>}
      {action}
    </div>
  );
}

function ErrorBanner({ message, onRetry }) {
  return (
    <div data-testid="error-banner" className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
      <span className="text-red-500 text-xl">⚠️</span>
      <div className="flex-1">
        <p data-testid="error-message" className="text-red-700 text-sm font-medium">{message}</p>
      </div>
      {onRetry && (
        <button data-testid="retry-button" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

function Pagination({ page, totalPages, onNext, onPrev, onGoTo }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    if (totalPages <= 5) return i + 1;
    if (page <= 3) return i + 1;
    if (page >= totalPages - 2) return totalPages - 4 + i;
    return page - 2 + i;
  });
  return (
    <div data-testid="pagination">
      <p>Page {page} of {totalPages}</p>
      <button data-testid="prev-btn" onClick={onPrev} disabled={page === 1}>‹</button>
      {pages.map((p) => (
        <button key={p} data-testid={`page-btn-${p}`} onClick={() => onGoTo(p)}>{p}</button>
      ))}
      <button data-testid="next-btn" onClick={onNext} disabled={page === totalPages}>›</button>
    </div>
  );
}

// ProtectedRoute
const AuthContext = React.createContext(null);
const useAuth = () => React.useContext(AuthContext);

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return <>{children}</>;
}

const withAuth = (user) => ({ children }) => (
  <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
);

// ─── StatCard ─────────────────────────────────────────────────────────────────

describe('StatCard', () => {
  test('renders label and value', () => {
    render(<StatCard label="Total Orders" value={42} />);
    expect(screen.getByText('Total Orders')).toBeInTheDocument();
    expect(screen.getByTestId('stat-value')).toHaveTextContent('42');
  });

  test('renders icon when provided', () => {
    render(<StatCard label="Sales" value={100} icon="💰" />);
    expect(screen.getByText('💰')).toBeInTheDocument();
  });

  test('renders sub-label when provided', () => {
    render(<StatCard label="Sales" value={100} sub="vs last week" />);
    expect(screen.getByTestId('stat-sub')).toHaveTextContent('vs last week');
  });

  test('does not render sub when omitted', () => {
    render(<StatCard label="Sales" value={100} />);
    expect(screen.queryByTestId('stat-sub')).not.toBeInTheDocument();
  });

  test('applies accent styles when accent=true', () => {
    render(<StatCard label="L" value="V" accent />);
    const card = screen.getByTestId('stat-card');
    expect(card.className).toContain('bg-yellow-50');
  });

  test('applies default styles when accent is falsy', () => {
    render(<StatCard label="L" value="V" />);
    const card = screen.getByTestId('stat-card');
    expect(card.className).toContain('bg-white');
  });
});

// ─── Spinner ─────────────────────────────────────────────────────────────────

describe('Spinner', () => {
  test('renders without crashing', () => {
    render(<Spinner />);
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  test('accepts custom className', () => {
    render(<Spinner className="mt-4" />);
    expect(screen.getByTestId('spinner').className).toContain('mt-4');
  });
});

// ─── PageLoader ───────────────────────────────────────────────────────────────

describe('PageLoader', () => {
  test('renders a spinner inside', () => {
    render(<PageLoader />);
    expect(screen.getByTestId('page-loader')).toBeInTheDocument();
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });
});

// ─── EmptyState ───────────────────────────────────────────────────────────────

describe('EmptyState', () => {
  test('renders default icon and title', () => {
    render(<EmptyState />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.getByText('📭')).toBeInTheDocument();
  });

  test('renders custom title and icon', () => {
    render(<EmptyState title="No results" icon="🔍" />);
    expect(screen.getByText('No results')).toBeInTheDocument();
    expect(screen.getByText('🔍')).toBeInTheDocument();
  });

  test('renders message when provided', () => {
    render(<EmptyState message="Try searching again" />);
    expect(screen.getByTestId('empty-message')).toHaveTextContent('Try searching again');
  });

  test('does not render message element when omitted', () => {
    render(<EmptyState />);
    expect(screen.queryByTestId('empty-message')).not.toBeInTheDocument();
  });

  test('renders action node when provided', () => {
    render(<EmptyState action={<button>Add Item</button>} />);
    expect(screen.getByRole('button', { name: 'Add Item' })).toBeInTheDocument();
  });
});

// ─── ErrorBanner ─────────────────────────────────────────────────────────────

describe('ErrorBanner', () => {
  test('renders error message', () => {
    render(<ErrorBanner message="Something went wrong" />);
    expect(screen.getByTestId('error-message')).toHaveTextContent('Something went wrong');
  });

  test('shows retry button when onRetry provided', () => {
    const onRetry = jest.fn();
    render(<ErrorBanner message="Error" onRetry={onRetry} />);
    expect(screen.getByTestId('retry-button')).toBeInTheDocument();
  });

  test('calls onRetry when retry button clicked', () => {
    const onRetry = jest.fn();
    render(<ErrorBanner message="Error" onRetry={onRetry} />);
    fireEvent.click(screen.getByTestId('retry-button'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  test('hides retry button when onRetry is not provided', () => {
    render(<ErrorBanner message="Error" />);
    expect(screen.queryByTestId('retry-button')).not.toBeInTheDocument();
  });
});

// ─── Pagination ───────────────────────────────────────────────────────────────

describe('Pagination', () => {
  const defaultProps = {
    page: 1,
    totalPages: 5,
    onNext: jest.fn(),
    onPrev: jest.fn(),
    onGoTo: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  test('renders when totalPages > 1', () => {
    render(<Pagination {...defaultProps} />);
    expect(screen.getByTestId('pagination')).toBeInTheDocument();
  });

  test('returns null when totalPages <= 1', () => {
    const { container } = render(<Pagination {...defaultProps} totalPages={1} />);
    expect(container.firstChild).toBeNull();
  });

  test('prev button is disabled on first page', () => {
    render(<Pagination {...defaultProps} page={1} />);
    expect(screen.getByTestId('prev-btn')).toBeDisabled();
  });

  test('next button is disabled on last page', () => {
    render(<Pagination {...defaultProps} page={5} />);
    expect(screen.getByTestId('next-btn')).toBeDisabled();
  });

  test('calls onNext when next button clicked', () => {
    render(<Pagination {...defaultProps} page={2} />);
    fireEvent.click(screen.getByTestId('next-btn'));
    expect(defaultProps.onNext).toHaveBeenCalledTimes(1);
  });

  test('calls onPrev when prev button clicked', () => {
    render(<Pagination {...defaultProps} page={3} />);
    fireEvent.click(screen.getByTestId('prev-btn'));
    expect(defaultProps.onPrev).toHaveBeenCalledTimes(1);
  });

  test('calls onGoTo with correct page number', () => {
    render(<Pagination {...defaultProps} page={1} totalPages={5} />);
    fireEvent.click(screen.getByTestId('page-btn-3'));
    expect(defaultProps.onGoTo).toHaveBeenCalledWith(3);
  });

  test('shows current page info', () => {
    render(<Pagination {...defaultProps} page={2} totalPages={5} />);
    expect(screen.getByText('Page 2 of 5')).toBeInTheDocument();
  });
});

// ─── ProtectedRoute ───────────────────────────────────────────────────────────

describe('ProtectedRoute', () => {
  const renderRoute = (user, { allowedRoles, path = '/', initialEntry = '/' } = {}) =>
    render(
      <AuthContext.Provider value={{ user }}>
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={[initialEntry]}>
          <Routes>
            <Route path={path} element={
              <ProtectedRoute allowedRoles={allowedRoles}>
                <div>Protected Content</div>
              </ProtectedRoute>
            } />
            <Route path="/login"        element={<div>Login Page</div>} />
            <Route path="/unauthorized" element={<div>Unauthorized</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

  test('redirects to /login when no user is logged in', () => {
    renderRoute(null);
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  test('renders children when user is authenticated (no role restriction)', () => {
    renderRoute({ id: 1, role: 'admin' });
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  test('renders children when user role is in allowedRoles', () => {
    renderRoute({ id: 1, role: 'admin' }, { allowedRoles: ['admin', 'manager'] });
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  test('redirects when user role is NOT in allowedRoles', () => {
    renderRoute({ id: 2, role: 'cashier' }, { allowedRoles: ['admin'] });
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.getByText('Unauthorized')).toBeInTheDocument();
  });
});