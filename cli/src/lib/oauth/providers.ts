import { OAuthProvider } from './types.js';

/**
 * Anthropic Claude OAuth provider configuration
 *
 * Uses claude.ai OAuth with PKCE for Claude Pro/Max subscription access.
 * This authenticates with claude.ai (not console.anthropic.com) and
 * provides tokens that work with the Claude Code API endpoint.
 *
 * Flow:
 * 1. User authenticates via browser to claude.ai
 * 2. OAuth callback returns code#state
 * 3. Exchange code for access token
 * 4. Use token with api.githubcopilot.com endpoint
 *
 * No client_id required - uses public OAuth flow with PKCE
 */
export const ANTHROPIC_PROVIDER: OAuthProvider = {
  name: 'anthropic',
  displayName: 'Anthropic Claude',
  clientId: '', // Public OAuth - no client_id needed
  authorizationEndpoint: 'https://claude.ai/oauth/authorize',
  tokenEndpoint: 'https://claude.ai/oauth/token',
  scopes: [], // No scopes needed for public flow
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
