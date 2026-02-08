# OAuth Authentication with Claude Pro/Max

This guide explains how to use OnboardKit with your **Claude Pro or Claude Max subscription** instead of paying for API credits.

## Important Notes

⚠️ **Anthropic restricts OAuth to official applications**. As of 2026, third-party tools cannot use OAuth directly due to Terms of Service restrictions.

✅ **Solution**: Use the official `claude` CLI to generate subscription tokens that work with OnboardKit.

## Prerequisites

- Active **Claude Pro** or **Claude Max** subscription
- Anthropic's official Claude CLI installed

## Quick Start

### 1. Install Claude CLI

```bash
npm install -g @anthropic-ai/claude-cli
```

Or use npx:
```bash
npx -y @anthropic-ai/claude-cli setup-token
```

### 2. Generate Subscription Token

```bash
claude setup-token
```

This will:
- Open your browser for authentication
- Generate a token tied to your Claude subscription
- Save it to `~/.anthropic/token.txt`

### 3. Configure OnboardKit

**Option A: Use token directly with OnboardKit**
```bash
npx onboardkit auth
# When prompted, paste the token from ~/.anthropic/token.txt
```

**Option B: Use environment variable**
```bash
export ANTHROPIC_API_KEY=$(cat ~/.anthropic/token.txt)
npx onboardkit onboard spec.md
```

### 4. Use OnboardKit

```bash
npx onboardkit onboard spec.md --output ./my-app
```

## Authentication Methods Comparison

| Method | Cost | Setup | Best For |
|--------|------|-------|----------|
| **API Key** | Pay per use | Get from console.anthropic.com | Production, high volume |
| **Subscription Token** | Included with Pro/Max | `claude setup-token` | Personal projects, experimentation |

## How Subscription Tokens Work

1. **Token Generation**: `claude setup-token` creates a Bearer token
2. **Scope**: Tied to your Claude Pro/Max subscription
3. **Usage**: Works like an API key with OnboardKit
4. **Limits**: Subject to your subscription's rate limits
5. **Expiration**: Tokens may expire, regenerate with `claude setup-token`

## Step-by-Step: Using Subscription Token

### Generate Token

```bash
$ claude setup-token
┌  Claude Authentication
│
◇  Opening browser for authentication...
◇  Authorization successful!
◇  Token saved to ~/.anthropic/token.txt
│
└  ✓ Setup complete
```

### View Token

```bash
cat ~/.anthropic/token.txt
```

### Configure OnboardKit

```bash
$ npx onboardkit auth
┌  Anthropic Authentication
│
│  Option 1: API Key (Recommended)
│  Get your API key from:
│  https://console.anthropic.com/settings/keys
│
│  Option 2: Claude Pro/Max Subscription
│  If you have Claude Pro/Max, run:
│  claude setup-token
│  Then use that token as your API key
│
◆  Enter your Anthropic API key or subscription token:
│  [paste token from ~/.anthropic/token.txt]
│
◇  Testing credentials...
◇  Saving credentials...
◇  Successfully configured!
│
└  ✓ Authentication complete
```

### Test It

```bash
$ npx onboardkit auth status
┌  Authentication Status
│
│  ✓ Anthropic API Key
│    Status: Configured
│    Key: eyJhbGc...
│    Source: Config File
│
└  ✓ Status check complete
```

## Using with Environment Variable

For CI/CD or temporary use:

```bash
# One-time setup
claude setup-token

# Export for current session
export ANTHROPIC_API_KEY=$(cat ~/.anthropic/token.txt)

# Use OnboardKit
npx onboardkit onboard spec.md --output ./output
```

## Troubleshooting

### "Invalid API key/token"

**Possible causes:**
1. Token expired - regenerate with `claude setup-token`
2. Subscription lapsed - verify Claude Pro/Max is active
3. Token corrupted - check for extra spaces/newlines

**Solution:**
```bash
# Regenerate token
claude setup-token

# Reconfigure OnboardKit
npx onboardkit auth
```

### "claude: command not found"

**Solution:**
```bash
# Install Claude CLI globally
npm install -g @anthropic-ai/claude-cli

# Or use npx
npx -y @anthropic-ai/claude-cli setup-token
```

### Token expires frequently

**Solution:**
Use API key instead of subscription token for long-running projects:
```bash
# Get API key from console.anthropic.com/settings/keys
npx onboardkit auth
# Enter sk-ant-... API key
```

## Why Doesn't Direct OAuth Work?

**Historical Context:**

OnboardKit was originally designed to use OAuth 2.0 + PKCE for authentication. However:

1. **Anthropic restricts OAuth** to their own applications ([source](https://jpcaparas.medium.com/claude-code-cripples-third-party-coding-agents-from-using-oauth-6548e9b49df3))
2. **No public client registration** - third-party tools can't get OAuth client IDs
3. **Terms of Service** - direct OAuth use violates Anthropic's ToS

**Official Alternative:**

Anthropic provides `claude setup-token` as the official way for subscription users to access the API:
- Complies with ToS
- Works with existing subscriptions
- No additional setup required

## OAuth Code in Codebase

You'll notice OnboardKit has OAuth code in `cli/src/lib/oauth/`. This is:
- **Kept for reference** in case Anthropic opens OAuth registration
- **Not currently functional** for third-party use
- **Historical artifact** from original design

To see OAuth instructions (informational only):
```bash
npx onboardkit auth --oauth
```

## Cost Comparison

### API Key (Pay-as-you-go)
```
Claude Sonnet 3.5:
- Input: $3 per million tokens
- Output: $15 per million tokens

Example project:
- 10 onboarding flows × 50K tokens = $2.50
```

### Claude Pro ($20/month)
```
- Unlimited messages (rate limited)
- Access via subscription token
- Perfect for personal projects
- Use OnboardKit at no extra cost
```

### Claude Max ($200/month)
```
- 5x higher limits than Pro
- Priority access
- Best for heavy development work
```

## Security Best Practices

### ✅ DO

- **Regenerate tokens regularly** (`claude setup-token`)
- **Use environment variables** in shared environments
- **Keep tokens private** - never commit to git
- **Monitor usage** in your Anthropic console

### ❌ DON'T

- **Don't share tokens** between team members
- **Don't commit tokens** to version control
- **Don't use in production** - use API keys instead
- **Don't attempt direct OAuth** - it violates ToS

## Related Resources

- **Claude CLI**: https://github.com/anthropics/claude-cli
- **Anthropic Console**: https://console.anthropic.com
- **Subscription Plans**: https://claude.ai/subscription
- **API Documentation**: https://docs.anthropic.com

## Support

**Issues with token generation:**
- Check Claude Pro/Max subscription status
- Ensure Claude CLI is up to date
- Try browser authentication manually

**Issues with OnboardKit:**
- Verify token with `npx onboardkit auth status`
- Test with `npx onboardkit validate spec.md`
- Report bugs at https://github.com/alifa20/onboarding-kit/issues

---

## Sources

- [Claude Code OAuth Restrictions](https://jpcaparas.medium.com/claude-code-cripples-third-party-coding-agents-from-using-oauth-6548e9b49df3)
- [Anthropic OAuth Discussion](https://github.com/block/goose/issues/3647)
- [Claude CLI Documentation](https://github.com/anthropics/claude-cli)
- [Anthropic Terms of Service](https://console.anthropic.com/terms)

**Need help?** Run `npx onboardkit auth --help` or see [AUTHENTICATION.md](./AUTHENTICATION.md) for standard API key setup.
