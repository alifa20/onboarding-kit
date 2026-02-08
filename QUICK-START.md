# OnboardKit Quick Start

## Installation

```bash
npm install -g onboardkit
# or run directly with npx
```

## Step 1: Authenticate with Claude Pro/Max

```bash
npx onboardkit auth

# This will:
# 1. Open your browser to claude.ai
# 2. Log in with your Claude Pro/Max account ($20-200/month)
# 3. Grant access to OnboardKit
# 4. Save OAuth tokens to your OS keychain
```

**Requirements:**
- Claude Pro ($20/month) or Claude Max ($200/month) subscription
- Free tier will NOT work

## Step 2: Create a Spec

```bash
npx onboardkit init

# This creates spec.md with template structure
```

Edit `spec.md` to define your app:

```markdown
# Project Name
My Awesome App

# Brand Colors
- Primary: #3B82F6
- Secondary: #8B5CF6

# Onboarding Steps
## Screen 1
- Headline: Welcome to My App
- Description: Get started in seconds
- CTA Button: Continue
- Image: Welcome illustration

# Navigation
React Navigation Stack
# or: Expo Router

# Features
- Unlimited access
- Premium support
- No ads
```

## Step 3: Generate Your App

```bash
npx onboardkit onboard spec.md --output ./my-app

# This runs the full 7-phase workflow:
# 1. Auth Check - Verifies your OAuth tokens
# 2. Spec Check - Validates your spec.md
# 3. Repair (AI) - Fixes any validation errors [optional with --ai-repair]
# 4. Enhancement (AI) - Improves copy [optional with --ai-enhance]
# 5. Generation - Creates React Native screens
# 6. Refinement (AI) - Chat for tweaks [skipped by default]
# 7. Finalize - Writes all files + Stitch prompts
```

## Step 4: Use the Generated Code

```bash
cd my-app

# Copy files into your Expo/React Native project:
# - screens/ → your project's screens folder
# - theme/ → your project's theme folder
# - navigation/ → your project's navigation setup

# Or integrate into existing app:
cp -r screens/* ../my-existing-app/src/screens/
cp theme/colors.ts ../my-existing-app/src/theme/
```

## Optional: Generate UI Designs with Stitch

If you have Stitch MCP configured:

```bash
npx onboardkit onboard spec.md --output ./my-app

# During Phase 7, you'll be prompted:
# "Connect to Stitch MCP to generate UI designs?"
# → Yes

# This creates:
# - Stitch project with your app name
# - AI-generated designs for each screen
# - Preview URLs for each design
```

Or use prompts manually:

```bash
# Prompts are always saved to:
./my-app/stitch-prompts/

# Files:
# - welcome.md
# - onboarding-step-1.md
# - onboarding-step-2.md
# - soft-paywall.md
# - login.md
# - name-capture.md
# - hard-paywall.md
# - home.md

# Copy/paste these into Stitch manually
```

## Cost

### With Claude Pro/Max OAuth (Recommended)
- **$20/month (Pro)** or **$200/month (Max)** flat rate
- No additional API charges
- Uses your existing subscription
- Unlimited onboard runs (subject to rate limits)

### With API Keys (Alternative)
- ~$2.50 per onboard run
- Pay-as-you-go pricing
- Good for occasional use

## Commands Reference

```bash
# Authentication
npx onboardkit auth           # Authenticate with OAuth
npx onboardkit auth status    # Check auth status
npx onboardkit auth revoke    # Revoke credentials

# Workflow
npx onboardkit init                    # Create spec template
npx onboardkit validate spec.md        # Validate spec
npx onboardkit generate spec.md        # Template-only (no AI)
npx onboardkit onboard spec.md         # Full AI workflow

# Options
--ai-repair              # Auto-fix validation errors with AI
--ai-enhance             # Enhance copy with AI improvements
--skip-refinement        # Skip refinement phase (default: true)
--output <path>          # Output directory (default: onboardkit-output)
--overwrite              # Overwrite existing output
--dry-run                # Preview without writing files
--verbose                # Show detailed output

# Workflow management
npx onboardkit reset spec.md           # Clear checkpoints
```

## Navigation System Choice

OnboardKit supports **both** navigation systems:

### Expo Router (File-based)
```markdown
# Navigation
Expo Router
```

Generates:
- `app/_layout.tsx` - Root layout
- `app/index.tsx` - Welcome screen
- `app/onboarding/[step].tsx` - Dynamic routes
- Uses `useRouter()` hook

### React Navigation (Stack)
```markdown
# Navigation
React Navigation Stack
```

Generates:
- `navigation/RootNavigator.tsx` - Stack navigator
- `screens/WelcomeScreen.tsx` - Individual screens
- Uses `useNavigation()` hook

## Troubleshooting

### "Not authenticated"
```bash
npx onboardkit auth
```

### "Authentication expired"
Tokens expire after 30 days:
```bash
npx onboardkit auth
```

### "Must have Claude Pro or Max"
Free tier doesn't work. Subscribe at: https://claude.ai/subscription

### Browser doesn't open
Copy the URL from terminal and open manually.

### Spec validation errors
Use `--ai-repair` to fix automatically:
```bash
npx onboardkit onboard spec.md --ai-repair
```

### Build cache issues
Clear checkpoints:
```bash
npx onboardkit reset spec.md --force
```

## Architecture

```
OnboardKit CLI
  ↓
Phase 1: Auth Check (OAuth tokens)
  ↓
Phase 2: Spec Check (Parse + Validate)
  ↓
Phase 3: Repair [AI] (Fix errors)
  ↓
Phase 4: Enhancement [AI] (Improve copy)
  ↓
Phase 5: Generation (Handlebars → React Native)
  ↓
Phase 6: Refinement [AI] (Interactive chat - optional)
  ↓
Phase 7: Finalize (Write files + Stitch prompts)
```

OAuth authenticates with `claude.ai` and routes requests to `api.githubcopilot.com` (Claude Code endpoint), using your Claude Pro/Max subscription instead of API billing.

## Next Steps

1. **Authenticate**: `npx onboardkit auth`
2. **Create spec**: `npx onboardkit init`
3. **Customize**: Edit `spec.md` with your app details
4. **Generate**: `npx onboardkit onboard spec.md --ai-enhance`
5. **Integrate**: Copy generated files into your project
6. **Ship**: Build and deploy your app!

Ready to get started? Run `npx onboardkit auth` now! 🚀
