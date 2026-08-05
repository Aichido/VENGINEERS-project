import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Footer from '../src/components/Footer'

describe('Footer', () => {
  it('renders all sections', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    )
    // Vérifier les titres principaux
    expect(screen.getByText('Vengineers')).toBeInTheDocument()
    expect(screen.getByText(/Specialist in large-format interactive display solutions/i)).toBeInTheDocument()
    expect(screen.getByText('CONTACT')).toBeInTheDocument()
    expect(screen.getByText('NAVIGATION')).toBeInTheDocument()
    expect(screen.getByText('SOCIAL MEDIA')).toBeInTheDocument()

    // Vérifier les liens de navigation (Home, About, Products, Services)
    expect(screen.getByRole('link', { name: /Home/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /About/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Products/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Services/i })).toBeInTheDocument()

    // Vérifier qu'il y a au moins deux liens contenant "Contact" (le bouton "Contact Us" et le lien "Contact" dans la navigation)
    const contactLinks = screen.getAllByRole('link', { name: /Contact/i })
    expect(contactLinks.length).toBeGreaterThanOrEqual(2)

    // Vérifier le bouton "Contact Us" (cible spécifique)
    expect(screen.getByRole('link', { name: /Contact Us/i })).toBeInTheDocument()

    // Vérifier les liens sociaux
    expect(screen.getByLabelText(/Facebook/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Instagram/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/LinkedIn/i)).toBeInTheDocument()

    // Vérifier le copyright
    expect(screen.getByText(/All rights reserved/i)).toBeInTheDocument()
  })

  it('changes background color on hover for Contact Us button', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    )
    const contactButton = screen.getByRole('link', { name: /Contact Us/i })
    expect(contactButton.style.backgroundColor).toBe('rgb(248, 0, 0)')
    fireEvent.mouseEnter(contactButton)
    expect(contactButton.style.backgroundColor).toBe('rgb(198, 34, 33)')
    fireEvent.mouseLeave(contactButton)
    expect(contactButton.style.backgroundColor).toBe('rgb(248, 0, 0)')
  })
})