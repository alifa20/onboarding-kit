import { OAuthProvider } from './types.js';

/**
 * Anthropic Claude provider configuration
 *
 * IMPORTANT: Anthropic's OAuth is designed for their own applications.
 * For third-party CLI tools, use API key authentication instead.
 *
 * To use this tool:
 * 1. Get your API key from https://console.anthropic.com/settings/keys
 * 2. Set environment variable: export ANTHROPIC_API_KEY=your-key-here
 * 3. Or use --api-key flag when running commands
 *
 * OAuth configuration below is kept for reference but may not work
 * for third-party applications without proper client registration.
 */
export const ANTHROPIC_PROVIDER: OAuthProvider = {
  name: 'anthropic',
  displayName: 'Anthropic Claude',
  clientId: process.env.ANTHROPIC_CLIENT_ID || '',
  authorizationEndpoint: 'https://claude.ai/oauth/authorize',
  tokenEndpoint: 'https://claude.ai/oauth/token',
  scopes: ['user:inference', 'user:profile'],
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
  // For Anthropic's public OAuth flow, client_id is not required
  // Only check that endpoints are configured
  return (
    provider.authorizationEndpoint !== '' &&
    provider.tokenEndpoint !== ''
  );
}
