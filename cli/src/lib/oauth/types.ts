/**
 * OAuth 2.0 tokens returned from authorization server
 */
export interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type: string;
  scope?: string;
}

/**
 * OAuth provider configuration
 */
export interface OAuthProvider {
  name: string;
  displayName: string;
  clientId: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  scopes: string[];
  supportsRefresh: boolean;
}

/**
 * Stored credential with metadata
 */
export interface StoredCredential {
  provider: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * PKCE flow state
 */
export interface PKCEState {
  codeVerifier: string;
  codeChallenge: string;
  state: string;
  redirectUri: string;
}

/**
 * OAuth error types
 */
export class OAuthError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'OAuthError';
  }
}

export class TokenExpiredError extends Error {
  constructor(message = 'Access token has expired') {
    super(message);
    this.name = 'TokenExpiredError';
  }
}
