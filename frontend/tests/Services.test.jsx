import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Services from '../src/pages/public/Services'

// Mock des composants enfants et des données pour isoler le test
vi.mock('../src/components/ServiceCard', () => ({
  default: ({ title, description }) => (
    <div data-testid="service-card">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  ),
}))

vi.mock('../src/lib/servicesData', () => ({
  secondaryServices: [
    { id: 1, title: 'Preventive Maintenance', description: 'Desc1', linkLabel: 'Learn More', icon: 'RefreshCw' },
    { id: 2, title: '24/7 Technical Support', description: 'Desc2', linkLabel: 'Contact', icon: 'Headphones' },
  ],
}))

describe('Services page', () => {
  beforeEach(() => {
    // Réinitialiser les mocks si nécessaire
  })

  it('renders the hero section', () => {
    render(
      <MemoryRouter>
        <Services />
      </MemoryRouter>
    )
    expect(screen.getByText('Our Services')).toBeInTheDocument()
    expect(screen.getByText(/Cutting-edge solutions/)).toBeInTheDocument()
  })

  it('renders the main service cards', () => {
    render(
      <MemoryRouter>
        <Services />
      </MemoryRouter>
    )
    expect(screen.getByText('Installation & Integration')).toBeInTheDocument()
    expect(screen.getByText('After-Sales Service & Repair')).toBeInTheDocument()
  })

  it('renders the secondary services via ServiceCard', () => {
    render(
      <MemoryRouter>
        <Services />
      </MemoryRouter>
    )
    expect(screen.getByText('Preventive Maintenance')).toBeInTheDocument()
    expect(screen.getByText('24/7 Technical Support')).toBeInTheDocument()
  })

  it('renders the "Why Choose Vengineers" section', () => {
    render(
      <MemoryRouter>
        <Services />
      </MemoryRouter>
    )
    expect(screen.getByText('Why Choose Vengineers?')).toBeInTheDocument()
    expect(screen.getByText('Certified Expertise')).toBeInTheDocument()
    expect(screen.getByText('Maximum Responsiveness')).toBeInTheDocument()
  })

  it('renders the "Infrastructure & Network Expertise" section', () => {
    render(
      <MemoryRouter>
        <Services />
      </MemoryRouter>
    )
    expect(screen.getByText('Infrastructure & Network Expertise')).toBeInTheDocument()
  })

  it('renders the "Featured Services" section', () => {
    render(
      <MemoryRouter>
        <Services />
      </MemoryRouter>
    )
    expect(screen.getByText('Expert Solutions for Your Infrastructure')).toBeInTheDocument()
    expect(screen.getByText('Network Solutions')).toBeInTheDocument()
    expect(screen.getByText('IT Services')).toBeInTheDocument()
    expect(screen.getByText('Maintenance')).toBeInTheDocument()
  })

  it('renders the final CTA section with both links', () => {
    render(
      <MemoryRouter>
        <Services />
      </MemoryRouter>
    )
    expect(screen.getByText('Ready to optimize your infrastructure?')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Request a Free Quote/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /View Our Products/i })).toBeInTheDocument()
  })

  // --- Tests pour les événements de survol (couvrent les lignes 101-106 et 286-287) ---

  it('applies hover styles to the "Repair Details" button', () => {
    render(
      <MemoryRouter>
        <Services />
      </MemoryRouter>
    )
    const button = screen.getByRole('button', { name: /Repair Details/i })

    // Initial: fond transparent, texte rouge (#F80000)
    expect(button.style.backgroundColor).toBe('transparent')
    expect(button.style.color).toBe('rgb(248, 0, 0)')

    // Simuler le survol (onMouseEnter) → fond rouge, texte blanc
    fireEvent.mouseEnter(button)
    expect(button.style.backgroundColor).toBe('rgb(248, 0, 0)')
    expect(button.style.color).toBe('rgb(255, 255, 255)')

    // Simuler la sortie (onMouseLeave) → retour à transparent, rouge
    fireEvent.mouseLeave(button)
    expect(button.style.backgroundColor).toBe('transparent')
    expect(button.style.color).toBe('rgb(248, 0, 0)')
  })
  
it('applies hover styles to the "Request a Free Quote" link', () => {
  render(
    <MemoryRouter>
      <Services />
    </MemoryRouter>
  )
  const link = screen.getByRole('link', { name: /Request a Free Quote/i })

  // Initialement, le style inline d'opacity n'est pas défini (vide)
  // Simuler le survol → opacité devient 0.9
  fireEvent.mouseEnter(link)
  expect(link.style.opacity).toBe('0.9')

  // Simuler la sortie → opacité redevient 1
  fireEvent.mouseLeave(link)
  expect(link.style.opacity).toBe('1')
})
})