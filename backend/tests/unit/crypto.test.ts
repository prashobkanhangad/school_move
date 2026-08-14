import { describe, it, expect } from 'vitest';
import { haversineDistanceMeters, hashToken } from '../../src/utils/crypto';

describe('crypto utils', () => {
  it('hashToken returns consistent sha256 hex', () => {
    const hash = hashToken('my-refresh-token');
    expect(hash).toHaveLength(64);
    expect(hashToken('my-refresh-token')).toBe(hash);
  });

  it('haversineDistanceMeters calculates ~0 for same point', () => {
    expect(haversineDistanceMeters(19.076, 72.8777, 19.076, 72.8777)).toBe(0);
  });

  it('haversineDistanceMeters calculates known distance', () => {
    // Mumbai Andheri to Bandra ~ approx 8-10km
    const distance = haversineDistanceMeters(19.1197, 72.8468, 19.0596, 72.8295);
    expect(distance).toBeGreaterThan(5000);
    expect(distance).toBeLessThan(15000);
  });
});
