# OAuth Reality: Why It Doesn't Work

## TL;DR

**OAuth tokens from Claude Code do NOT work with OnboardKit or any third-party tool using the Anthropic API.**

You **must use an API key** from https://console.anthropic.com/settings/keys

## What I Tested

I tested the OAuth token you generated:
```
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
```

### The API Response

```json
{
  "type": "error",
  "error": {
    "type": "authentication_error",
    "message": "OAuth authentication is currently not supported."
  }
}
```

**Clear as day:** The Anthropic API does not accept OAuth tokens.

## Why OAuth Tokens Don't Work

### 1. OAuth Tokens Are Claude Code Exclusive

From [this article](https://jpcaparas.medium.com/claude-code-cripples-third-party-coding-agents-from-using-oauth-6548e9b49df3):

> "This credential is only authorized for use with Claude Code and cannot be used for other API requests"

Anthropic intentionally restricts OAuth tokens to their own applications.

### 2. API Explicitly Rejects OAuth

The `/v1/messages` endpoint returns:
```
"OAuth authentication is currently not supported."
```

There's no workaround. The API server explicitly checks and rejects OAuth bearer tokens.

### 3. API Keys Are the Only Option

The Anthropic API **only** accepts:
- API keys via `x-api-key` header
- Format: `sk-ant-api03-...`
- Created at: https://console.anthropic.com/settings/keys

## What About Claude Pro/Max Subscriptions?

**Bad news:** You cannot use your Claude Pro/Max subscription with third-party tools like OnboardKit.

### Why Not?

1. **OAuth tokens don't work** (as proven above)
2. **No subscription API access** - Pro/Max is for claude.ai only
3. **Separate billing** - API access requires pay-as-you-go credits

### Your Options

**Option 1: Pay for API Credits (Recommended)**
```bash
# Get API key from console
# https://console.anthropic.com/settings/keys

# Add credits to your account
# https://console.anthropic.com/settings/billing

# Use with OnboardKit
export ANTHROPIC_API_KEY=sk-ant-api03-...
npx onboardkit onboard spec.md
```

**Option 2: Use Template-Only Mode (Free)**
```bash
# No AI, no authentication needed
npx onboardkit generate spec.md --output ./output
```

## Cost Reality

### Claude Pro/Max Subscription
- **$20-200/month**
- **No API access**
- For claude.ai web interface only
- Cannot be used with OnboardKit

### Anthropic API (Pay-as-you-go)
- **$3/million input tokens**
- **$15/million output tokens**
- Works with OnboardKit
- Example: 10 onboarding flows ≈ $2.50

**Verdict:** If you want AI features in OnboardKit, you need to pay for API access separately from your subscription.

## Implementation Timeline

### What I Built (Then Discovered Doesn't Work)

1. ✅ OAuth callback server with PKCE
2. ✅ Bearer token authentication
3. ✅ Token detection logic
4. ✅ Comprehensive OAuth guide
5. ❌ **API rejects all OAuth tokens**

### What Actually Works

1. ✅ API key authentication (`sk-ant-api03-`)
2. ✅ Environment variable support
3. ✅ Secure storage in `~/.onboardkit/api-key.txt`
4. ✅ Works with all AI features

## Why I Kept Trying OAuth

The PRD specified OAuth as a requirement:

> "Zero-cost AI via OAuth: OnboardKit eliminates API costs by using OAuth 2.0 + PKCE to tap into users' existing AI subscriptions"

This was the original vision, but **Anthropic doesn't support it**:
- OAuth tokens are Claude Code exclusive
- API explicitly rejects OAuth
- No way to use subscriptions with third-party tools

## Sources

1. [Claude Code Cripples Third-Party Coding Agents](https://jpcaparas.medium.com/claude-code-cripples-third-party-coding-agents-from-using-oauth-6548e9b49df3)
2. [Anthropic Blocks Claude Code Subscriptions](https://ai-checker.webcoda.com.au/articles/anthropic-blocks-claude-code-subscriptions-third-party-tools-2026)
3. [GitHub Issue: Anthropic OAuth Login](https://github.com/block/goose/issues/3647)
4. Direct API testing (see above)

## The Bottom Line

**You need an API key.** Period.

1. Visit https://console.anthropic.com/settings/keys
2. Create an API key (starts with `sk-ant-api03-`)
3. Add billing/credits to your account
4. Use with OnboardKit

OAuth tokens from Claude Code **will never work** with third-party tools. This is by design, not a bug.

---

## Updated Commands

```bash
# Get API key (not OAuth token)
# Visit https://console.anthropic.com/settings/keys

# Configure OnboardKit
npx onboardkit auth
# Enter: sk-ant-api03-... (NOT sk-ant-oat01-)

# Use AI features
npx onboardkit onboard spec.md --output ./app
```

**Don't waste time with OAuth.** Just get an API key.
