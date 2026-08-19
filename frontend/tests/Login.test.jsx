// Login.test.jsx — ajout de la route /technicien
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Login from '../src/pages/public/Login';
import { useAuth } from '../src/context/AuthContext';

vi.mock('../src/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../src/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('Login', () => {
  const mockLogin = vi.fn();

  const renderLogin = () => {
    useAuth.mockReturnValue({ login: mockLogin });
    return render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
  };

  const renderLoginWithRoutes = () => {
    useAuth.mockReturnValue({ login: mockLogin });
    return render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/client" element={<div>Client dashboard</div>} />
          <Route path="/commercial" element={<div>Commercial dashboard</div>} />
          <Route path="/technicien" element={<div>Technicien dashboard</div>} />
          <Route path="/admin" element={<div>Admin dashboard</div>} />
          <Route path="/" element={<div>Home page</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    mockLogin.mockReset();
    useAuth.mockReset();
  });

  it('renders the login form', () => {
    renderLogin();
    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  it('shows error if fields are empty on submit', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.click(screen.getByRole('button', { name: /log in/i }));
    expect(await screen.findByText(/please fill in all fields/i)).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('calls login with email and password on valid submission', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ role: { name: 'client' } });
    renderLogin();

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('navigates to /client if user role is client', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ role: { name: 'client' } });
    renderLogin();

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => expect(mockLogin).toHaveBeenCalled());
  });

  it('shows error message on 401', async () => {
    const user = userEvent.setup();
    const error = { response: { status: 401 } };
    mockLogin.mockRejectedValue(error);
    renderLogin();

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
  });

  it('shows generic error on other errors', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValue(new Error('Network error'));
    renderLogin();

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText(/an error occurred/i)).toBeInTheDocument();
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    renderLogin();
    const passwordInput = screen.getByLabelText('Password');
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleButton = screen.getByRole('button', { name: /show password/i });
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('redirects to /client on the real router when the role is client', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ role: { name: 'client' } });
    renderLoginWithRoutes();

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText('Client dashboard')).toBeInTheDocument();
  });

  it('redirects to /commercial on the real router when the role is commercial', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ role: { name: 'commercial' } });
    renderLoginWithRoutes();

    await user.type(screen.getByLabelText('Email'), 'commercial@vengineers.net');
    await user.type(screen.getByLabelText('Password'), 'vengineers@123');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText('Commercial dashboard')).toBeInTheDocument();
  });

  it('redirects to /technicien on the real router when the role is technicien', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ role: { name: 'technicien' } });
    renderLoginWithRoutes();

    await user.type(screen.getByLabelText('Email'), 'technicien@vengineers.net');
    await user.type(screen.getByLabelText('Password'), 'vengineers@123');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText('Technicien dashboard')).toBeInTheDocument();
  });

  it('redirects to /admin on the real router when the role is admin', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ role: { name: 'admin' } });
    renderLoginWithRoutes();

    await user.type(screen.getByLabelText('Email'), 'admin@vengineers.net');
    await user.type(screen.getByLabelText('Password'), 'vengineers@123');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText('Admin dashboard')).toBeInTheDocument();
  });
});