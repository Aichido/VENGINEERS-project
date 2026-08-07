// tests/Pagination.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Pagination from '../src/components/Pagination';

describe('Pagination', () => {
  it('renders nothing when lastPage <= 1', () => {
    const onPageChange = vi.fn();
    const { container } = render(
      <Pagination page={1} lastPage={1} onPageChange={onPageChange} />
    );
    expect(container).toBeEmptyDOMElement(); // or expect(screen.queryByText('Previous')).not.toBeInTheDocument()
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('renders pagination controls when lastPage > 1', () => {
    render(<Pagination page={1} lastPage={3} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Previous/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Next/i })).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
  });

  it('disables Previous button on first page', () => {
    render(<Pagination page={1} lastPage={3} onPageChange={vi.fn()} />);
    const prev = screen.getByRole('button', { name: /Previous/i });
    expect(prev).toBeDisabled();
  });

  it('disables Next button on last page', () => {
    render(<Pagination page={3} lastPage={3} onPageChange={vi.fn()} />);
    const next = screen.getByRole('button', { name: /Next/i });
    expect(next).toBeDisabled();
  });

  it('calls onPageChange with page-1 when Previous clicked', async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    render(<Pagination page={2} lastPage={3} onPageChange={onPageChange} />);
    const prev = screen.getByRole('button', { name: /Previous/i });
    await user.click(prev);
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('calls onPageChange with page+1 when Next clicked', async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    render(<Pagination page={2} lastPage={3} onPageChange={onPageChange} />);
    const next = screen.getByRole('button', { name: /Next/i });
    await user.click(next);
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('does not call onPageChange when Previous disabled', async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    render(<Pagination page={1} lastPage={3} onPageChange={onPageChange} />);
    const prev = screen.getByRole('button', { name: /Previous/i });
    await user.click(prev);
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('does not call onPageChange when Next disabled', async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    render(<Pagination page={3} lastPage={3} onPageChange={onPageChange} />);
    const next = screen.getByRole('button', { name: /Next/i });
    await user.click(next);
    expect(onPageChange).not.toHaveBeenCalled();
  });
});