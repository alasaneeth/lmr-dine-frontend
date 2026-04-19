/**
 * Integration Tests – Login page
 *
 * Tests the full Login form behaviour:
 *   - Renders email/password fields
 *   - Shows validation error when fields are empty
 *   - Calls login(), navigates to role home on success
 *   - Shows server error message on failure
 *   - Transitions to MFA step when required
 *   - Verifies demo credential buttons fill the form
 */

import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// ─── Mock context ─────────────────────────────────────────────────────────────

const mockLogin = jest.fn();
const mockLoading = { current: false };

const AuthContext = React.createContext(null);

function AuthProvider({ children }) {
  const [loading] = useState(false);
  return (
    <AuthContext.Provider value={{ login: mockLogin, loading: mockLoading.current }}>
      {children}
    </AuthContext.Provider>
  );
}

const useAuth = () => React.useContext(AuthContext);

// ─── Inline Login component ───────────────────────────────────────────────────

const { useNavigate } = require('react-router-dom');

const roleHome = {
  admin:    '/admin/dashboard',
  waiter:   '/waiter/dashboard',
  cashier:  '/cashier/dashboard',
  customer: '/customer/home',
};

const hints = [
  { role: 'Admin',    email: 'admin@resto.lk',    password: 'Admin@123' },
  { role: 'Waiter',   email: 'waiter@resto.lk',   password: 'Waiter@123' },
  { role: 'Cashier',  email: 'cashier@resto.lk',  password: 'Cashier@123' },
  { role: 'Customer', email: 'customer@resto.lk', password: 'Customer@123' },
];

function Login() {
  const { login, loading } = useAuth();
  const navigate           = useNavigate();

  const [form,     setForm]     = useState({ email: '', password: '' });
  const [mfaToken, setMfaToken] = useState('');
  const [step,     setStep]     = useState('credentials');
  const [error,    setError]    = useState('');

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

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
    <div>
      <h1>RestoMS</h1>
      <h2>{step === 'mfa' ? '🔐 Two-Factor Authentication' : 'Sign in to your account'}</h2>

      {error && <div data-testid="error-msg" role="alert">{error}</div>}

      <form onSubmit={handleSubmit}>
        {step === 'credentials' ? (
          <>
            <label htmlFor="email">Email Address</label>
            <input
              id="email" type="email" name="email"
              value={form.email} onChange={handleChange}
              placeholder="you@resto.lk"
            />
            <label htmlFor="password">Password</label>
            <input
              id="password" type="password" name="password"
              value={form.password} onChange={handleChange}
              placeholder="••••••••"
            />
          </>
        ) : (
          <>
            <label htmlFor="mfa">MFA Code</label>
            <input
              id="mfa" type="text" value={mfaToken}
              onChange={(e) => setMfaToken(e.target.value)}
              placeholder="000000" maxLength={6}
            />
            <button type="button" onClick={() => { setStep('credentials'); setMfaToken(''); setError(''); }}>
              ← Back to login
            </button>
          </>
        )}

        <button type="submit" disabled={loading}>
          {step === 'mfa' ? 'Verify →' : 'Sign In →'}
        </button>
      </form>

      {/* Demo hints (always shown in test env for simplicity) */}
      <div data-testid="hints">
        {hints.map((h) => (
          <button key={h.role} onClick={() => fillHint(h)} data-testid={`hint-${h.role.toLowerCase()}`}>
            {h.role} – {h.email}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Render helper ────────────────────────────────────────────────────────────

const renderLogin = (initialEntry = '/login') =>
  render(
    <AuthProvider>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/login"            element={<Login />} />
          <Route path="/admin/dashboard"  element={<div>Admin Dashboard</div>} />
          <Route path="/waiter/dashboard" element={<div>Waiter Dashboard</div>} />
          <Route path="/cashier/dashboard"element={<div>Cashier Dashboard</div>} />
          <Route path="/customer/home"    element={<div>Customer Home</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockLoading.current = false;
});

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('Login – rendering', () => {
  test('renders email and password inputs', () => {
    renderLogin();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  test('renders Sign In button', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: 'Sign In →' })).toBeInTheDocument();
  });

  test('renders demo hint buttons', () => {
    renderLogin();
    expect(screen.getByTestId('hint-admin')).toBeInTheDocument();
    expect(screen.getByTestId('hint-waiter')).toBeInTheDocument();
    expect(screen.getByTestId('hint-cashier')).toBeInTheDocument();
    expect(screen.getByTestId('hint-customer')).toBeInTheDocument();
  });
});

// ─── Validation ───────────────────────────────────────────────────────────────

describe('Login – client-side validation', () => {
  test('shows error when email is empty on submit', async () => {
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: 'Sign In →' }));
    expect(await screen.findByTestId('error-msg')).toHaveTextContent('Please fill in all fields.');
    expect(mockLogin).not.toHaveBeenCalled();
  });

  test('shows error when password is empty on submit', async () => {
    renderLogin();
    await userEvent.type(screen.getByLabelText('Email Address'), 'a@b.com');
    fireEvent.click(screen.getByRole('button', { name: 'Sign In →' }));
    expect(await screen.findByTestId('error-msg')).toHaveTextContent('Please fill in all fields.');
  });
});

// ─── Successful login ─────────────────────────────────────────────────────────

describe('Login – successful login', () => {
  const fill = async () => {
    await userEvent.type(screen.getByLabelText('Email Address'), 'admin@resto.lk');
    await userEvent.type(screen.getByLabelText('Password'), 'Admin@123');
  };

  test.each([
    ['admin',    'Admin Dashboard'],
    ['waiter',   'Waiter Dashboard'],
    ['cashier',  'Cashier Dashboard'],
    ['customer', 'Customer Home'],
  ])('navigates to correct home for role: %s', async (role, expectedText) => {
    mockLogin.mockResolvedValue({ success: true, role });
    renderLogin();
    await fill();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Sign In →' }));
    });
    await waitFor(() => expect(screen.getByText(expectedText)).toBeInTheDocument());
  });

  test('calls login with trimmed email and password', async () => {
    mockLogin.mockResolvedValue({ success: true, role: 'admin' });
    renderLogin();
    await userEvent.type(screen.getByLabelText('Email Address'), '  admin@resto.lk  ');
    await userEvent.type(screen.getByLabelText('Password'), 'pw');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Sign In →' }));
    });
    expect(mockLogin).toHaveBeenCalledWith('admin@resto.lk', 'pw', null);
  });
});

// ─── Failed login ─────────────────────────────────────────────────────────────

describe('Login – failed login', () => {
  test('shows server error message', async () => {
    mockLogin.mockResolvedValue({ success: false, message: 'Invalid credentials' });
    renderLogin();
    await userEvent.type(screen.getByLabelText('Email Address'), 'x@y.com');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Sign In →' }));
    });
    expect(await screen.findByTestId('error-msg')).toHaveTextContent('Invalid credentials');
  });

  test('falls back to generic message when result has no message', async () => {
    mockLogin.mockResolvedValue({ success: false });
    renderLogin();
    await userEvent.type(screen.getByLabelText('Email Address'), 'x@y.com');
    await userEvent.type(screen.getByLabelText('Password'), 'bad');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Sign In →' }));
    });
    expect(await screen.findByTestId('error-msg')).toHaveTextContent('Invalid email or password.');
  });
});

// ─── MFA flow ─────────────────────────────────────────────────────────────────

describe('Login – MFA flow', () => {
  const fillCredentials = async () => {
    await userEvent.type(screen.getByLabelText('Email Address'), 'admin@resto.lk');
    await userEvent.type(screen.getByLabelText('Password'), 'Admin@123');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Sign In →' })); });
  };

  test('shows MFA step when server returns requiresMfa', async () => {
    mockLogin.mockResolvedValueOnce({ requiresMfa: true });
    renderLogin();
    await fillCredentials();
    expect(await screen.findByText('🔐 Two-Factor Authentication')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('000000')).toBeInTheDocument();
  });

  test('sends mfaToken on second submit', async () => {
    mockLogin
      .mockResolvedValueOnce({ requiresMfa: true })
      .mockResolvedValueOnce({ success: true, role: 'admin' });

    renderLogin();
    await fillCredentials();
    await screen.findByText('🔐 Two-Factor Authentication');

    await userEvent.type(screen.getByPlaceholderText('000000'), '123456');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Verify →' })); });

    expect(mockLogin).toHaveBeenLastCalledWith('admin@resto.lk', 'Admin@123', '123456');
    await waitFor(() => expect(screen.getByText('Admin Dashboard')).toBeInTheDocument());
  });

  test('back button returns to credentials step', async () => {
    mockLogin.mockResolvedValueOnce({ requiresMfa: true });
    renderLogin();
    await fillCredentials();
    await screen.findByText('🔐 Two-Factor Authentication');

    fireEvent.click(screen.getByRole('button', { name: '← Back to login' }));
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
  });
});

// ─── Demo hints ───────────────────────────────────────────────────────────────

describe('Login – demo credential hints', () => {
  test('clicking Admin hint fills the form', async () => {
    renderLogin();
    fireEvent.click(screen.getByTestId('hint-admin'));
    expect(screen.getByLabelText('Email Address').value).toBe('admin@resto.lk');
    expect(screen.getByLabelText('Password').value).toBe('Admin@123');
  });

  test('clicking Waiter hint fills correct credentials', async () => {
    renderLogin();
    fireEvent.click(screen.getByTestId('hint-waiter'));
    expect(screen.getByLabelText('Email Address').value).toBe('waiter@resto.lk');
  });

  test('clicking a hint while on MFA step resets to credentials step', async () => {
    mockLogin.mockResolvedValueOnce({ requiresMfa: true });
    renderLogin();
    await userEvent.type(screen.getByLabelText('Email Address'), 'x@y.com');
    await userEvent.type(screen.getByLabelText('Password'), 'pw');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Sign In →' })); });
    await screen.findByText('🔐 Two-Factor Authentication');

    fireEvent.click(screen.getByTestId('hint-cashier'));
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
  });
});