// tests/lib/formatDate.test.js
import { describe, it, expect } from 'vitest';
import { formatDate } from '../../src/lib/formatDate';

describe('formatDate', () => {
  it('returns "—" when value is null, undefined, or empty string (covers line 2)', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
    expect(formatDate('')).toBe('—');
  });

  it('formats a valid date string correctly', () => {
    // Utiliser une date fixe pour éviter les problèmes de fuseau horaire
    const date = '2026-08-01T10:00:00.000Z';
    const result = formatDate(date);
    // Le format attendu est '1 Aug 2026' (en-GB)
    expect(result).toBe('1 Aug 2026');
  });

  it('formats another date correctly', () => {
    const date = '2026-12-25T00:00:00.000Z';
    expect(formatDate(date)).toBe('25 Dec 2026');
  });
});