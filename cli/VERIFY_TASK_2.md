# Task #2 Verification Checklist

Use this checklist to verify the OAuth implementation is working correctly.

## Pre-Verification Setup

```bash
cd /Users/ali/my-projects/onboarding-kit/cli
```

## Step 1: Build Verification

```bash
# Clean build
rm -rf dist/
npm run build
```

**Expected**:
- ✅ Build completes without errors
- ✅ `dist/` directory created
- ✅ `dist/index.js` has shebang (`#!/usr/bin/env node`)
- ✅ OAuth modules bundled

**Check**:
```bash
ls -la dist/
head -n 1 dist/index.js  # Should show #!/usr/bin/env node
```

## Step 2: Type Checking

```bash
npm run typecheck
```

**Expected**:
- ✅ No TypeScript errors
- ✅ Strict mode enabled
- ✅ Zero `any` types in production code

## Step 3: Unit Tests

```bash
npm test -- src/lib/oauth/
```

**Expected**:
- ✅ All PKCE tests pass
- ✅ All token manager tests pass
- ✅ All provider tests pass
- ✅ ~15-20 tests passing

## Step 4: File Structure

```bash
tree src/lib/oauth/
```

**Expected structure**:
```
src/lib/oauth/
├── README.md
├── callback-server.ts
├── flow.ts
├── index.ts
├── pkce.test.ts
├── pkce.ts
├── providers.test.ts
├── providers.ts
├── storage.ts
├── token-manager.test.ts
├── token-manager.ts
└── types.ts
```

## Step 5: CLI Command Testing

### Test Help

```bash
./dist/index.js auth --help
```

**Expected**:
```
Usage: onboardkit auth [options] [command]

Authenticate with AI provider via OAuth

Commands:
  login [options]  Authenticate with an AI provider
  status           Show authentication status
  revoke           Revoke stored credentials
```

### Test Auth Command (Dry Run)

```bash
# This will fail without client ID, but should show proper error
./dist/index.js auth
```

**Expected**:
- ✅ Shows OAuth intro
- ✅ Selects Anthropic provider
- ✅ Shows error about missing client ID (until configured)
- ✅ No crashes or stack traces

### Test Status Command

```bash
./dist/index.js auth status
```

**Expected**:
- ✅ Shows "No authenticated providers found" (first run)
- ✅ Clean output with clack formatting

## Step 6: Code Quality

### Check for TypeScript Any

```bash
grep -r "any" src/lib/oauth/*.ts --exclude="*.test.ts"
```

**Expected**:
- ✅ Only in keytar import (dynamic module, acceptable)
- ✅ No `any` in business logic

### Check for Console.log

```bash
grep -r "console.log" src/lib/oauth/*.ts --exclude="*.test.ts"
```

**Expected**:
- ✅ No console.log (use proper logging)
- ✅ console.warn allowed in storage.ts for fallback notification

### Check File Permissions

```bash
# After first auth (creates config dir)
ls -la ~/.onboardkit/
```

**Expected**:
- ✅ Directory: 700 (drwx------)
- ✅ credentials.json: 600 (-rw-------)

## Step 7: Documentation

### Check README exists

```bash
cat src/lib/oauth/README.md | head -20
```

**Expected**:
- ✅ Clear title
- ✅ Architecture overview
- ✅ Usage examples
- ✅ Security notes

### Check Setup Guide

```bash
cat OAUTH_SETUP.md | head -20
```

**Expected**:
- ✅ Installation instructions
- ✅ First-time setup
- ✅ Troubleshooting section

## Step 8: Security Verification

### Check Encryption Implementation

```bash
grep -A 10 "encryptData" src/lib/oauth/storage.ts
```

**Expected**:
- ✅ Uses AES-256-GCM
- ✅ Generates random IV
- ✅ Includes authentication tag
- ✅ Returns IV:AuthTag:Encrypted format

### Check PKCE Implementation

```bash
grep -A 5 "generateCodeChallenge" src/lib/oauth/pkce.ts
```

**Expected**:
- ✅ Uses SHA256
- ✅ Base64-URL encoding
- ✅ No padding (=)

### Check HTTPS Enforcement

```bash
grep -r "http://" src/lib/oauth/*.ts
```

**Expected**:
- ✅ Only in callback server (localhost)
- ✅ All OAuth endpoints use https://

## Step 9: Integration Points

### Check Index Exports

```bash
cat src/lib/oauth/index.ts
```

**Expected**:
- ✅ Exports all necessary types
- ✅ Exports all necessary functions
- ✅ Clean public API

### Check Command Integration

```bash
grep "authCommand" src/index.ts
```

**Expected**:
- ✅ Imported from commands/auth.js
- ✅ Wired to auth command
- ✅ Subcommands registered

## Step 10: Manual Testing (When Client ID Available)

### Full OAuth Flow

```bash
# Set client ID
export ANTHROPIC_CLIENT_ID="your-client-id-here"

# Run auth
./dist/index.js auth
```

**Expected**:
1. ✅ Callback server starts
2. ✅ Browser opens to authorization URL
3. ✅ After approval, redirects to localhost:3000
4. ✅ Shows success page in browser
5. ✅ CLI shows success message
6. ✅ Credentials saved

### Check Credential Storage

**macOS**:
```bash
security find-generic-password -s onboardkit -w
```

**All platforms (file fallback)**:
```bash
cat ~/.onboardkit/credentials.json
# Should be encrypted gibberish
```

### Check Status

```bash
./dist/index.js auth status
```

**Expected**:
- ✅ Shows "Anthropic Claude" as Active
- ✅ Shows expiration time
- ✅ Shows refresh available

### Test Token Refresh

**Wait for token to expire (or mock expiration in code)**:
```bash
./dist/index.js auth status
```

**Expected**:
- ✅ Status shows "Expired" or "Expiring soon"
- ✅ Next API call triggers refresh
- ✅ Refresh succeeds
- ✅ Status shows "Active" again

### Test Revocation

```bash
./dist/index.js auth revoke
```

**Expected**:
- ✅ Asks for confirmation
- ✅ Removes credentials from keychain
- ✅ Removes credentials from file
- ✅ Shows success message
- ✅ `auth status` shows no providers

## Verification Summary

After completing all steps, check off:

- [ ] Build completes successfully
- [ ] TypeScript type checking passes
- [ ] All unit tests pass
- [ ] File structure correct
- [ ] CLI commands work
- [ ] No `any` types in business logic
- [ ] Documentation complete
- [ ] Security checks pass
- [ ] Encryption verified
- [ ] PKCE verified
- [ ] HTTPS enforced
- [ ] Integration points correct

## If Manual Testing Available

- [ ] Full OAuth flow works
- [ ] Browser opens automatically
- [ ] Credentials stored in keychain
- [ ] Status command shows correct info
- [ ] Token refresh works
- [ ] Revocation works
- [ ] Re-authentication works

## Success Criteria

✅ **All automated checks pass** (Steps 1-9)
✅ **Documentation is complete**
✅ **Code is production-ready** (pending client ID)

## Next Steps

1. **Wait for Client ID**: Anthropic OAuth app approval
2. **Manual Testing**: Complete Step 10 when client ID available
3. **Cross-platform Testing**: Test on Linux and Windows
4. **Integration**: Connect to AI client module (Task #3)

---

**Last Updated**: 2026-02-07
**Task**: #2 OAuth 2.0 + PKCE Authentication System
