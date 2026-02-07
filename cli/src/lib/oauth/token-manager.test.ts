import { describe, it, expect, beforeEach } from 'vitest';
import { isTokenExpired, calculateExpiresAt } from './token-manager.js';

describe('Token Manager', () => {
  describe('isTokenExpired', () => {
    it('should return false for undefined expiresAt', () => {
      expect(isTokenExpired(undefined)).toBe(false);
    });

    it('should return true for expired token', () => {
      const pastTime = Date.now() - 10000; // 10 seconds ago
      expect(isTokenExpired(pastTime, 0)).toBe(true);
    });

    it('should return false for future token', () => {
      const futureTime = Date.now() + 3600000; // 1 hour from now
      expect(isTokenExpired(futureTime, 0)).toBe(false);
    });

    it('should apply buffer time correctly', () => {
      const nearFutureTime = Date.now() + 60000; // 1 minute from now

      // With default 5-minute buffer, should be considered expired
      expect(isTokenExpired(nearFutureTime)).toBe(true);

      // With 30-second buffer, should NOT be expired
      expect(isTokenExpired(nearFutureTime, 30)).toBe(false);
    });

    it('should use default 5-minute buffer', () => {
      const fourMinutesFromNow = Date.now() + 4 * 60 * 1000;

      // Should be considered expired (within 5-minute buffer)
      expect(isTokenExpired(fourMinutesFromNow)).toBe(true);

      const sixMinutesFromNow = Date.now() + 6 * 60 * 1000;

      // Should NOT be expired (outside 5-minute buffer)
      expect(isTokenExpired(sixMinutesFromNow)).toBe(false);
    });
  });

  describe('calculateExpiresAt', () => {
    beforeEach(() => {
      // Note: We can't freeze time easily, so we test relative values
    });

    it('should return undefined for undefined expiresIn', () => {
      expect(calculateExpiresAt(undefined)).toBeUndefined();
    });

    it('should calculate correct expiration timestamp', () => {
      const expiresIn = 3600; // 1 hour
      const before = Date.now();
      const expiresAt = calculateExpiresAt(expiresIn);
      const after = Date.now();

      expect(expiresAt).toBeDefined();
      expect(expiresAt!).toBeGreaterThanOrEqual(before + expiresIn * 1000);
      expect(expiresAt!).toBeLessThanOrEqual(after + expiresIn * 1000);
    });

    it('should handle zero expiresIn', () => {
      const expiresAt = calculateExpiresAt(0);
      const now = Date.now();

      expect(expiresAt).toBeDefined();
      expect(expiresAt!).toBeLessThanOrEqual(now + 100); // Small margin
    });

    it('should handle large expiresIn values', () => {
      const expiresIn = 86400 * 30; // 30 days
      const expiresAt = calculateExpiresAt(expiresIn);
      const expectedMin = Date.now() + expiresIn * 1000;

      expect(expiresAt).toBeDefined();
      expect(expiresAt!).toBeGreaterThanOrEqual(expectedMin - 1000); // 1s margin
    });
  });

  describe('Token expiration scenarios', () => {
    it('should correctly identify token needing refresh', () => {
      // Token expires in 3 minutes (within 5-minute buffer)
      const expiresIn = 180; // 3 minutes
      const expiresAt = calculateExpiresAt(expiresIn);

      expect(isTokenExpired(expiresAt)).toBe(true);
    });

    it('should correctly identify valid token', () => {
      // Token expires in 10 minutes (outside 5-minute buffer)
      const expiresIn = 600; // 10 minutes
      const expiresAt = calculateExpiresAt(expiresIn);

      expect(isTokenExpired(expiresAt)).toBe(false);
    });

    it('should handle edge case at buffer boundary', () => {
      // Token expires in exactly 5 minutes
      const expiresIn = 300; // 5 minutes
      const expiresAt = calculateExpiresAt(expiresIn);

      // Should be considered expired (at boundary)
      expect(isTokenExpired(expiresAt)).toBe(true);
    });
  });
});
