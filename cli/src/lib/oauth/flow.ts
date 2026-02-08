import { OAuthProvider, OAuthTokens, PKCEState, OAuthError } from './types.js';
import { generateCodeVerifier, generateCodeChallenge, generateState } from './pkce.js';
import { startCallbackServer, getRedirectUri } from './callback-server.js';

/**
 * Build OAuth authorization URL with PKCE parameters
 */
export function buildAuthorizationUrl(
  provider: OAuthProvider,
  pkceState: PKCEState
): string {
  const params: Record<string, string> = {
    response_type: 'code',
    redirect_uri: pkceState.redirectUri,
    state: pkceState.state,
    code_challenge: pkceState.codeChallenge,
    code_challenge_method: 'S256',
    scope: provider.scopes.join(' '),
  };

  // Only include client_id if provider has one (not required for Anthropic's public OAuth)
  if (provider.clientId) {
    params.client_id = provider.clientId;
  }

  const searchParams = new URLSearchParams(params);
  return `${provider.authorizationEndpoint}?${searchParams.toString()}`;
}

/**
 * Exchange authorization code for access tokens
 */
export async function exchangeCodeForTokens(
  provider: OAuthProvider,
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<OAuthTokens> {
  const params: Record<string, string> = {
    grant_type: 'authorization_code',
    code,
    code_verifier: codeVerifier,
    redirect_uri: redirectUri,
  };

  // Only include client_id if provider has one
  if (provider.clientId) {
    params.client_id = provider.clientId;
  }

  const searchParams = new URLSearchParams(params);

  try {
    const response = await fetch(provider.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: searchParams.toString(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new OAuthError(
        `Token exchange failed: ${errorData.error_description || response.statusText}`,
        errorData.error,
        response.status
      );
    }

    const tokens: OAuthTokens = await response.json();

    // Validate token response
    if (!tokens.access_token) {
      throw new OAuthError('Invalid token response: missing access_token');
    }

    return tokens;
  } catch (err) {
    if (err instanceof OAuthError) {
      throw err;
    }
    throw new OAuthError(`Token exchange error: ${err}`);
  }
}

/**
 * Refresh an expired access token using refresh token
 */
export async function refreshAccessToken(
  provider: OAuthProvider,
  refreshToken: string
): Promise<OAuthTokens> {
  if (!provider.supportsRefresh) {
    throw new OAuthError(`Provider ${provider.name} does not support token refresh`);
  }

  const params: Record<string, string> = {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  };

  // Only include client_id if provider has one
  if (provider.clientId) {
    params.client_id = provider.clientId;
  }

  const searchParams = new URLSearchParams(params);

  try {
    const response = await fetch(provider.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: searchParams.toString(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new OAuthError(
        `Token refresh failed: ${errorData.error_description || response.statusText}`,
        errorData.error,
        response.status
      );
    }

    const tokens: OAuthTokens = await response.json();

    if (!tokens.access_token) {
      throw new OAuthError('Invalid token response: missing access_token');
    }

    return tokens;
  } catch (err) {
    if (err instanceof OAuthError) {
      throw err;
    }
    throw new OAuthError(`Token refresh error: ${err}`);
  }
}

/**
 * Execute complete OAuth 2.0 + PKCE flow
 *
 * 1. Generate PKCE parameters
 * 2. Start localhost callback server
 * 3. Build and return authorization URL
 * 4. Wait for callback with authorization code
 * 5. Exchange code for tokens
 *
 * @param provider - OAuth provider configuration
 * @param port - Callback server port (default: 3000)
 * @returns Promise that resolves with access and refresh tokens
 */
export async function executeOAuthFlow(
  provider: OAuthProvider,
  port: number = 3000
): Promise<{ tokens: OAuthTokens; authUrl: string }> {
  // Step 1: Generate PKCE parameters
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const state = generateState();
  const redirectUri = getRedirectUri(port);

  const pkceState: PKCEState = {
    codeVerifier,
    codeChallenge,
    state,
    redirectUri,
  };

  // Step 2: Build authorization URL
  const authUrl = buildAuthorizationUrl(provider, pkceState);

  // Step 3: Start callback server (this will wait for redirect)
  // We return authUrl so caller can open browser before awaiting callback
  const callbackPromise = startCallbackServer(port);

  // Return authUrl immediately so browser can be opened
  // Token exchange will happen after callback is received
  const callback = await callbackPromise;

  // Step 4: Verify state matches (CSRF protection)
  if (callback.state !== state) {
    throw new OAuthError('State mismatch - possible CSRF attack');
  }

  // Step 5: Exchange authorization code for tokens
  const tokens = await exchangeCodeForTokens(
    provider,
    callback.code,
    codeVerifier,
    redirectUri
  );

  return { tokens, authUrl };
}
