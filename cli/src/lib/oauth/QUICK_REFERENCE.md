# OAuth Module - Quick Reference

## Basic Usage

### Authenticate User

```typescript
import { executeOAuthFlow, getProvider, saveTokens } from './lib/oauth/index.js';

const provider = getProvider('anthropic');
const { tokens, authUrl } = await executeOAuthFlow(provider);
await saveTokens(provider, tokens);
```

### Get Valid Access Token

```typescript
import { getValidAccessToken, getProvider } from './lib/oauth/index.js';

const provider = getProvider('anthropic');
const accessToken = await getValidAccessToken(provider);
// Use accessToken for API calls
// Token is automatically refreshed if needed
```

### Check Authentication Status

```typescript
import { getCredentialStatus, getProvider } from './lib/oauth/index.js';

const provider = getProvider('anthropic');
const status = await getCredentialStatus(provider);

if (status.isAuthenticated && !status.isExpired) {
  // Good to go
}
```

### Revoke Credentials

```typescript
import { revokeTokens } from './lib/oauth/index.js';

await revokeTokens('anthropic');
```

## API Reference

### Core Functions

#### `executeOAuthFlow(provider, port?)`
Execute complete OAuth flow.

**Parameters:**
- `provider: OAuthProvider` - Provider configuration
- `port?: number` - Callback port (default: 3000)

**Returns:** `Promise<{ tokens: OAuthTokens; authUrl: string }>`

**Throws:** `OAuthError`

---

#### `getValidAccessToken(provider)`
Get access token, auto-refresh if needed.

**Parameters:**
- `provider: OAuthProvider` - Provider configuration

**Returns:** `Promise<string>` - Valid access token

**Throws:** `OAuthError | TokenExpiredError`

---

#### `saveTokens(provider, tokens)`
Save tokens securely.

**Parameters:**
- `provider: OAuthProvider` - Provider configuration
- `tokens: OAuthTokens` - Tokens to save

**Returns:** `Promise<void>`

---

#### `revokeTokens(providerName)`
Delete stored credentials.

**Parameters:**
- `providerName: string` - Provider name

**Returns:** `Promise<void>`

---

#### `getCredentialStatus(provider)`
Get authentication status.

**Parameters:**
- `provider: OAuthProvider` - Provider configuration

**Returns:** `Promise<{ isAuthenticated, isExpired, expiresAt?, canRefresh }>`

---

#### `getProvider(name)`
Get provider configuration.

**Parameters:**
- `name: string` - Provider name (case-insensitive)

**Returns:** `OAuthProvider | null`

**Example:**
```typescript
const provider = getProvider('anthropic'); // or 'claude'
```

---

#### `listProviders()`
List all available providers.

**Returns:** `OAuthProvider[]`

## CLI Commands

```bash
# Interactive login
onboardkit auth

# Explicit provider
onboardkit auth login --provider anthropic

# Check status
onboardkit auth status

# Revoke credentials
onboardkit auth revoke
```

## Types

### OAuthTokens
```typescript
interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type: string;
  scope?: string;
}
```

### OAuthProvider
```typescript
interface OAuthProvider {
  name: string;
  displayName: string;
  clientId: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  scopes: string[];
  supportsRefresh: boolean;
}
```

### StoredCredential
```typescript
interface StoredCredential {
  provider: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  createdAt: number;
  updatedAt: number;
}
```

## Error Handling

### OAuthError
Thrown for OAuth-specific errors.

```typescript
try {
  await executeOAuthFlow(provider);
} catch (err) {
  if (err instanceof OAuthError) {
    console.error('OAuth failed:', err.message);
    // Prompt user to try again
  }
}
```

### TokenExpiredError
Thrown when token expired and cannot refresh.

```typescript
try {
  const token = await getValidAccessToken(provider);
} catch (err) {
  if (err instanceof TokenExpiredError) {
    // Prompt user to re-authenticate
    await executeOAuthFlow(provider);
  }
}
```

## Common Patterns

### Check Auth Before API Call

```typescript
const provider = getProvider('anthropic');
const status = await getCredentialStatus(provider);

if (!status.isAuthenticated) {
  // Prompt user to authenticate
  await executeOAuthFlow(provider);
}

// Now use API
const token = await getValidAccessToken(provider);
```

### Handle Refresh Failure

```typescript
try {
  const token = await getValidAccessToken(provider);
  // Use token
} catch (err) {
  if (err instanceof TokenExpiredError) {
    // Re-authenticate
    await revokeTokens(provider.name);
    await executeOAuthFlow(provider);
    // Retry
  }
}
```

### List All Authenticated Providers

```typescript
import { listStoredProviders, getProvider, getCredentialStatus } from './lib/oauth/index.js';

const providers = await listStoredProviders();

for (const name of providers) {
  const provider = getProvider(name);
  const status = await getCredentialStatus(provider);
  console.log(`${name}: ${status.isExpired ? 'Expired' : 'Active'}`);
}
```

## Configuration

### Environment Variables

```bash
# Set client ID
export ANTHROPIC_CLIENT_ID="your-client-id"

# Use in code
const provider = getProvider('anthropic');
// provider.clientId is now your-client-id
```

### Add New Provider

1. Define in `providers.ts`:
```typescript
export const NEW_PROVIDER: OAuthProvider = {
  name: 'new',
  displayName: 'New Provider',
  clientId: process.env.NEW_CLIENT_ID || '',
  authorizationEndpoint: 'https://provider.com/oauth/authorize',
  tokenEndpoint: 'https://provider.com/oauth/token',
  scopes: ['api'],
  supportsRefresh: true,
};
```

2. Update `getProvider()`:
```typescript
case 'new':
  return NEW_PROVIDER;
```

3. Add to `listProviders()`:
```typescript
return [ANTHROPIC_PROVIDER, NEW_PROVIDER];
```

## Storage Locations

### Keychain (Primary)
- macOS: Keychain Access (service: "onboardkit")
- Windows: Credential Manager
- Linux: Secret Service

### File (Fallback)
```
~/.onboardkit/credentials.json
```

Encrypted with AES-256-GCM, machine-specific key.

## Security Notes

- **PKCE**: Prevents code interception
- **State**: Prevents CSRF attacks
- **HTTPS**: All OAuth endpoints
- **Encryption**: AES-256-GCM at rest
- **Refresh Buffer**: 5 minutes before expiration

## Troubleshooting

### "Client ID not configured"
```bash
export ANTHROPIC_CLIENT_ID="your-client-id"
```

### "Port 3000 already in use"
```bash
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
```

### "Token expired and cannot refresh"
```bash
onboardkit auth revoke
onboardkit auth
```

## Testing

### Unit Tests
```bash
npm test -- src/lib/oauth/
```

### Manual Test
```bash
# Build
npm run build

# Test auth
./dist/index.js auth

# Check status
./dist/index.js auth status
```

## Further Reading

- Full docs: `src/lib/oauth/README.md`
- Setup guide: `cli/OAUTH_SETUP.md`
- Implementation notes: `src/lib/oauth/IMPLEMENTATION_NOTES.md`
