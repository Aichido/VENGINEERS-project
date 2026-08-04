import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContactForm from '../src/components/ContactForm';
import api from '../src/services/api';

// Mock the shared Axios instance so no real network call is made.
// Each test configures api.post's resolved/rejected value as needed.
vi.mock('../src/services/api', () => ({
  default: {
    post: vi.fn(),
  },
}));

async function fillValidForm(user) {
  // userEvent.type() simulates keystroke-by-keystroke typing asynchronously.
  // These must run sequentially (not Promise.all) or keystrokes interleave
  // across fields and corrupt the typed values.
  await user.type(screen.getByLabelText(/full name/i), 'Jean Dupont');
  await user.type(screen.getByLabelText(/business email/i), 'jean@company.com');
  await user.type(screen.getByLabelText(/subject/i), 'Quote request');
  await user.type(screen.getByLabelText(/your message/i), 'I need a quote for 3 touchscreens.');
}

beforeEach(() => {
  api.post.mockReset();
});

describe('ContactForm', () => {
  it('renders all the expected fields', () => {
    render(<ContactForm />);

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/business email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^phone$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/your message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send my request/i })).toBeInTheDocument();
  });

  it('lets the user type into each field', async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.type(screen.getByLabelText(/full name/i), 'Jean Dupont');
    await user.type(screen.getByLabelText(/business email/i), 'jean@company.com');

    expect(screen.getByLabelText(/full name/i)).toHaveValue('Jean Dupont');
    expect(screen.getByLabelText(/business email/i)).toHaveValue('jean@company.com');
  });

  it('submits successfully, shows a confirmation, then clears the form', async () => {
    api.post.mockResolvedValueOnce({ data: {} });
    const user = userEvent.setup();
    render(<ContactForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /send my request/i }));

    expect(
      await screen.findByRole('button', { name: /message sent/i })
    ).toBeInTheDocument();

    expect(api.post).toHaveBeenCalledWith(
      '/contact',
      expect.objectContaining({
        name: 'Jean Dupont',
        email: 'jean@company.com',
        subject: 'Quote request',
        message: 'I need a quote for 3 touchscreens.',
      })
    );

    // Form resets after a successful submission
    await waitFor(() => {
      expect(screen.getByLabelText(/full name/i)).toHaveValue('');
    });
  });

  it('shows a loading state while the request is in flight', async () => {
    let resolvePost;
    api.post.mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePost = resolve;
      })
    );

    const user = userEvent.setup();
    render(<ContactForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /send my request/i }));

    expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled();

    resolvePost({ data: {} });
    expect(
      await screen.findByRole('button', { name: /message sent/i })
    ).toBeInTheDocument();
  });

  it('displays field-specific validation errors on a 422 response', async () => {
    api.post.mockRejectedValueOnce({
      response: {
        status: 422,
        data: {
          errors: {
            name: ['The name field is required.'],
            email: ['The email must be a valid email address.'],
            subject: ['The subject field is required.'],
            message: ['The message field is required.'],
          },
        },
      },
    });

    const user = userEvent.setup();
    render(<ContactForm />);

    await user.click(screen.getByRole('button', { name: /send my request/i }));

    expect(
      await screen.findByText(/the name field is required\./i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/the email must be a valid email address\./i)
    ).toBeInTheDocument();
    expect(screen.getByText(/the subject field is required\./i)).toBeInTheDocument();
    expect(screen.getByText(/the message field is required\./i)).toBeInTheDocument();
  });

  it('shows a generic error message on a non-422 failure', async () => {
    api.post.mockRejectedValueOnce(new Error('Network Error'));

    const user = userEvent.setup();
    render(<ContactForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /send my request/i }));

    expect(
      await screen.findByText(/something went wrong\. please try again\./i)
    ).toBeInTheDocument();
  });
});