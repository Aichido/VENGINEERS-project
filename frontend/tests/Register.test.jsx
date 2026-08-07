import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Register from '../src/pages/public/Register';
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

describe('Register', () => {
  const mockRegister = vi.fn();

  const renderRegister = () => {
    useAuth.mockReturnValue({ register: mockRegister });
    return render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    mockRegister.mockReset();
    useAuth.mockReset();
  });

  it('renders the registration form', () => {
    renderRegister();
    expect(screen.getByRole('heading', { name: /create an account/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Full name *')).toBeInTheDocument();
    expect(screen.getByLabelText('Professional email *')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone')).toBeInTheDocument();
    expect(screen.getByLabelText('Password *')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm password *')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create my account/i })).toBeInTheDocument();
  });

  it('validates required fields and password match', async () => {
    const user = userEvent.setup();
    renderRegister();

    // On coche la checkbox une fois pour toutes les sous-tentatives de ce test
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    // Test required fields (rien rempli)
    await user.click(screen.getByRole('button', { name: /create my account/i }));
    expect(await screen.findByText(/please fill in all required fields/i)).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();

    // Test password mismatch (on remplit partiellement)
    await user.type(screen.getByLabelText('Full name *'), 'John Doe');
    await user.type(screen.getByLabelText('Professional email *'), 'john@example.com');
    await user.type(screen.getByLabelText('Password *'), 'password123');
    await user.type(screen.getByLabelText('Confirm password *'), 'different');
    await user.click(screen.getByRole('button', { name: /create my account/i }));
    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();

    // Test password length
    await user.clear(screen.getByLabelText('Password *'));
    await user.type(screen.getByLabelText('Password *'), 'short');
    await user.clear(screen.getByLabelText('Confirm password *'));
    await user.type(screen.getByLabelText('Confirm password *'), 'short');
    await user.click(screen.getByRole('button', { name: /create my account/i }));
    expect(await screen.findByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('calls register with correct payload on valid submission', async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValue({});
    renderRegister();

    await user.type(screen.getByLabelText('Full name *'), 'John Doe');
    await user.type(screen.getByLabelText('Professional email *'), 'john@example.com');
    await user.type(screen.getByLabelText('Phone'), '0123456789');
    await user.type(screen.getByLabelText('Password *'), 'password123');
    await user.type(screen.getByLabelText('Confirm password *'), 'password123');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /create my account/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '0123456789',
        password: 'password123',
        password_confirmation: 'password123',
      });
    });
  });

  it('displays success message and redirects after 2s', async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValue({});
    renderRegister();

    await user.type(screen.getByLabelText('Full name *'), 'John Doe');
    await user.type(screen.getByLabelText('Professional email *'), 'john@example.com');
    await user.type(screen.getByLabelText('Password *'), 'password123');
    await user.type(screen.getByLabelText('Confirm password *'), 'password123');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /create my account/i }));

    expect(await screen.findByText(/registration successful/i)).toBeInTheDocument();
  });

  it('displays field errors from 422 response', async () => {
    const user = userEvent.setup();
    const error = {
      response: {
        status: 422,
        data: {
          errors: {
            email: ['The email has already been taken.'],
            password: ['The password must be at least 8 characters.'],
          },
        },
      },
    };
    mockRegister.mockRejectedValue(error);
    renderRegister();

    await user.type(screen.getByLabelText('Full name *'), 'John Doe');
    await user.type(screen.getByLabelText('Professional email *'), 'existing@example.com');
    await user.type(screen.getByLabelText('Password *'), 'password123');
    await user.type(screen.getByLabelText('Confirm password *'), 'password123');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /create my account/i }));

    expect(await screen.findByText(/please correct the errors below/i)).toBeInTheDocument();
    expect(screen.getByText(/The email has already been taken./i)).toBeInTheDocument();
    expect(screen.getByText(/The password must be at least 8 characters./i)).toBeInTheDocument();
  });

  it('shows generic error on other failures', async () => {
    const user = userEvent.setup();
    mockRegister.mockRejectedValue(new Error('Network error'));
    renderRegister();

    await user.type(screen.getByLabelText('Full name *'), 'John Doe');
    await user.type(screen.getByLabelText('Professional email *'), 'john@example.com');
    await user.type(screen.getByLabelText('Password *'), 'password123');
    await user.type(screen.getByLabelText('Confirm password *'), 'password123');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /create my account/i }));

    expect(await screen.findByText(/an error occurred during registration/i)).toBeInTheDocument();
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    renderRegister();
    const passwordInput = screen.getByLabelText('Password *');
    const confirmInput = screen.getByLabelText('Confirm password *');

    const toggleButtons = screen.getAllByRole('button', { name: /show password|hide password/i });
    await user.click(toggleButtons[0]);
    expect(passwordInput).toHaveAttribute('type', 'text');
    await user.click(toggleButtons[0]);
    expect(passwordInput).toHaveAttribute('type', 'password');

    await user.click(toggleButtons[1]);
    expect(confirmInput).toHaveAttribute('type', 'text');
  });
});

