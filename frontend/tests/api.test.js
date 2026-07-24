import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import api from '../src/services/api';

describe('api (axios instance)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("utilise la bonne baseURL", () => {
    expect(api.defaults.baseURL).toBe('http://localhost:8000/api');
  });

  it("ajoute le header Authorization quand un token est présent dans le localStorage", async () => {
    localStorage.setItem('token', 'fake-jwt-token');

    const config = await api.interceptors.request.handlers[0].fulfilled({
      headers: {},
    });

    expect(config.headers.Authorization).toBe('Bearer fake-jwt-token');
  });

  it("n'ajoute pas le header Authorization quand il n'y a pas de token", async () => {
    localStorage.removeItem('token');

    const config = await api.interceptors.request.handlers[0].fulfilled({
      headers: {},
    });

    expect(config.headers.Authorization).toBeUndefined();
  });

  it("ne modifie pas les autres propriétés de la config", async () => {
    localStorage.setItem('token', 'abc123');

    const config = await api.interceptors.request.handlers[0].fulfilled({
      headers: {},
      url: '/products',
      method: 'get',
    });

    expect(config.url).toBe('/products');
    expect(config.method).toBe('get');
  });
});