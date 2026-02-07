import type { OAuthProvider, OAuthTokens } from '../../lib/oauth/types.js';

/**
 * Mock OAuth provider for testing
 */
export function createMockProvider(): OAuthProvider {
  return {
    id: 'test-provider',
    name: 'Test Provider',
    authUrl: 'https://test.example.com/oauth/authorize',
    tokenUrl: 'https://test.example.com/oauth/token',
    clientId: 'test-client-id',
    redirectUri: 'http://localhost:3000/callback',
    scopes: ['read', 'write'],
  };
}

/**
 * Mock OAuth tokens for testing
 */
export function createMockTokens(overrides?: Partial<OAuthTokens>): OAuthTokens {
  return {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresAt: Date.now() + 3600000, // 1 hour from now
    tokenType: 'Bearer',
    ...overrides,
  };
}

/**
 * Mock expired tokens
 */
export function createExpiredTokens(): OAuthTokens {
  return {
    accessToken: 'mock-expired-token',
    refreshToken: 'mock-refresh-token',
    expiresAt: Date.now() - 1000, // Expired 1 second ago
    tokenType: 'Bearer',
  };
}

/**
 * Mock OAuth callback server response
 */
export function createMockCallbackResponse() {
  return {
    code: 'mock-authorization-code',
    state: 'mock-state-value',
  };
}

/**
 * Mock OAuth authorization URL
 */
export function createMockAuthUrl(provider: OAuthProvider, challenge: string, state: string): string {
  const params = new URLSearchParams({
    client_id: provider.clientId,
    redirect_uri: provider.redirectUri,
    response_type: 'code',
    scope: provider.scopes.join(' '),
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state,
  });

  return `${provider.authUrl}?${params.toString()}`;
}

/**
 * Mock token exchange response
 */
export function createMockTokenResponse(overrides?: Partial<OAuthTokens>): Record<string, unknown> {
  const tokens = createMockTokens(overrides);
  return {
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    expires_in: 3600,
    token_type: tokens.tokenType,
  };
}
