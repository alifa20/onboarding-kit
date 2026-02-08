import {
  OAuthProvider,
  OAuthTokens,
  StoredCredential,
  TokenExpiredError,
  OAuthError,
} from './types.js';
import { refreshAccessToken } from './flow.js';
import {
  getStoredCredential,
  saveStoredCredential,
  deleteStoredCredential,
} from './storage.js';

/**
 * Check if access token is expired or will expire soon
 * @param expiresAt - Unix timestamp in milliseconds
 * @param bufferSeconds - Safety buffer in seconds (default: 300 = 5 minutes)
 */
export function isTokenExpired(expiresAt?: number, bufferSeconds: number = 300): boolean {
  if (!expiresAt) {
    return false; // If no expiration, assume valid
  }

  const now = Date.now();
  const bufferMs = bufferSeconds * 1000;

  return now >= expiresAt - bufferMs;
}

/**
 * Calculate expiration timestamp from expires_in seconds
 */
export function calculateExpiresAt(expiresIn?: number): number | undefined {
  if (!expiresIn) {
    return undefined;
  }

  return Date.now() + expiresIn * 1000;
}

/**
 * Get valid access token, refreshing if necessary
 */
export async function getValidAccessToken(
  provider: OAuthProvider
): Promise<string> {
  const credential = await getStoredCredential(provider.name);

  if (!credential) {
    throw new OAuthError(`No credentials found for ${provider.displayName}`);
  }

  // Check if token is expired or will expire soon
  if (isTokenExpired(credential.expiresAt)) {
    // Token expired, try to refresh
    if (!credential.refreshToken) {
      throw new TokenExpiredError(
        `Access token expired and no refresh token available for ${provider.displayName}`
      );
    }

    try {
      const newTokens = await refreshAccessToken(provider, credential.refreshToken);

      // Update stored credential with new tokens
      const updatedCredential: StoredCredential = {
        ...credential,
        accessToken: newTokens.access_token,
        refreshToken: newTokens.refresh_token || credential.refreshToken,
        expiresAt: calculateExpiresAt(newTokens.expires_in),
        updatedAt: Date.now(),
      };

      await saveStoredCredential(provider.name, updatedCredential);

      return newTokens.access_token;
    } catch (err) {
      // Refresh failed, delete invalid credentials
      await deleteStoredCredential(provider.name);

      throw new OAuthError(
        `Failed to refresh token for ${provider.displayName}: ${err}. Please re-authenticate.`
      );
    }
  }

  return credential.accessToken;
}

/**
 * Save tokens after successful authentication
 */
export async function saveTokens(
  provider: OAuthProvider,
  tokens: OAuthTokens
): Promise<void> {
  const credential: StoredCredential = {
    provider: provider.name,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: calculateExpiresAt(tokens.expires_in),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await saveStoredCredential(provider.name, credential);
}

/**
 * Load tokens for a provider
 * Returns null if not authenticated
 */
export async function loadTokens(
  provider: OAuthProvider
): Promise<OAuthTokens | null> {
  const credential = await getStoredCredential(provider.name);

  if (!credential) {
    return null;
  }

  return {
    access_token: credential.accessToken,
    refresh_token: credential.refreshToken,
    expires_in: credential.expiresAt
      ? Math.floor((credential.expiresAt - Date.now()) / 1000)
      : undefined,
    token_type: 'Bearer',
  };
}

/**
 * Revoke stored tokens
 */
export async function revokeTokens(providerName: string): Promise<void> {
  await deleteStoredCredential(providerName);
}

/**
 * Get credential status for a provider
 */
export async function getCredentialStatus(
  provider: OAuthProvider
): Promise<{
  isAuthenticated: boolean;
  isExpired: boolean;
  expiresAt?: number;
  canRefresh: boolean;
}> {
  const credential = await getStoredCredential(provider.name);

  if (!credential) {
    return {
      isAuthenticated: false,
      isExpired: false,
      canRefresh: false,
    };
  }

  const expired = isTokenExpired(credential.expiresAt, 0); // No buffer for status check

  return {
    isAuthenticated: true,
    isExpired: expired,
    expiresAt: credential.expiresAt,
    canRefresh: !!credential.refreshToken,
  };
}
