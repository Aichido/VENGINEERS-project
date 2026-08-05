import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Header from '../src/components/Header'

describe('Header', () => {
  it('renders navigation links', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    )
    expect(screen.getByRole('link', { name: /Home/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /About/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Products/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Services/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Contact/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Request a Quote/i })).toBeInTheDocument()
  })

  it('applies active class to current route', () => {
    render(
      <MemoryRouter initialEntries={['/products']}>
        <Header />
      </MemoryRouter>
    )
    const productsLink = screen.getByRole('link', { name: /Products/i })
    expect(productsLink).toHaveClass('border-b-2')
    expect(productsLink.style.borderColor).toBe('rgb(188, 1, 0)')
  })

  it('toggles mobile menu on hamburger click', () => {
    const { container } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    )
    // Le menu mobile n'est pas présent initialement
    expect(container.querySelector('.md\\:hidden.border-t')).not.toBeInTheDocument()

    const hamburger = screen.getByRole('button', { name: /Open menu/i })
    fireEvent.click(hamburger)

    const mobileMenu = container.querySelector('.md\\:hidden.border-t')
    expect(mobileMenu).toBeInTheDocument()
    expect(mobileMenu.querySelector('a[href="/"]')).toBeInTheDocument()

    fireEvent.click(hamburger)
    expect(container.querySelector('.md\\:hidden.border-t')).not.toBeInTheDocument()
  })

  // --- Nouveaux tests pour couvrir les lignes 56-57 et 97 ---

  it('changes background color on hover for desktop quote button', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    )
    // Récupérer le lien "Request a Quote" de la version desktop
    // (le premier dans le DOM, car il apparaît avant le mobile)
    const quoteLinks = screen.getAllByRole('link', { name: /Request a Quote/i })
    // Le premier est le desktop (dans le nav principal), le second est le mobile
    const desktopQuote = quoteLinks[0]

    // Vérifier la couleur initiale (rouge primaire)
    expect(desktopQuote.style.backgroundColor).toBe('rgb(188, 1, 0)')

    // Simuler le survol → couleur primaireHover (#C62221)
    fireEvent.mouseEnter(desktopQuote)
    expect(desktopQuote.style.backgroundColor).toBe('rgb(198, 34, 33)')

    // Simuler la sortie → retour à la couleur primaire
    fireEvent.mouseLeave(desktopQuote)
    expect(desktopQuote.style.backgroundColor).toBe('rgb(188, 1, 0)')
  })

  it('closes mobile menu when a link is clicked', () => {
    const { container } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    )
    // Ouvrir le menu mobile
    const hamburger = screen.getByRole('button', { name: /Open menu/i })
    fireEvent.click(hamburger)

    const mobileMenu = container.querySelector('.md\\:hidden.border-t')
    expect(mobileMenu).toBeInTheDocument()

    // Cliquer sur un lien du menu mobile (par exemple "Home")
    const homeLinkMobile = mobileMenu.querySelector('a[href="/"]')
    fireEvent.click(homeLinkMobile)

    // Le menu doit se fermer
    expect(container.querySelector('.md\\:hidden.border-t')).not.toBeInTheDocument()
  })
})