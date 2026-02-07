# CLI Reference

Complete command-line interface documentation for OnboardKit.

## Global Usage

```bash
npx onboardkit [command] [options]

# Or if installed globally
onboardkit [command] [options]
```

## Global Options

Available for all commands:

| Option | Alias | Description |
|--------|-------|-------------|
| `--help` | `-h` | Show help for command |
| `--version` | `-v` | Show OnboardKit version |
| `--verbose` | | Enable detailed logging |

**Examples:**

```bash
npx onboardkit --version
npx onboardkit --help
npx onboardkit generate --verbose
```

---

## Commands

### `init`

Create a new onboarding spec from interactive template.

**Usage:**
```bash
onboardkit init
```

**Description:**

Guides you through creating a `spec.md` file with interactive prompts. Collects basic information about your app and generates a starter template.

**Interactive Prompts:**
1. App name
2. Primary color (hex)
3. Secondary color (hex)
4. Welcome screen headline
5. Welcome screen subtext

**Output:**

Creates `spec.md` in current directory with:
- Config section (defaults)
- Theme section (from prompts)
- Welcome screen (from prompts)
- 3 onboarding steps (template)
- Login section (defaults)
- Name capture section (defaults)
- Commented-out optional sections (soft/hard paywalls)

**Examples:**

```bash
# Create new spec
$ onboardkit init
? What is your app name? › FitTrack Pro
? Primary color (hex): › #F59E0B
? Secondary color (hex): › #EF4444
? Welcome screen headline: › Your Fitness Journey Starts Here
? Welcome screen subtext: › Track, monitor, achieve

✓ Created spec.md successfully!

Next steps:
  1. Edit spec.md to customize your onboarding flow
  2. Run onboardkit validate to check your spec
  3. Run onboardkit generate to generate code
```

**Overwrite Protection:**

If `spec.md` exists, asks for confirmation:

```bash
$ onboardkit init
? spec.md already exists. Overwrite it? › no
✖ Operation cancelled.
```

**Exit Codes:**
- `0` - Success
- `1` - User cancelled

---

### `auth`

Manage AI provider authentication.

**Usage:**
```bash
onboardkit auth [subcommand]

# Aliases for login
onboardkit auth
onboardkit auth login
```

**Subcommands:**

#### `auth` / `auth login`

Interactive OAuth authentication flow.

```bash
onboardkit auth
```

**Flow:**
1. Select AI provider (currently Anthropic Claude only)
2. Browser opens to provider's OAuth page
3. User logs in and authorizes
4. CLI receives authorization code
5. Exchanges code for access token
6. Stores credentials securely

**Example:**

```bash
$ onboardkit auth

OnboardKit Auth

? Select AI provider: › Anthropic Claude
  Opens browser to authenticate...

⠋ Waiting for authorization...

✓ Successfully authenticated with Anthropic Claude!
  Access token expires: 2026-03-09 14:30:00

  Run 'onboardkit onboard' to start generating!
```

**Credential Storage:**

Credentials stored securely:
- **macOS:** Keychain
- **Linux:** Secret Service (libsecret)
- **Windows:** Credential Manager
- **Fallback:** AES-256-GCM encrypted file (`~/.onboardkit/credentials.json`)

**Errors:**

```bash
# Browser doesn't open
Error: Could not open browser automatically
Please open this URL manually: https://...

# Timeout
Error: Authentication timed out after 2 minutes
Please try again

# Network error
Error: Failed to exchange authorization code
Check your internet connection and try again
```

#### `auth status`

Check authentication status for configured providers.

```bash
onboardkit auth status
```

**Example:**

```bash
$ onboardkit auth status

Authentication Status

Anthropic Claude:
  Status: ✓ Authenticated
  Expires: 2026-03-09 14:30:00 (in 29 days)
  Token: Valid

No action needed.
```

**Not Authenticated:**

```bash
$ onboardkit auth status

Authentication Status

Anthropic Claude:
  Status: ✗ Not authenticated

Run 'onboardkit auth' to authenticate.
```

**Token Expired:**

```bash
$ onboardkit auth status

Authentication Status

Anthropic Claude:
  Status: ⚠ Token expired
  Expired: 2026-01-15 10:00:00

Run 'onboardkit auth' to re-authenticate.
```

#### `auth revoke`

Revoke and delete stored credentials.

```bash
onboardkit auth revoke
```

**Example:**

```bash
$ onboardkit auth revoke

? Are you sure you want to revoke all credentials? › yes

✓ Revoked credentials for Anthropic Claude
✓ Deleted stored credentials

You'll need to re-authenticate to use AI features.
```

**Exit Codes:**
- `0` - Success
- `1` - User cancelled or error

---

### `validate`

Validate spec file against schema.

**Usage:**
```bash
onboardkit validate [options]
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--spec <path>` | string | `./spec.md` | Path to spec file |
| `--verbose` | boolean | `false` | Show full spec details |

**Examples:**

**Valid Spec:**

```bash
$ onboardkit validate

Validating spec.md...

✓ Spec is valid!

Project: FitTrack Pro
Screens: 7
  - Welcome
  - 3 Onboarding Steps
  - Soft Paywall
  - Login
  - Name Capture

Theme: #F59E0B (primary), #EF4444 (secondary)
```

**Invalid Spec:**

```bash
$ onboardkit validate

Validating spec.md...

✗ Spec validation failed

Errors:
  1. theme.primary: Must be a valid hex color
     Found: "orange"
     Fix: Use format #RRGGBB (e.g., #FF5733)

  2. welcome.headline: Required field missing
     Section: Welcome Screen
     Fix: Add "- Headline: Your headline text"

  3. onboardingSteps: Must have at least 1 item
     Found: 0 steps
     Fix: Add at least one ### Step 1 section

Run 'onboardkit validate --verbose' for full details
```

**Verbose Mode:**

```bash
$ onboardkit validate --verbose

Validating spec.md...

Parsed Spec:
{
  projectName: "FitTrack Pro",
  config: {
    platform: "expo",
    navigation: "react-navigation",
    styling: "stylesheet"
  },
  theme: {
    primary: "#F59E0B",
    secondary: "#EF4444",
    ...
  },
  ...
}

✓ Spec is valid!
```

**Custom Spec Path:**

```bash
$ onboardkit validate --spec examples/fitness-app.md

Validating examples/fitness-app.md...

✓ Spec is valid!
```

**Exit Codes:**
- `0` - Valid spec
- `1` - Invalid spec or file not found

---

### `generate`

Generate code from spec (template-only, no AI).

**Usage:**
```bash
onboardkit generate [options]
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--spec <path>` | string | `./spec.md` | Path to spec file |
| `--output <path>` | string | `./onboardkit-output` | Output directory |
| `--dry-run` | boolean | `false` | Preview without writing |
| `--overwrite` | boolean | `false` | Overwrite existing output |
| `--verbose` | boolean | `false` | Show detailed progress |

**Examples:**

**Basic Usage:**

```bash
$ onboardkit generate

Reading spec.md...
Validating spec...
Building screen manifests...
Rendering templates...
Formatting code...

✓ Generated 18 files successfully!

Output: ./onboardkit-output/

Screens:
  screens/WelcomeScreen.tsx
  screens/OnboardingStep1.tsx
  screens/OnboardingStep2.tsx
  screens/OnboardingStep3.tsx
  screens/LoginScreen.tsx
  screens/NameCaptureScreen.tsx
  screens/HomeScreen.tsx

Navigation:
  navigation/stack.tsx
  navigation/types.ts

Theme:
  theme/colors.ts
  theme/typography.ts
  theme/spacing.ts
  theme/index.ts

Components:
  components/Button.tsx
  components/Input.tsx
  components/Card.tsx

Next steps:
  1. Copy files to your Expo project: cp -r onboardkit-output/* ./src/
  2. Install dependencies: npx expo install @react-navigation/native @react-navigation/native-stack
  3. Run your app: npx expo start
```

**Dry Run:**

```bash
$ onboardkit generate --dry-run

[DRY RUN] No files will be written

Would generate 18 files:
  screens/WelcomeScreen.tsx (245 lines)
  screens/OnboardingStep1.tsx (198 lines)
  screens/OnboardingStep2.tsx (198 lines)
  ...

Total size: 8.4 KB
```

**Custom Paths:**

```bash
$ onboardkit generate \
  --spec examples/fitness-app.md \
  --output ./my-output

✓ Generated files to ./my-output/
```

**Overwrite Protection:**

```bash
$ onboardkit generate

Error: Output directory './onboardkit-output' already exists
Use --overwrite to replace existing files

$ onboardkit generate --overwrite

⚠ Overwriting existing output directory...
✓ Generated files successfully!
```

**Verbose Mode:**

```bash
$ onboardkit generate --verbose

[PARSE] Reading spec from ./spec.md
[PARSE] Parsing markdown AST
[PARSE] Extracting sections
[VALIDATE] Validating against schema
[VALIDATE] ✓ Config valid
[VALIDATE] ✓ Theme valid
[VALIDATE] ✓ Welcome valid
[MANIFEST] Building screen manifests
[MANIFEST] Created 7 screen manifests
[RENDER] Rendering WelcomeScreen.tsx
[RENDER] Rendering OnboardingStep1.tsx
...
[FORMAT] Formatting with Prettier
[WRITE] Writing screens/WelcomeScreen.tsx
[WRITE] Writing screens/OnboardingStep1.tsx
...
✓ Complete!
```

**Exit Codes:**
- `0` - Success
- `1` - Validation error, generation error, or file exists without `--overwrite`

---

### `onboard`

Run full 7-phase AI-powered workflow.

**Usage:**
```bash
onboardkit onboard [options]
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--spec <path>` | string | `./spec.md` | Path to spec file |
| `--output <path>` | string | `./onboardkit-output` | Output directory |
| `--skip-enhance` | boolean | `false` | Skip AI enhancement phase |
| `--verbose` | boolean | `false` | Show detailed progress |

**The 7 Phases:**

1. **Auth Check** - Verify AI provider authentication
2. **Spec Check** - Validate spec or create interactively
3. **Spec Repair** - AI fixes validation errors
4. **AI Enhancement** - AI suggests UX improvements
5. **Generation** - Generate code and design prompts
6. **Refinement Chat** - Interactive improvements
7. **Finalize** - Write files and show summary

**Examples:**

**Full Workflow:**

```bash
$ onboardkit onboard

╭──────────────────────────────────╮
│  OnboardKit - Onboard Workflow  │
╰──────────────────────────────────╯

Phase 1/7: Auth Check
  ✓ Authenticated with Anthropic Claude
  Token expires: 2026-03-09 14:30:00

Phase 2/7: Spec Check
  Reading spec.md...
  ✓ Spec found and valid

Phase 3/7: Spec Repair
  ⚠ Found 2 validation errors

  Error 1: theme.primary - Invalid hex color
  AI suggestion: Change "orange" to "#FF9500"
  ? Apply this fix? › yes

  Error 2: welcome.cta - Field missing
  AI suggestion: Add "- CTA: Get Started"
  ? Apply this fix? › yes

  ✓ All errors fixed

Phase 4/7: AI Enhancement
  AI reviewing spec for UX improvements...

  Suggestion 1: Improve welcome headline
  Current: "Welcome"
  Suggested: "Welcome to FitTrack Pro - Your Fitness Journey Starts Here"
  ? Apply this change? › yes

  Suggestion 2: Add accessibility hints
  ...

  ✓ Enhanced with 3 improvements

Phase 5/7: Generation
  Building screen manifests...
  Rendering templates...
  Generating Stitch prompts...
  ✓ Generated 18 files

Phase 6/7: Refinement Chat

  Entering interactive mode. Type your requests or 'done' to finish.

  You: Make the welcome button bigger
  AI: I'll increase the button size and padding.

  Modified: screens/WelcomeScreen.tsx
  + Added larger button styles
  + Increased padding to 20px

  ? Apply changes? › yes
  ✓ Applied

  You: done
  ✓ Refinement complete

Phase 7/7: Finalize
  Formatting code with Prettier...
  Writing 18 files to ./onboardkit-output/
  ✓ All files written

╭───────────────────────╮
│  Generation Complete  │
╰───────────────────────╯

Generated Files:
  18 TypeScript files
  7 screens
  2 navigation files
  4 theme files
  3 shared components

Next Steps:
  1. Copy to your project: cp -r onboardkit-output/* ./src/
  2. Install deps: npx expo install @react-navigation/native
  3. Run: npx expo start

Checkpoint saved. Run 'onboardkit onboard' to resume if interrupted.
```

**Skip Enhancement:**

```bash
$ onboardkit onboard --skip-enhance

Phase 4/7: AI Enhancement
  ⊘ Skipped (--skip-enhance)

Proceeding to generation...
```

**Resume from Checkpoint:**

```bash
$ onboardkit onboard

Found existing checkpoint from 2026-02-07 14:30:00
Last completed phase: 4/7 (AI Enhancement)

? What would you like to do?
  › Continue from Phase 5
    Restart from beginning
    Start fresh (delete checkpoint)

Resuming from Phase 5/7: Generation
...
```

**Checkpoint Modified Spec:**

```bash
$ onboardkit onboard

⚠ Warning: Spec file has been modified since last checkpoint
  Last checkpoint: 2026-02-07 14:30:00
  Spec modified: 2026-02-07 15:45:00

? Continue with modified spec or restart?
  › Restart with new spec
    Continue anyway (not recommended)

Restarting from Phase 1...
```

**Exit Codes:**
- `0` - Success
- `1` - Error or user cancelled
- `2` - Interrupted (checkpoint saved)

**Keyboard Shortcuts:**

- `Ctrl+C` - Save checkpoint and exit
- `Ctrl+D` - Skip current phase
- `Ctrl+R` - Restart current phase

---

### `reset`

Clear workflow checkpoints and state.

**Usage:**
```bash
onboardkit reset
```

**Description:**

Removes checkpoint files that allow resuming the `onboard` workflow. Use this to start fresh.

**Examples:**

```bash
$ onboardkit reset

? Are you sure you want to reset checkpoint data? › yes

✓ Deleted .onboardkit/checkpoint.json
✓ Checkpoint data cleared

Run 'onboardkit onboard' to start fresh.
```

**No Checkpoint:**

```bash
$ onboardkit reset

No checkpoint data found.
Nothing to reset.
```

**Exit Codes:**
- `0` - Success
- `1` - User cancelled

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ONBOARDKIT_VERBOSE` | Enable verbose logging | `false` |
| `ONBOARDKIT_NO_COLOR` | Disable colored output | `false` |
| `ONBOARDKIT_TIMEOUT` | OAuth timeout (ms) | `120000` |

**Example:**

```bash
ONBOARDKIT_VERBOSE=true onboardkit generate
```

---

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | Error (validation, generation, or user error) |
| `2` | Interrupted (checkpoint saved) |
| `130` | Terminated by user (Ctrl+C) |

---

## Configuration Files

### `.onboardkit/checkpoint.json`

Stores workflow state for resume capability.

**Location:** `./.onboardkit/checkpoint.json`

**Structure:**
```json
{
  "phase": 4,
  "timestamp": "2026-02-07T14:30:00.000Z",
  "specHash": "abc123...",
  "specPath": "./spec.md",
  "decisions": {},
  "chatHistory": []
}
```

**Management:**
- Created automatically during `onboard`
- Updated after each phase
- Deleted with `reset` command
- Validates spec hasn't changed

### `~/.onboardkit/credentials.json`

Encrypted credential storage (fallback if keychain unavailable).

**Location:** `~/.onboardkit/credentials.json`

**Security:**
- AES-256-GCM encryption
- Key derived from machine ID
- Permissions: 600 (owner read/write only)
- Never committed to git

---

## Shell Completion

### Bash

```bash
onboardkit completion bash > /etc/bash_completion.d/onboardkit
```

### Zsh

```bash
onboardkit completion zsh > ~/.zsh/completion/_onboardkit
```

### Fish

```bash
onboardkit completion fish > ~/.config/fish/completions/onboardkit.fish
```

---

## Troubleshooting Commands

### Check Installation

```bash
npx onboardkit --version
node --version  # Should be >= 22
```

### Verify Spec

```bash
onboardkit validate --verbose
```

### Test Generation

```bash
onboardkit generate --dry-run
```

### Clear State

```bash
onboardkit reset
rm -rf onboardkit-output
rm .onboardkit/checkpoint.json
```

### Re-authenticate

```bash
onboardkit auth revoke
onboardkit auth
```

---

## See Also

- [Spec Format Guide](SPEC-FORMAT.md) - Complete spec documentation
- [User Guide](USER-GUIDE.md) - Step-by-step tutorials
- [Troubleshooting](TROUBLESHOOTING.md) - Common issues and solutions
- [FAQ](FAQ.md) - Frequently asked questions
