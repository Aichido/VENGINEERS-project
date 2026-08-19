import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast } from '../src/context/ToastContext';

function TestHarness() {
  const { showToast } = useToast();
  return (
    <div>
      <button onClick={() => showToast('Saved successfully.')}>Show Success</button>
      <button onClick={() => showToast('Something failed.', 'error')}>Show Error</button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <ToastProvider>
      <TestHarness />
    </ToastProvider>
  );
}

describe('ToastContext + Toast', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('throws when useToast is used outside of a ToastProvider', () => {
    function Broken() {
      useToast();
      return null;
    }
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Broken />)).toThrow('useToast must be used within a ToastProvider');
    spy.mockRestore();
  });

  it('shows a success toast with the message', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    await user.click(screen.getByRole('button', { name: /show success/i }));

    expect(await screen.findByText('Saved successfully.')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows an error toast', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    await user.click(screen.getByRole('button', { name: /show error/i }));

    expect(await screen.findByText('Something failed.')).toBeInTheDocument();
  });

  it('dismisses a toast when the close button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    await user.click(screen.getByRole('button', { name: /show success/i }));
    expect(await screen.findByText('Saved successfully.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /dismiss/i }));

    expect(screen.queryByText('Saved successfully.')).not.toBeInTheDocument();
  });

  it('auto-dismisses a toast after the timeout', () => {
    vi.useFakeTimers();
    renderWithProvider();

    fireEvent.click(screen.getByRole('button', { name: /show success/i }));
    expect(screen.getByText('Saved successfully.')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3600);
    });

    expect(screen.queryByText('Saved successfully.')).not.toBeInTheDocument();
  });

  it('shows multiple toasts stacked at once', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    await user.click(screen.getByRole('button', { name: /show success/i }));
    await user.click(screen.getByRole('button', { name: /show error/i }));

    expect(await screen.findByText('Saved successfully.')).toBeInTheDocument();
    expect(screen.getByText('Something failed.')).toBeInTheDocument();
  });
});