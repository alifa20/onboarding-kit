# Anthropic API Key Setup

OnboardKit uses **Anthropic API keys** for AI-powered features like spec validation, enhancement, and generation.

## Quick Start

### Step 1: Get Your API Key

1. Visit [console.anthropic.com](https://console.anthropic.com)
2. Sign in or create an account
3. Navigate to **Settings** → **API Keys**
4. Click **Create Key**
5. Copy the key (starts with `sk-ant-api03-...`)

### Step 2: Authenticate OnboardKit

```bash
npx onboardkit auth
```

When prompted, paste your API key:
```
? Enter your Anthropic API key: sk-ant-api03-xxxxxxxxxxxxx...
```

OnboardKit will:
1. Validate the key with Anthropic's API
2. Save it securely to your OS keychain
3. Confirm successful authentication

### Step 3: Use OnboardKit

```bash
npx onboardkit onboard spec.md --output ./my-app
```

All AI features will use your API key for Claude API access.

---

## Pricing

Anthropic charges per token for API usage:

- **Claude 3.5 Sonnet**: $3 per million input tokens, $15 per million output tokens
- **Typical OnboardKit usage**: $0.10 - $0.50 per generation (varies by spec complexity)

**Cost estimate for a typical onboarding flow generation:**
- Input: ~5,000 tokens (spec + prompts) = $0.015
- Output: ~2,000 tokens (generated suggestions) = $0.030
- **Total: ~$0.045 per generation**

For pricing details: https://www.anthropic.com/pricing

---

## Managing Your API Key

### Check Authentication Status

```bash
npx onboardkit auth status
```

Shows:
- Authentication status
- API key preview (first 20 characters)
- Storage location

### Revoke/Remove Key

```bash
npx onboardkit auth revoke
```

Removes the stored API key from your OS keychain.

### Update API Key

```bash
npx onboardkit auth
```

Re-running auth will prompt to re-authenticate with a new key.

---

## Security Best Practices

1. **Never commit API keys to git**
   - OnboardKit stores keys in OS keychain, not project files
   - Add `.env` to `.gitignore` if storing keys there

2. **Rotate keys regularly**
   - Create new keys periodically at console.anthropic.com
   - Revoke old keys after updating

3. **Set usage limits**
   - Configure spending limits in Anthropic Console
   - Set up billing alerts

4. **Use separate keys for different projects**
   - Create project-specific keys for better tracking
   - Easier to revoke if compromised

---

## Troubleshooting

### "Invalid API key format"

**Problem:** Key doesn't start with `sk-ant-api`

**Solution:** 
- Make sure you copied the entire key from console.anthropic.com
- Keys should start with `sk-ant-api03-` (or similar)
- Don't use OAuth tokens (`sk-ant-oat01-`) - those won't work

### "Authentication failed (401)"

**Problem:** API key is invalid or revoked

**Solutions:**
1. Check if key is still active at console.anthropic.com
2. Create a new API key
3. Make sure you have API access enabled
4. Verify no extra spaces when pasting

### "Rate limit exceeded"

**Problem:** Too many API requests

**Solutions:**
1. Wait a few minutes before retrying
2. Check your rate limits at console.anthropic.com
3. Consider upgrading your Anthropic tier

### "Insufficient credits"

**Problem:** Anthropic account has no credits

**Solutions:**
1. Add payment method at console.anthropic.com
2. Check billing settings
3. Verify account is in good standing

---

## Alternative: Use Without AI Features

OnboardKit can generate code **without AI** using template-only mode:

```bash
# Generate without AI validation/enhancement
npx onboardkit generate spec.md --output ./my-app
```

This mode:
- ✅ No API key required
- ✅ No API charges
- ✅ Instant generation
- ❌ No spec validation/repair
- ❌ No AI enhancements

For most users, template-only mode is sufficient!

---

## FAQ

**Q: Do I need Claude Pro/Max subscription?**  
A: No. You only need an Anthropic API account (separate from Claude.ai subscription).

**Q: Can I use my Claude.ai subscription instead?**  
A: No. Claude.ai subscriptions are separate from API access. You need an API key from console.anthropic.com.

**Q: How much will this cost?**  
A: Typical usage: $0.10-$0.50 per generation. See Pricing section above.

**Q: Can I share my API key?**  
A: No. API keys are personal credentials. Create separate keys for team members.

**Q: Where is my API key stored?**  
A: Securely in your OS keychain (macOS Keychain, Windows Credential Manager, Linux Secret Service).

**Q: Can I use environment variables instead?**  
A: Currently OnboardKit uses keychain storage. Environment variable support may be added in future releases.

---

## Support

- **Anthropic API Issues**: support@anthropic.com
- **OnboardKit Issues**: [GitHub Issues](https://github.com/alifa20/onboarding-kit/issues)
- **API Documentation**: https://docs.anthropic.com
