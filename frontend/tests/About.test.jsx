import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import About from '../src/pages/public/About'

describe('About page', () => {
  it('renders the hero section', () => {
    render(
      <MemoryRouter>
        <About />
      </MemoryRouter>
    )
    expect(screen.getByText('About Vengineers')).toBeInTheDocument()
    expect(screen.getByText(/Vengineers Co. Ltd. supplies an innovative/)).toBeInTheDocument()
  })

  it('renders the Vision & Mission section', () => {
    render(
      <MemoryRouter>
        <About />
      </MemoryRouter>
    )
    expect(screen.getByText('Our Vision & Mission')).toBeInTheDocument()
    expect(screen.getByText(/Founded with the conviction/)).toBeInTheDocument()
    expect(screen.getByText(/"Innovation is not about adding features/)).toBeInTheDocument()
    expect(screen.getByAltText('Vengineers team at work')).toBeInTheDocument()
  })

  it('renders the stats section', () => {
    render(
      <MemoryRouter>
        <About />
      </MemoryRouter>
    )
    expect(screen.getByText('Vengineers by the Numbers')).toBeInTheDocument()
    expect(screen.getByText('15+')).toBeInTheDocument()
    expect(screen.getByText('Years of Experience')).toBeInTheDocument()
    expect(screen.getByText('500+')).toBeInTheDocument()
    expect(screen.getByText('International Clients')).toBeInTheDocument()
    expect(screen.getByText('24/7')).toBeInTheDocument()
    expect(screen.getByText('Technical Support')).toBeInTheDocument()
    expect(screen.getByText('98%')).toBeInTheDocument()
    expect(screen.getByText('Satisfaction Rate')).toBeInTheDocument()
  })

  it('renders the core values section', () => {
    render(
      <MemoryRouter>
        <About />
      </MemoryRouter>
    )
    expect(screen.getByText('Our Core Values')).toBeInTheDocument()
    expect(screen.getByText('Innovation')).toBeInTheDocument()
    expect(screen.getByText(/We continuously invest in R&D/)).toBeInTheDocument()
    expect(screen.getByText('Quality')).toBeInTheDocument()
    expect(screen.getByText(/Every piece of hardware undergoes/)).toBeInTheDocument()
    expect(screen.getByText('Service')).toBeInTheDocument()
    expect(screen.getByText(/Our commitment doesn't stop at delivery/)).toBeInTheDocument()
  })

  it('renders the final CTA section', () => {
    render(
      <MemoryRouter>
        <About />
      </MemoryRouter>
    )
    expect(screen.getByText('Ready to transform your space?')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Browse the Catalog/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Talk to an Expert/i })).toBeInTheDocument()
  })

  // Test pour couvrir les gestionnaires de survol (lignes 192-193)
  it('applies hover styles to the "Browse the Catalog" link', () => {
    render(
      <MemoryRouter>
        <About />
      </MemoryRouter>
    )
    const catalogLink = screen.getByRole('link', { name: /Browse the Catalog/i })

    // État initial : couleur primaire (#F80000)
    expect(catalogLink.style.backgroundColor).toBe('rgb(248, 0, 0)')

    // Survol : couleur primaireHover (#C62221)
    fireEvent.mouseEnter(catalogLink)
    expect(catalogLink.style.backgroundColor).toBe('rgb(198, 34, 33)')

    // Sortie : retour à la couleur primaire
    fireEvent.mouseLeave(catalogLink)
    expect(catalogLink.style.backgroundColor).toBe('rgb(248, 0, 0)')
  })
})