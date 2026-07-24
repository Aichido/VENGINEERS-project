import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StrictMode } from 'react';

// main.jsx exécute du code au moment de l'import (side-effect : createRoot(...).render(...)).
// On mocke react-dom/client pour vérifier que le point d'entrée fait bien
// ce qu'on attend de lui, sans monter un vrai arbre React ni dépendre du DOM réel.

const renderMock = vi.fn();
const createRootMock = vi.fn(() => ({ render: renderMock }));

vi.mock('react-dom/client', () => ({
  createRoot: createRootMock,
}));

describe('main.jsx (point d\'entrée de l\'application)', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    vi.clearAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('appelle createRoot sur l\'élément #root', async () => {
    await import('../src/main.jsx');

    const rootElement = document.getElementById('root');
    expect(createRootMock).toHaveBeenCalledWith(rootElement);
  });

  it('appelle render une seule fois avec l\'app enveloppée dans StrictMode', async () => {
    await import('../src/main.jsx');

    expect(renderMock).toHaveBeenCalledTimes(1);
    const renderedTree = renderMock.mock.calls[0][0];
    expect(renderedTree.type).toBe(StrictMode);
  });
});
