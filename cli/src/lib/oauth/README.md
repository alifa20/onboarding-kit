# OAuth 2.0 + PKCE Implementation

This module implements OAuth 2.0 authorization with PKCE (Proof Key for Code Exchange) for secure authentication with AI providers.

## Features

- **RFC-compliant**: Implements OAuth 2.0 (RFC 6749) and PKCE (RFC 7636)
- **Secure**: PKCE prevents authorization code interception attacks
- **Cross-platform**: Works on macOS, Linux, and Windows
- **Credential Storage**: OS keychain (primary) with encrypted file fallback
- **Token Management**: Automatic refresh before expiration
- **User-friendly**: Interactive CLI with browser-based authorization

## Architecture

### Flow Components

1. **PKCE Generation** (`pkce.ts`)
   - Code verifier (128 random characters)
   - Code challenge (SHA256 of verifier, Base64-URL encoded)
   - State parameter (CSRF protection)

2. **Callback Server** (`callback-server.ts`)
   - Localhost HTTP server on port 3000
   - Handles OAuth redirect with authorization code
   - Beautiful success/error pages
   - 2-minute timeout

3. **OAuth Flow** (`flow.ts`)
   - Build authorization URL with PKCE parameters
   - Exchange authorization code for tokens
   - Refresh expired access tokens

4. **Credential Storage** (`storage.ts`)
   - Primary: OS keychain (macOS Keychain, Windows Credential Manager, Linux Secret Service)
   - Fallback: AES-256-GCM encrypted JSON file at `~/.onboardkit/credentials.json`
   - File permissions: 600 (owner read/write only)

5. **Token Management** (`token-manager.ts`)
   - Check token expiration (with 5-minute buffer)
   - Auto-refresh before API calls
   - Handle refresh failures

### Providers

Currently supported:
- **Anthropic Claude** (`providers.ts`)
  - OAuth endpoints
  - Client ID configuration
  - Scope: `claude:api`
  - Supports refresh tokens

## Usage

### Basic Authentication Flow

```typescript
import { executeOAuthFlow, getProvider, saveTokens } from './lib/oauth/index.js';

// Get provider configuration
const provider = getProvider('anthropic');

// Execute OAuth flow (opens browser, waits for callback)
const { tokens, authUrl } = await executeOAuthFlow(provider);

// Save tokens securely
await saveTokens(provider, tokens);
```

### Getting Valid Access Token

```typescript
import { getValidAccessToken, getProvider } from './lib/oauth/index.js';

const provider = getProvider('anthropic');

// Automatically refreshes if expired
const accessToken = await getValidAccessToken(provider);
```

### Check Authentication Status

```typescript
import { getCredentialStatus, getProvider } from './lib/oauth/index.js';

const provider = getProvider('anthropic');
const status = await getCredentialStatus(provider);

console.log(status.isAuthenticated); // true/false
console.log(status.isExpired);       // true/false
console.log(status.canRefresh);      // true/false
```

### Revoke Credentials

```typescript
import { revokeTokens } from './lib/oauth/index.js';

await revokeTokens('anthropic');
```

## CLI Commands

### Authenticate

```bash
# Interactive provider selection
onboardkit auth

# Specific provider
onboardkit auth login --provider anthropic
```

### Check Status

```bash
onboardkit auth status
```

### Revoke Credentials

```bash
onboardkit auth revoke
```

## Security Considerations

### PKCE (Proof Key for Code Exchange)

PKCE prevents authorization code interception attacks by:
1. Generating a random code verifier
2. Creating a code challenge (SHA256 hash)
3. Sending challenge in authorization request
4. Sending verifier in token exchange
5. Server validates verifier matches challenge

### Credential Storage Security

1. **OS Keychain (Primary)**
   - macOS: Keychain Access
   - Windows: Credential Manager
   - Linux: Secret Service (libsecret)
   - System-level encryption
   - Requires user authentication

2. **Encrypted File (Fallback)**
   - AES-256-GCM encryption
   - Key derived from machine ID (hostname + username)
   - Includes authentication tag (prevents tampering)
   - File permissions: 600 (owner only)
   - Location: `~/.onboardkit/credentials.json`

### Token Security

- Access tokens stored encrypted (never in plaintext)
- Refresh tokens protected with same encryption
- Automatic token refresh reduces exposure time
- 5-minute buffer before expiration
- Failed refresh deletes invalid credentials

### Network Security

- All OAuth endpoints use HTTPS
- Certificate validation enabled
- State parameter prevents CSRF attacks
- Callback server only accepts localhost connections
- 2-minute timeout prevents indefinite waiting

## Error Handling

### OAuthError

Thrown for OAuth-specific errors:
- Invalid authorization
- Token exchange failures
- State mismatch (CSRF attempt)
- Network errors

### TokenExpiredError

Thrown when token is expired and cannot be refreshed:
- No refresh token available
- Refresh request fails
- Prompts user to re-authenticate

## Configuration

### Environment Variables

```bash
# Anthropic Client ID (required for OAuth)
export ANTHROPIC_CLIENT_ID="your-client-id-here"
```

### Provider Configuration

See `providers.ts` for adding new providers:

```typescript
export const NEW_PROVIDER: OAuthProvider = {
  name: 'provider-name',
  displayName: 'Provider Display Name',
  clientId: process.env.PROVIDER_CLIENT_ID || '',
  authorizationEndpoint: 'https://provider.com/oauth/authorize',
  tokenEndpoint: 'https://provider.com/oauth/token',
  scopes: ['scope1', 'scope2'],
  supportsRefresh: true,
};
```

## Testing

Unit tests cover:
- PKCE generation and validation
- Token expiration logic
- Credential encryption/decryption
- Provider configuration

Run tests:
```bash
npm test -- src/lib/oauth/
```

## Future Enhancements

- Google Gemini OAuth support
- GitHub Models (Device Flow)
- Ollama (local, no auth)
- Token revocation endpoints
- Multiple credential profiles
- Credential export/import
