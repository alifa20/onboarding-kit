/**
 * OAuth 2.0 + PKCE authentication module
 *
 * Provides complete OAuth flow implementation with:
 * - PKCE (Proof Key for Code Exchange) support
 * - Localhost callback server
 * - Token management with auto-refresh
 * - Secure credential storage (OS keychain + encrypted file fallback)
 */

// Types
export {
  OAuthTokens,
  OAuthProvider,
  StoredCredential,
  PKCEState,
  OAuthError,
  TokenExpiredError,
} from './types.js';

// Providers
export { ANTHROPIC_PROVIDER, getProvider, listProviders, isProviderConfigured } from './providers.js';

// PKCE utilities
export { generateCodeVerifier, generateCodeChallenge, generateState } from './pkce.js';

// OAuth flow
export {
  buildAuthorizationUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  executeOAuthFlow,
} from './flow.js';

// Callback server
export { startCallbackServer, getRedirectUri } from './callback-server.js';

// Storage
export {
  saveCredential,
  getCredential,
  deleteCredential,
  saveStoredCredential,
  getStoredCredential,
  deleteStoredCredential,
  hasCredentials,
  isKeychainAvailable,
  listStoredProviders,
} from './storage.js';

// Token management
export {
  getValidAccessToken,
  saveTokens,
  loadTokens,
  revokeTokens,
  getCredentialStatus,
  isTokenExpired,
  calculateExpiresAt,
} from './token-manager.js';
