import { describe, it, expect } from 'vitest';
import { generateCodeVerifier, generateCodeChallenge, generateState } from './pkce.js';

describe('PKCE Utilities', () => {
  describe('generateCodeVerifier', () => {
    it('should generate a code verifier', () => {
      const verifier = generateCodeVerifier();

      expect(verifier).toBeTruthy();
      expect(typeof verifier).toBe('string');
    });

    it('should generate verifier with correct length', () => {
      const verifier = generateCodeVerifier();

      // RFC 7636: 43-128 characters
      expect(verifier.length).toBeGreaterThanOrEqual(43);
      expect(verifier.length).toBeLessThanOrEqual(128);
    });

    it('should only contain valid characters [A-Z, a-z, 0-9, -, ., _, ~]', () => {
      const verifier = generateCodeVerifier();

      // Check against allowed characters
      const validChars = /^[A-Za-z0-9\-._~]+$/;
      expect(verifier).toMatch(validChars);
    });

    it('should generate unique verifiers', () => {
      const verifier1 = generateCodeVerifier();
      const verifier2 = generateCodeVerifier();

      expect(verifier1).not.toBe(verifier2);
    });
  });

  describe('generateCodeChallenge', () => {
    it('should generate a code challenge from verifier', () => {
      const verifier = generateCodeVerifier();
      const challenge = generateCodeChallenge(verifier);

      expect(challenge).toBeTruthy();
      expect(typeof challenge).toBe('string');
    });

    it('should generate deterministic challenge for same verifier', () => {
      const verifier = 'test-verifier-123';
      const challenge1 = generateCodeChallenge(verifier);
      const challenge2 = generateCodeChallenge(verifier);

      expect(challenge1).toBe(challenge2);
    });

    it('should generate different challenges for different verifiers', () => {
      const verifier1 = 'verifier-1';
      const verifier2 = 'verifier-2';

      const challenge1 = generateCodeChallenge(verifier1);
      const challenge2 = generateCodeChallenge(verifier2);

      expect(challenge1).not.toBe(challenge2);
    });

    it('should only contain Base64-URL characters', () => {
      const verifier = generateCodeVerifier();
      const challenge = generateCodeChallenge(verifier);

      // Base64-URL: A-Z, a-z, 0-9, -, _  (no padding)
      const validChars = /^[A-Za-z0-9\-_]+$/;
      expect(challenge).toMatch(validChars);
      expect(challenge).not.toContain('='); // No padding
      expect(challenge).not.toContain('+');
      expect(challenge).not.toContain('/');
    });

    it('should generate correct SHA256 hash', () => {
      // Known test vector
      const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
      const expectedChallenge = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';

      const challenge = generateCodeChallenge(verifier);

      expect(challenge).toBe(expectedChallenge);
    });
  });

  describe('generateState', () => {
    it('should generate a state parameter', () => {
      const state = generateState();

      expect(state).toBeTruthy();
      expect(typeof state).toBe('string');
    });

    it('should generate hex string', () => {
      const state = generateState();

      // Hex characters only
      const validHex = /^[0-9a-f]+$/;
      expect(state).toMatch(validHex);
    });

    it('should generate unique states', () => {
      const state1 = generateState();
      const state2 = generateState();

      expect(state1).not.toBe(state2);
    });

    it('should generate sufficient length for security', () => {
      const state = generateState();

      // At least 32 bytes = 64 hex characters
      expect(state.length).toBeGreaterThanOrEqual(64);
    });
  });
});
