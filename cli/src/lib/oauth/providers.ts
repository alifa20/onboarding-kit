import { OAuthProvider } from './types.js';

/**
 * Anthropic Claude OAuth provider configuration
 * Note: Client ID will be configured via environment or at runtime
 */
export const ANTHROPIC_PROVIDER: OAuthProvider = {
  name: 'anthropic',
  displayName: 'Anthropic Claude',
  clientId: process.env.ANTHROPIC_CLIENT_ID || 'PLACEHOLDER_CLIENT_ID',
  authorizationEndpoint: 'https://api.anthropic.com/oauth/authorize',
  tokenEndpoint: 'https://api.anthropic.com/oauth/token',
  scopes: ['claude:api'],
  supportsRefresh: true,
};

/**
 * Get provider configuration by name
 */
export function getProvider(name: string): OAuthProvider | null {
  switch (name.toLowerCase()) {
    case 'anthropic':
    case 'claude':
      return ANTHROPIC_PROVIDER;
    default:
      return null;
  }
}

/**
 * List all available providers
 */
export function listProviders(): OAuthProvider[] {
  return [ANTHROPIC_PROVIDER];
}

/**
 * Check if provider is configured
 */
export function isProviderConfigured(provider: OAuthProvider): boolean {
  return (
    provider.clientId !== '' &&
    provider.clientId !== 'PLACEHOLDER_CLIENT_ID' &&
    provider.authorizationEndpoint !== '' &&
    provider.tokenEndpoint !== ''
  );
}
