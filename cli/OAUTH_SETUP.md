# OAuth Setup Guide

This guide explains how to set up and use OAuth authentication with OnboardKit CLI.

## Prerequisites

1. **Node.js >= 22**
   ```bash
   node --version  # Should be 22.0.0 or higher
   ```

2. **Anthropic Claude Account** (for MVP)
   - You need an Anthropic account with API access
   - OAuth client ID will be provided once Anthropic approves our application

## Installation

```bash
# Install globally
npm install -g onboardkit

# Or use with npx
npx onboardkit --version
```

## First-Time Setup

### Step 1: Authenticate

Run the authentication command:

```bash
onboardkit auth
```

This will:
1. Start a local callback server on `http://localhost:3000`
2. Open your browser to Anthropic's authorization page
3. Wait for you to approve the authorization
4. Exchange the authorization code for tokens
5. Save tokens securely to your OS keychain (or encrypted file)

**What you'll see:**
```
┌  OAuth Authentication
│
◇  Using Anthropic Claude
◆  Starting OAuth flow...
│
◇  Callback server started
◇  Opening browser for authorization...
◇  If browser doesn't open, visit:
│  https://api.anthropic.com/oauth/authorize?client_id=...
│
◇  Browser opened
◆  Waiting for authorization...
│
◇  Credentials saved
◇  Successfully authenticated with Anthropic Claude!
◇  Access token expires in 24 hours
│
└  Authentication complete ✓
```

### Step 2: Verify Authentication

Check your authentication status:

```bash
onboardkit auth status
```

**Example output:**
```
┌  Authentication Status
│
◇  ✓ Anthropic Claude
│    Status: Active
│    Expires: 23 hours
│    Refresh: Available
│
└  Status check complete
```

## Using Authentication

Once authenticated, OnboardKit will automatically:

1. **Use your credentials** for AI operations
2. **Refresh tokens** before they expire (5-minute buffer)
3. **Handle expiration** by prompting re-authentication if refresh fails

You don't need to manually manage tokens. The CLI handles everything.

## Credential Storage

### Primary: OS Keychain

OnboardKit uses your operating system's secure credential storage:

- **macOS**: Keychain Access
- **Windows**: Credential Manager
- **Linux**: Secret Service (libsecret)

View in macOS Keychain:
1. Open "Keychain Access" app
2. Search for "onboardkit"
3. You'll see stored credentials

### Fallback: Encrypted File

If OS keychain is unavailable, credentials are stored in:

```
~/.onboardkit/credentials.json
```

This file:
- Uses AES-256-GCM encryption
- Has 600 permissions (owner read/write only)
- Includes authentication tag (prevents tampering)
- Key derived from your machine ID

## Managing Credentials

### Check Status

```bash
onboardkit auth status
```

Shows:
- Provider name
- Authentication status (Active/Expired)
- Token expiration time
- Refresh token availability

### Re-authenticate

If your token expires or authentication fails:

```bash
onboardkit auth
```

This will restart the OAuth flow.

### Revoke Credentials

To remove stored credentials:

```bash
onboardkit auth revoke
```

This will:
1. Ask for confirmation
2. Remove from OS keychain
3. Remove from encrypted file
4. Require re-authentication for next use

## Troubleshooting

### Browser Doesn't Open

**Problem**: Browser doesn't open automatically during OAuth flow.

**Solution**: Manually copy the URL shown in terminal and paste it into your browser.

```bash
# You'll see this:
If browser doesn't open, visit:
https://api.anthropic.com/oauth/authorize?client_id=...
```

### Callback Server Error

**Problem**: Port 3000 already in use.

**Solution**: Free up port 3000 or kill the process using it:

```bash
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Keychain Access Denied (macOS)

**Problem**: macOS prompts for password every time.

**Solution**: Allow OnboardKit permanent access to keychain:
1. Open Keychain Access
2. Find "onboardkit" entry
3. Double-click → Access Control
4. Add Terminal.app or your terminal emulator to "Always allow access"

### Token Expired

**Problem**: "Access token has expired" error.

**Solution**: CLI automatically refreshes tokens. If refresh fails:

```bash
onboardkit auth revoke
onboardkit auth
```

### Network Errors

**Problem**: Cannot reach OAuth endpoints.

**Solution**: Check:
1. Internet connection
2. Firewall settings (allow outbound HTTPS)
3. Corporate proxy settings (may block OAuth)

### State Mismatch Error

**Problem**: "State mismatch - possible CSRF attack"

**Solution**: This indicates:
1. Someone may be tampering with OAuth flow (security feature)
2. Or browser/network issue

Try again:
```bash
onboardkit auth
```

If persists, report as a bug.

## Security Best Practices

### Do NOT

❌ Share your `~/.onboardkit/credentials.json` file
❌ Commit credentials to version control
❌ Copy tokens to other machines
❌ Disable keychain security prompts

### Do

✅ Use OS keychain when possible
✅ Keep credentials on your development machine only
✅ Revoke credentials if machine is compromised
✅ Re-authenticate periodically for security

## Provider-Specific Notes

### Anthropic Claude

- **Scopes**: `claude:api`
- **Token Lifetime**: ~24 hours
- **Refresh Support**: Yes
- **Client ID**: Will be configured once OAuth app is approved

### Future Providers

Coming in post-MVP:
- Google Gemini (OAuth 2.0)
- GitHub Models (Device Flow)
- Ollama (local, no auth required)

## Environment Variables

For development or custom deployments:

```bash
# Anthropic OAuth Client ID
export ANTHROPIC_CLIENT_ID="your-client-id"

# Use these before running CLI
onboardkit auth
```

## Common Workflows

### Daily Usage

```bash
# Just use the CLI - authentication is automatic
onboardkit onboard
```

If token expired, you'll be prompted to re-authenticate.

### Multiple Machines

Each machine needs separate authentication:

```bash
# Machine 1
onboardkit auth

# Machine 2
onboardkit auth
```

Don't copy credentials between machines.

### CI/CD Environments

OAuth is for interactive use. For CI/CD, use API keys (coming in future release):

```bash
# Future feature
export ANTHROPIC_API_KEY="sk-..."
onboardkit generate --api-key
```

## Support

### Getting Help

```bash
onboardkit auth --help
onboardkit auth status --help
onboardkit auth revoke --help
```

### Reporting Issues

If authentication fails:

1. Run with verbose mode: `onboardkit auth --verbose`
2. Check status: `onboardkit auth status`
3. Check logs in `~/.onboardkit/`
4. Report issue with sanitized logs (remove tokens!)

## Further Reading

- [OAuth 2.0 RFC 6749](https://tools.ietf.org/html/rfc6749)
- [PKCE RFC 7636](https://tools.ietf.org/html/rfc7636)
- [OAuth Best Practices](https://tools.ietf.org/html/draft-ietf-oauth-security-topics)
