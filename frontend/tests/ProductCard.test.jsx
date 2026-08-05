import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ProductCard from '../src/components/ProductCard'
import { formatPrice } from '../src/lib/formatPrice'

// Mock du formatPrice pour simplifier les assertions
vi.mock('../src/lib/formatPrice', () => ({
  formatPrice: vi.fn((price) => `Rs ${price}`),
}))

describe('ProductCard', () => {
  const defaultProps = {
    id: 1,
    name: 'Test Product',
    category: 'Electronics',
    image: 'test.jpg',
    description: 'Test description',
    price: 100,
    createdAt: new Date().toISOString(),
  }

  it('renders product information correctly', () => {
    render(
      <MemoryRouter>
        <ProductCard {...defaultProps} />
      </MemoryRouter>
    )
    expect(screen.getByText('Test Product')).toBeInTheDocument()
    expect(screen.getByText('Electronics')).toBeInTheDocument()
    expect(screen.getByText('Test description')).toBeInTheDocument()
    expect(screen.getByText('Rs 100')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Test Product' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /View Details →/i })).toHaveAttribute('href', '/products/1')
  })

  it('shows NEW badge when product is created within 30 days', () => {
    // Date récente : 10 jours dans le passé
    const recentDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    render(
      <MemoryRouter>
        <ProductCard {...defaultProps} createdAt={recentDate} />
      </MemoryRouter>
    )
    expect(screen.getByText('NEW')).toBeInTheDocument()
  })

  it('does not show NEW badge when product is older than 30 days', () => {
    // Date ancienne : 40 jours dans le passé
    const oldDate = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()
    render(
      <MemoryRouter>
        <ProductCard {...defaultProps} createdAt={oldDate} />
      </MemoryRouter>
    )
    expect(screen.queryByText('NEW')).not.toBeInTheDocument()
  })

  it('does not show NEW badge when createdAt is missing', () => {
    render(
      <MemoryRouter>
        <ProductCard {...defaultProps} createdAt={null} />
      </MemoryRouter>
    )
    expect(screen.queryByText('NEW')).not.toBeInTheDocument()
  })

  it('applies hover styles to the View Details link', () => {
    render(
      <MemoryRouter>
        <ProductCard {...defaultProps} />
      </MemoryRouter>
    )
    const link = screen.getByRole('link', { name: /View Details →/i })
    // État initial : fond transparent, texte rouge
    expect(link.style.backgroundColor).toBe('transparent')
    expect(link.style.color).toBe('rgb(248, 0, 0)')
    // Survol : fond rouge, texte blanc
    fireEvent.mouseEnter(link)
    expect(link.style.backgroundColor).toBe('rgb(248, 0, 0)')
    expect(link.style.color).toBe('rgb(255, 255, 255)')
    // Sortie : retour à l'état initial
    fireEvent.mouseLeave(link)
    expect(link.style.backgroundColor).toBe('transparent')
    expect(link.style.color).toBe('rgb(248, 0, 0)')
  })
})