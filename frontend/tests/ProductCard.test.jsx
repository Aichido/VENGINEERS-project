import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ProductCard from '../src/components/ProductCard';
import { useCart } from '../src/context/CartContext';

vi.mock('../src/lib/formatPrice', () => ({
  formatPrice: vi.fn((price) => `Rs ${price}`),
}));

vi.mock('../src/context/CartContext', () => ({
  useCart: vi.fn(),
}));

describe('ProductCard', () => {
  const defaultProps = {
    id: 1,
    name: 'Test Product',
    category: 'Electronics',
    image: 'test.jpg',
    description: 'Test description',
    price: 100,
    createdAt: new Date().toISOString(),
    stockQty: 5,
  };

  const mockAddToCart = vi.fn();

  const renderProductCard = (props = {}) => {
    useCart.mockReturnValue({ addToCart: mockAddToCart });
    return render(
      <MemoryRouter>
        <ProductCard {...defaultProps} {...props} />
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    mockAddToCart.mockReset();
    vi.clearAllMocks();
  });

  it('renders product information correctly', () => {
    renderProductCard();
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText('Rs 100')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Test Product' })).toBeInTheDocument();
    const detailsLink = screen.getByRole('link', { name: /Details →/i });
    expect(detailsLink).toHaveAttribute('href', '/products/1');
  });

  it('shows NEW badge when product is created within 30 days', () => {
    const recentDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    renderProductCard({ createdAt: recentDate });
    expect(screen.getByText('NEW')).toBeInTheDocument();
  });

  it('does not show NEW badge when product is older than 30 days', () => {
    const oldDate = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString();
    renderProductCard({ createdAt: oldDate });
    expect(screen.queryByText('NEW')).not.toBeInTheDocument();
  });

  it('does not show NEW badge when createdAt is missing', () => {
    renderProductCard({ createdAt: null });
    expect(screen.queryByText('NEW')).not.toBeInTheDocument();
  });

  it('calls addToCart with correct product when Add to Cart button is clicked', async () => {
    const user = userEvent.setup();
    renderProductCard();
    const addButton = screen.getByRole('button', { name: /Add to Cart/i });
    await user.click(addButton);

    expect(mockAddToCart).toHaveBeenCalledTimes(1);
    expect(mockAddToCart).toHaveBeenCalledWith({
      id: 1,
      name: 'Test Product',
      price: 100,
      image: 'test.jpg',
      stock_qty: 5,
    });
  });

  it('changes button text and icon to "Added" after click, then reverts after 1.5s', async () => {
    const user = userEvent.setup();
    renderProductCard();

    const addButton = screen.getByRole('button', { name: /Add to Cart/i });
    await user.click(addButton);

    // Vérifier que le texte est devenu "Added"
    await waitFor(() => expect(screen.getByText('Added')).toBeInTheDocument());

    // Attendre le retour à l'état initial (1.5s + un peu de marge)
    // On utilise un délai réel pour éviter les problèmes avec les timers simulés
    await new Promise((resolve) => setTimeout(resolve, 1600));
    await waitFor(() => expect(screen.getByText('Add to Cart')).toBeInTheDocument());
  });

  it('disables the Add to Cart button and shows "Out of stock" when stockQty is 0', () => {
    renderProductCard({ stockQty: 0 });
    const button = screen.getByRole('button', { name: /Out of stock/i });
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Out of stock');
  });

  it('does not call addToCart when button is disabled (out of stock)', async () => {
    const user = userEvent.setup();
    renderProductCard({ stockQty: 0 });
    const button = screen.getByRole('button', { name: /Out of stock/i });
    await user.click(button);
    expect(mockAddToCart).not.toHaveBeenCalled();
  });

  // Utilisation de fireEvent pour les hover (plus fiable pour ce cas)
  it('changes background color on hover for Add to Cart button (when not out of stock)', () => {
    renderProductCard();
    const button = screen.getByRole('button', { name: /Add to Cart/i });
    expect(button.style.backgroundColor).toBe('rgb(248, 0, 0)');

    fireEvent.mouseEnter(button);
    expect(button.style.backgroundColor).toBe('rgb(198, 34, 33)');

    fireEvent.mouseLeave(button);
    expect(button.style.backgroundColor).toBe('rgb(248, 0, 0)');
  });

  it('changes background color on hover for Details link', () => {
    renderProductCard();
    const link = screen.getByRole('link', { name: /Details →/i });
    expect(link.style.backgroundColor).toBe('transparent');
    expect(link.style.color).toBe('rgb(248, 0, 0)');

    fireEvent.mouseEnter(link);
    expect(link.style.backgroundColor).toBe('rgb(248, 0, 0)');
    expect(link.style.color).toBe('rgb(255, 255, 255)');

    fireEvent.mouseLeave(link);
    expect(link.style.backgroundColor).toBe('transparent');
    expect(link.style.color).toBe('rgb(248, 0, 0)');
  });

  it('does not apply hover effects to Add to Cart button when out of stock', () => {
    renderProductCard({ stockQty: 0 });
    const button = screen.getByRole('button', { name: /Out of stock/i });
    expect(button.style.backgroundColor).toBe('rgb(248, 0, 0)');

    fireEvent.mouseEnter(button);
    // La couleur ne change pas car disabled -> onMouseEnter ne s'applique pas
    expect(button.style.backgroundColor).toBe('rgb(248, 0, 0)');
  });
});