# Troubleshooting Guide

Common issues and solutions for OnboardKit.

## Installation & Setup Issues

### Node.js Version Too Old

**Symptom:**
```
Error: The engine "node" is incompatible with this module
```

**Solution:**

Update to Node.js >= 22:

```bash
# Check current version
node --version

# Install Node.js 22+
# Visit https://nodejs.org/

# Or use nvm
nvm install 22
nvm use 22
```

---

### npx Command Not Found

**Symptom:**
```
command not found: npx
```

**Solution:**

npx comes with npm 5.2+. Update npm:

```bash
npm install -g npm@latest
```

---

### Permission Denied on macOS/Linux

**Symptom:**
```
Error: EACCES: permission denied
```

**Solution:**

Don't use sudo with npx. Fix npm permissions:

```bash
# Create npm global directory
mkdir ~/.npm-global

# Configure npm
npm config set prefix '~/.npm-global'

# Add to PATH (add to ~/.bashrc or ~/.zshrc)
export PATH=~/.npm-global/bin:$PATH

# Reload shell
source ~/.bashrc  # or source ~/.zshrc
```

---

## Authentication Issues

### OAuth Browser Doesn't Open

**Symptom:**
```
Waiting for authorization...
(browser doesn't open)
```

**Solution:**

Manually open the URL:

```bash
$ onboardkit auth

Opening browser to authenticate...

If browser doesn't open, visit:
https://auth.anthropic.com/oauth/authorize?...

# Copy and paste URL into browser manually
```

---

### OAuth Timeout

**Symptom:**
```
Error: Authentication timed out after 2 minutes
```

**Solution:**

1. Check network connection
2. Increase timeout:

```bash
ONBOARDKIT_TIMEOUT=300000 npx onboardkit auth
```

3. Try again during off-peak hours

---

### Keychain Access Denied (macOS)

**Symptom:**
```
Error: Could not save to keychain
Falling back to encrypted file storage
```

**Solution:**

Grant terminal access to keychain:

1. Open **System Settings**
2. Go to **Privacy & Security** → **Keychain**
3. Enable access for **Terminal** (or your terminal app)
4. Run auth again:

```bash
onboardkit auth revoke
onboardkit auth
```

---

### libsecret Not Found (Linux)

**Symptom:**
```
Error: Cannot find module 'libsecret'
```

**Solution:**

Install libsecret:

```bash
# Ubuntu/Debian
sudo apt-get install libsecret-1-dev

# Fedora/RHEL
sudo yum install libsecret-devel

# Arch
sudo pacman -S libsecret

# Then reinstall
npm install -g onboardkit
```

---

### Credential Manager Error (Windows)

**Symptom:**
```
Error: Could not access Windows Credential Manager
```

**Solution:**

1. Run terminal as Administrator
2. Or allow fallback to encrypted file storage (automatic)
3. Check credentials saved to `%USERPROFILE%\.onboardkit\credentials.json`

---

### Token Expired

**Symptom:**
```
Error: Access token has expired
```

**Solution:**

Re-authenticate:

```bash
onboardkit auth revoke
onboardkit auth
```

OnboardKit should auto-refresh, but if it fails:

```bash
# Check status
onboardkit auth status

# Manual revoke and re-auth
onboardkit auth revoke
onboardkit auth
```

---

## Spec Validation Issues

### Invalid Hex Color

**Symptom:**
```
Error: theme.primary - Must be a valid hex color
```

**Solution:**

Use proper hex format:

```markdown
# Wrong
- Primary: orange
- Primary: rgb(255, 0, 0)
- Primary: FF5733

# Correct
- Primary: #FF5733
- Primary: #F53
```

---

### Missing Required Field

**Symptom:**
```
Error: welcome.headline - Required field missing
```

**Solution:**

Add the missing field:

```markdown
## Welcome Screen

- Headline: Welcome to MyApp  # Add this
- Subtext: Get started
- Image: welcome
- CTA: Start
```

Check all required sections are present:

```bash
onboardkit validate --verbose
```

---

### Empty Array Error

**Symptom:**
```
Error: onboardingSteps - Must have at least 1 item
```

**Solution:**

Add at least one onboarding step:

```markdown
## Onboarding Steps

### Step 1

- Title: First Step
- Headline: Discover Features
- Subtext: Learn what makes us special
- Image: onboarding-1
```

---

### Invalid Array Format

**Symptom:**
```
Error: login.methods - Expected array, received string
```

**Solution:**

Use inline array syntax:

```markdown
# Wrong
- Methods: email, google

# Correct
- Methods: [email, google, apple]
```

---

### Section Not Recognized

**Symptom:**
```
Warning: Unknown section "My Custom Section"
```

**Solution:**

Check spelling and capitalization:

```markdown
# Wrong
## welcome screen

# Correct
## Welcome Screen
```

Supported sections:
- Config
- Theme
- Welcome Screen
- Onboarding Steps
- Soft Paywall
- Login
- Name Capture
- Hard Paywall

---

## Generation Issues

### Output Directory Exists

**Symptom:**
```
Error: Output directory already exists
Use --overwrite to replace
```

**Solution:**

```bash
# Overwrite existing
onboardkit generate --overwrite

# Or remove manually
rm -rf onboardkit-output
onboardkit generate
```

---

### TypeScript Errors in Generated Code

**Symptom:**

Generated files have TypeScript compilation errors.

**Solution:**

1. Regenerate with verbose logging:

```bash
onboardkit generate --verbose
```

2. Check template issues:

```bash
# Validate spec first
onboardkit validate

# Try with different spec
onboardkit generate --spec examples/fitness-app.md
```

3. If errors persist, report issue with:
   - OnboardKit version
   - spec.md file
   - Error message

---

### Generated Code Not Formatted

**Symptom:**

Code is generated but not prettified.

**Solution:**

Prettier may have failed. Format manually:

```bash
cd onboardkit-output

# Install prettier locally
npm install --save-dev prettier

# Format files
npx prettier --write "**/*.{ts,tsx}"
```

---

### Missing Generated Files

**Symptom:**

Some expected files not generated.

**Solution:**

1. Check if spec includes optional sections:

```markdown
# These are optional - only generated if present
## Soft Paywall
## Hard Paywall
```

2. Verify generation completed:

```bash
onboardkit generate --verbose
```

3. Check output directory structure:

```bash
tree onboardkit-output
```

---

## Integration Issues

### React Navigation Errors

**Symptom:**
```
Error: Couldn't find a navigation object
```

**Solution:**

Ensure NavigationContainer wraps navigator:

```tsx
// App.tsx
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from './src/navigation/stack';

export default function App() {
  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}
```

Install dependencies:

```bash
npx expo install \
  @react-navigation/native \
  @react-navigation/native-stack \
  react-native-screens \
  react-native-safe-area-context
```

---

### Images Not Showing

**Symptom:**

Image placeholders don't display.

**Solution:**

Replace placeholders with actual assets:

```tsx
// Generated (placeholder)
<Image source={{ uri: 'welcome-hero' }} style={styles.image} />

// Updated (with asset)
<Image
  source={require('../assets/images/welcome-hero.png')}
  style={styles.image}
/>
```

Add images to `assets/images/` directory.

---

### Theme Not Applied

**Symptom:**

Colors/styles don't match theme.

**Solution:**

1. Verify theme imported:

```tsx
import { colors, typography, spacing } from '../theme';
```

2. Check theme values:

```typescript
// theme/colors.ts
export const colors = {
  primary: '#YOUR_COLOR',  // Verify this matches spec
  // ...
};
```

3. Restart Expo with cache clear:

```bash
npx expo start --clear
```

---

### Build Errors After Integration

**Symptom:**
```
Error: Unable to resolve module
```

**Solution:**

1. Install missing dependencies:

```bash
npx expo install @react-navigation/native @react-navigation/native-stack
```

2. Clear cache:

```bash
npx expo start --clear

# Or for React Native CLI
npx react-native start --reset-cache
```

3. Reinstall node_modules:

```bash
rm -rf node_modules
npm install
```

---

## AI Workflow Issues

### AI Enhancement Takes Too Long

**Symptom:**

Phase 4 (AI Enhancement) running for 5+ minutes.

**Solution:**

1. Skip enhancement:

```bash
onboardkit onboard --skip-enhance
```

2. Or use template-only generation:

```bash
onboardkit generate
```

---

### AI Suggestions Not Applying

**Symptom:**

Accepting AI suggestions doesn't modify spec.

**Solution:**

1. Check checkpoint saved:

```bash
cat .onboardkit/checkpoint.json
```

2. Verify spec.md writable:

```bash
ls -la spec.md
```

3. Try again with verbose:

```bash
onboardkit onboard --verbose
```

---

### Checkpoint Restore Fails

**Symptom:**
```
Error: Cannot resume - spec has been modified
```

**Solution:**

Spec was edited after checkpoint. Choose an option:

```bash
# Option 1: Reset and start fresh
onboardkit reset
onboardkit onboard

# Option 2: Continue anyway (risky)
# Delete checkpoint and start over
rm .onboardkit/checkpoint.json
onboardkit onboard
```

---

## Platform-Specific Issues

### macOS: Developer Tools Not Installed

**Symptom:**
```
xcrun: error: invalid active developer path
```

**Solution:**

Install Xcode Command Line Tools:

```bash
xcode-select --install
```

---

### Linux: Certificate Errors

**Symptom:**
```
Error: certificate has expired
```

**Solution:**

Update CA certificates:

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install ca-certificates

# Fedora
sudo yum install ca-certificates
```

---

### Windows: Path Too Long

**Symptom:**
```
Error: ENAMETOOLONG
```

**Solution:**

Enable long paths:

1. Open Group Policy Editor (`gpedit.msc`)
2. Navigate to: Computer Configuration → Administrative Templates → System → Filesystem
3. Enable "Enable Win32 long paths"
4. Restart terminal

Or use shorter output path:

```bash
onboardkit generate --output ./out
```

---

### Windows: Line Ending Issues

**Symptom:**

Generated files have wrong line endings.

**Solution:**

Configure Git:

```bash
git config --global core.autocrlf input
```

Regenerate:

```bash
rm -rf onboardkit-output
onboardkit generate
```

---

## Performance Issues

### Slow Generation

**Symptom:**

Generation takes 30+ seconds.

**Solution:**

1. Check CPU usage:

```bash
top  # or Task Manager on Windows
```

2. Reduce spec complexity:
   - Fewer onboarding steps
   - Skip optional sections

3. Use SSD for output directory

---

### High Memory Usage

**Symptom:**

Node.js using excessive memory.

**Solution:**

Increase Node.js memory limit:

```bash
NODE_OPTIONS=--max-old-space-size=4096 npx onboardkit generate
```

---

## Getting Help

### Collect Diagnostic Information

When reporting issues, include:

```bash
# System info
node --version
npm --version
npx onboardkit --version

# OS info
uname -a  # macOS/Linux
systeminfo  # Windows

# Error details
onboardkit generate --verbose 2>&1 | tee error.log

# Spec validation
onboardkit validate --verbose
```

### File an Issue

1. Check [existing issues](https://github.com/alifa20/onboarding-kit/issues)
2. Create new issue with:
   - Clear title
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (from above)
   - Error logs
   - spec.md (if relevant)

### Community Support

- [GitHub Discussions](https://github.com/alifa20/onboarding-kit/discussions)
- [Discord](#) (coming soon)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/onboardkit)

---

## Quick Fixes

### Reset Everything

Nuclear option - start fresh:

```bash
# Remove OnboardKit state
rm -rf .onboardkit
rm -rf onboardkit-output

# Revoke credentials
onboardkit auth revoke

# Start over
onboardkit init
onboardkit auth
onboardkit generate
```

### Verify Installation

```bash
# Check OnboardKit works
npx onboardkit --version

# Validate example spec
npx onboardkit validate --spec node_modules/onboardkit/examples/fitness-app.md

# Generate from example
npx onboardkit generate --spec node_modules/onboardkit/examples/fitness-app.md
```

### Clean npm Cache

```bash
npm cache clean --force
npx clear-npx-cache
```

---

## See Also

- [FAQ](FAQ.md) - Frequently asked questions
- [User Guide](USER-GUIDE.md) - Step-by-step tutorials
- [CLI Reference](CLI-REFERENCE.md) - Complete command documentation
