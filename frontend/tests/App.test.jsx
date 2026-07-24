import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App';

// NOTE : App.jsx est encore le template par défaut généré par Vite
// (logos React/Vite, compteur de démo). Ce test couvre ce composant
// tel qu'il existe aujourd'hui pour sortir le fichier du 0% de couverture,
// mais il devra être réécrit dès que App.jsx portera la vraie page Accueil
// Vengineers (routes, layout, etc.).

describe('App', () => {
  it("affiche le titre 'Get started'", () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /get started/i })).toBeInTheDocument();
  });

  it("affiche le compteur initialisé à 0", () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /count is 0/i })).toBeInTheDocument();
  });

  it("incrémente le compteur au clic", async () => {
    const user = userEvent.setup();
    render(<App />);

    const button = screen.getByRole('button', { name: /count is 0/i });
    await user.click(button);

    expect(screen.getByRole('button', { name: /count is 1/i })).toBeInTheDocument();
  });

  it("affiche les liens vers la documentation Vite et React", () => {
    render(<App />);
    expect(screen.getByRole('link', { name: /explore vite/i })).toHaveAttribute(
      'href',
      'https://vite.dev/'
    );
    expect(screen.getByRole('link', { name: /learn more/i })).toHaveAttribute(
      'href',
      'https://react.dev/'
    );
  });
});
