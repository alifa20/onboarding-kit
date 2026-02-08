# Authentication Guide

OnboardKit uses **API key authentication** with Anthropic Claude for AI features.

## Quick Start

### 1. Get Your API Key

Visit [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys) and create a new API key.

### 2. Configure OnboardKit

```bash
npx onboardkit auth
```

Follow the prompts to enter your API key. The tool will:
- Validate the key format (should start with `sk-ant-`)
- Test the key with Anthropic's API
- Save it to `~/.onboardkit/api-key.txt`

### 3. Start Using AI Features

```bash
npx onboardkit onboard spec.md --output ./my-app
```

## Authentication Methods

OnboardKit supports two ways to provide your API key:

### Method 1: Stored API Key (Recommended)

Run `npx onboardkit auth` once to save your key:

```bash
$ npx onboardkit auth
┌  Anthropic API Key Setup
│
│  Get your API key from:
│  https://console.anthropic.com/settings/keys
│
◆  Enter your Anthropic API key:
│  sk-ant-...
│
◇  Testing API key...
◇  Saving API key...
◇  Successfully configured Anthropic API key!
│
│  Your API key is saved to:
│  ~/.onboardkit/api-key.txt
│
└  ✓ Authentication complete
```

### Method 2: Environment Variable

Set the `ANTHROPIC_API_KEY` environment variable:

```bash
export ANTHROPIC_API_KEY=sk-ant-your-key-here
npx onboardkit onboard spec.md
```

**Priority:** Environment variable takes precedence over stored key.

## Managing Your API Key

### Check Status

```bash
$ npx onboardkit auth status
┌  Authentication Status
│
│  ✓ Anthropic API Key
│    Status: Configured
│    Key: sk-ant-api03-abc...
│    Source: Config File
│
└  ✓ Status check complete
```

### Replace Existing Key

```bash
$ npx onboardkit auth
┌  Anthropic API Key Setup
│
◆  API key already configured. Do you want to replace it?
│  ● Yes / ○ No
│
◆  Enter your Anthropic API key:
│  [new key]
```

### Remove Stored Key

```bash
$ npx onboardkit auth revoke
┌  Remove API Key
│
◆  Are you sure you want to remove your stored API key?
│  ● Yes / ○ No
│
◇  Removing API key...
◇  API key removed
│
└  ✓ Removal complete
```

## Security Best Practices

### ✅ DO

- **Keep your API key secret** - never commit it to git
- **Use environment variables** in CI/CD pipelines
- **Store keys securely** - OnboardKit uses `~/.onboardkit/api-key.txt` with user-only permissions
- **Rotate keys regularly** - create new keys periodically
- **Use separate keys** for different environments (dev, production)

### ❌ DON'T

- **Don't commit keys** to version control
- **Don't share keys** with others
- **Don't hardcode keys** in your code
- **Don't expose keys** in logs or error messages

## Storage Location

Your API key is stored at:
```
~/.onboardkit/api-key.txt
```

This file is:
- Created with user-only permissions (`chmod 600`)
- Plain text (single line containing your key)
- Read by OnboardKit when no environment variable is set

To manually edit:
```bash
nano ~/.onboardkit/api-key.txt
```

## Troubleshooting

### "No API key found"

**Error:**
```
✗ Auth Check - No API key found. Run "onboardkit auth" first.
```

**Solution:**
1. Run `npx onboardkit auth` to configure your key
2. Or set `ANTHROPIC_API_KEY` environment variable

### "Invalid API key format"

**Error:**
```
Invalid API key format. Should start with "sk-ant-"
```

**Solution:**
- Verify you copied the complete key from console.anthropic.com
- Anthropic API keys always start with `sk-ant-`
- Check for extra spaces or newlines

### "Invalid API key"

**Error:**
```
Invalid API key. Please check your key and try again.
```

**Solution:**
1. Verify the key is active in console.anthropic.com
2. Check you didn't accidentally use a revoked key
3. Create a new API key if needed

### "Could not load API key"

**Error:**
```
Could not load API key. Run "onboardkit auth" to reconfigure.
```

**Solution:**
1. Check file exists: `ls ~/.onboardkit/api-key.txt`
2. Check file permissions: `ls -l ~/.onboardkit/api-key.txt`
3. Re-run `npx onboardkit auth` to recreate

## API Key vs OAuth

**Why API keys instead of OAuth?**

OnboardKit originally planned to use OAuth 2.0 + PKCE for authentication, but:

1. **Anthropic's OAuth is for internal use** - requires client registration not available to third-party tools
2. **API keys are simpler** - no browser redirects, callback servers, or token refresh
3. **API keys are standard** - all Anthropic API users already have them
4. **Same capabilities** - API keys provide full API access just like OAuth

OAuth code is kept in `lib/oauth/` for reference and potential future use if Anthropic opens OAuth registration.

## Related Commands

```bash
# Setup
npx onboardkit auth              # Configure API key
npx onboardkit auth status       # Check configuration
npx onboardkit auth revoke       # Remove stored key

# Usage
npx onboardkit generate spec.md  # Template-only (no auth needed)
npx onboardkit onboard spec.md   # AI-enhanced (requires auth)
npx onboardkit validate spec.md  # Validate only (requires auth)
```

## Support

- **Anthropic API Docs:** https://docs.anthropic.com
- **Console:** https://console.anthropic.com
- **OnboardKit Issues:** https://github.com/alifa20/onboarding-kit/issues

---

**Need help?** Run `npx onboardkit --help` for all available commands.
