import { describe, it, expect } from 'vitest';
import {
  ANTHROPIC_PROVIDER,
  getProvider,
  listProviders,
  isProviderConfigured,
} from './providers.js';

describe('OAuth Providers', () => {
  describe('ANTHROPIC_PROVIDER', () => {
    it('should have correct configuration', () => {
      expect(ANTHROPIC_PROVIDER.name).toBe('anthropic');
      expect(ANTHROPIC_PROVIDER.displayName).toBe('Anthropic Claude');
      expect(ANTHROPIC_PROVIDER.authorizationEndpoint).toContain('anthropic.com');
      expect(ANTHROPIC_PROVIDER.tokenEndpoint).toContain('anthropic.com');
      expect(ANTHROPIC_PROVIDER.scopes).toContain('claude:api');
      expect(ANTHROPIC_PROVIDER.supportsRefresh).toBe(true);
    });

    it('should have required OAuth endpoints', () => {
      expect(ANTHROPIC_PROVIDER.authorizationEndpoint).toBeTruthy();
      expect(ANTHROPIC_PROVIDER.tokenEndpoint).toBeTruthy();
      expect(ANTHROPIC_PROVIDER.authorizationEndpoint).toMatch(/^https:\/\//);
      expect(ANTHROPIC_PROVIDER.tokenEndpoint).toMatch(/^https:\/\//);
    });
  });

  describe('getProvider', () => {
    it('should return Anthropic provider by name', () => {
      const provider = getProvider('anthropic');

      expect(provider).toBeDefined();
      expect(provider?.name).toBe('anthropic');
    });

    it('should return Anthropic provider by alias "claude"', () => {
      const provider = getProvider('claude');

      expect(provider).toBeDefined();
      expect(provider?.name).toBe('anthropic');
    });

    it('should be case-insensitive', () => {
      const provider1 = getProvider('ANTHROPIC');
      const provider2 = getProvider('Anthropic');
      const provider3 = getProvider('anthropic');

      expect(provider1).toBeDefined();
      expect(provider2).toBeDefined();
      expect(provider3).toBeDefined();
      expect(provider1?.name).toBe('anthropic');
      expect(provider2?.name).toBe('anthropic');
      expect(provider3?.name).toBe('anthropic');
    });

    it('should return null for unknown provider', () => {
      const provider = getProvider('unknown-provider');

      expect(provider).toBeNull();
    });

    it('should return null for empty string', () => {
      const provider = getProvider('');

      expect(provider).toBeNull();
    });
  });

  describe('listProviders', () => {
    it('should return array of providers', () => {
      const providers = listProviders();

      expect(Array.isArray(providers)).toBe(true);
      expect(providers.length).toBeGreaterThan(0);
    });

    it('should include Anthropic provider', () => {
      const providers = listProviders();
      const hasAnthropic = providers.some((p) => p.name === 'anthropic');

      expect(hasAnthropic).toBe(true);
    });

    it('should return providers with required fields', () => {
      const providers = listProviders();

      providers.forEach((provider) => {
        expect(provider.name).toBeTruthy();
        expect(provider.displayName).toBeTruthy();
        expect(provider.clientId).toBeDefined();
        expect(provider.authorizationEndpoint).toBeTruthy();
        expect(provider.tokenEndpoint).toBeTruthy();
        expect(Array.isArray(provider.scopes)).toBe(true);
        expect(typeof provider.supportsRefresh).toBe('boolean');
      });
    });
  });

  describe('isProviderConfigured', () => {
    it('should return false for unconfigured provider', () => {
      const unconfiguredProvider = {
        ...ANTHROPIC_PROVIDER,
        clientId: 'PLACEHOLDER_CLIENT_ID',
      };

      expect(isProviderConfigured(unconfiguredProvider)).toBe(false);
    });

    it('should return false for empty client ID', () => {
      const emptyProvider = {
        ...ANTHROPIC_PROVIDER,
        clientId: '',
      };

      expect(isProviderConfigured(emptyProvider)).toBe(false);
    });

    it('should return true for configured provider', () => {
      const configuredProvider = {
        ...ANTHROPIC_PROVIDER,
        clientId: 'valid-client-id-123',
      };

      expect(isProviderConfigured(configuredProvider)).toBe(true);
    });

    it('should return false for missing endpoints', () => {
      const invalidProvider = {
        ...ANTHROPIC_PROVIDER,
        clientId: 'valid-client-id',
        authorizationEndpoint: '',
      };

      expect(isProviderConfigured(invalidProvider)).toBe(false);
    });
  });
});
