# OnboardKit

**Zero-cost AI-powered onboarding screen generator for React Native & Expo**

[![npm version](https://badge.fury.io/js/onboardkit.svg)](https://www.npmjs.com/package/onboardkit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D22-brightgreen)](https://nodejs.org/)

Generate beautiful, production-ready onboarding screens for your React Native/Expo app in minutes, not days. Write a simple markdown spec, run one command, and get fully-typed TypeScript components with navigation, themes, and polish.

## Why OnboardKit?

Building mobile onboarding screens is repetitive and time-consuming. OnboardKit eliminates the boilerplate:

- **Zero-cost AI** - Uses OAuth to access your existing Claude/Gemini subscription (no API bills)
- **Markdown-first** - Define your onboarding flow in simple, readable markdown
- **Production-ready code** - TypeScript strict mode, properly typed React Navigation, themed components
- **Fast** - From idea to working screens in under an hour
- **Offline-capable** - Generate command works without AI for template-only generation

## Features

- OAuth 2.0 + PKCE authentication (Anthropic Claude support, more providers coming)
- Markdown spec parser with AI-powered validation and enhancement
- Template-based code generation (Welcome, Login, Signup screens)
- Full React Navigation setup with type-safe routing
- Complete theme system (colors, typography, spacing)
- Shared component library (Button, Input, Card)
- Checkpoint/resume system for interrupted workflows
- Cross-platform support (macOS, Linux, Windows)

## Quick Start

```bash
# No installation needed - use npx
npx onboardkit init

# Edit spec.md with your app details
# Then generate your screens

npx onboardkit generate
```

That's it! You'll have a complete `onboardkit-output/` directory with all your screens, navigation, and theme files.

## Prerequisites

- Node.js >= 22
- An existing Expo or React Native project
- (Optional) Claude Pro/Max subscription for AI features

## Installation

OnboardKit is designed to run via `npx` without installation:

```bash
npx onboardkit <command>
```

If you prefer to install globally:

```bash
npm install -g onboardkit
onboardkit <command>
```

## Usage

### 1. Create a Spec

Initialize a new onboarding specification:

```bash
npx onboardkit init
```

This creates a `spec.md` file with an interactive prompt. Edit it to customize:

```markdown
# MyAwesomeApp

## Config
- Platform: expo
- Navigation: react-navigation
- Styling: stylesheet

## Theme
- Primary: #6366F1
- Secondary: #8B5CF6
- Background: #FFFFFF
...

## Welcome Screen
- Headline: Welcome to MyAwesomeApp
- Subtext: Get started with the best experience
- Image: welcome-illustration
- CTA: Get Started
...
```

### 2. Validate Your Spec

Check if your spec is valid:

```bash
npx onboardkit validate
```

### 3. Generate Code

Two ways to generate:

**Option A: Template-only (no AI, works offline)**
```bash
npx onboardkit generate
```

**Option B: Full AI workflow (requires OAuth)**
```bash
# First-time: authenticate
npx onboardkit auth

# Then run the full 7-phase workflow
npx onboardkit onboard
```

### 4. Integrate into Your Expo Project

Copy the generated files into your project:

```bash
cp -r onboardkit-output/* ./src/
```

Install dependencies:

```bash
npx expo install @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context
```

Update your `App.tsx`:

```tsx
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from './navigation/stack';

export default function App() {
  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}
```

Run your app:

```bash
npx expo start
```

## Command Reference

### `onboardkit init`

Create a new onboarding spec template.

```bash
npx onboardkit init
```

Interactive prompts guide you through creating a spec.md file.

### `onboardkit auth`

Manage AI provider authentication.

```bash
# Login (interactive provider selection)
npx onboardkit auth

# Check authentication status
npx onboardkit auth status

# Revoke stored credentials
npx onboardkit auth revoke
```

### `onboardkit validate`

Validate your spec file.

```bash
npx onboardkit validate [options]

Options:
  --spec <path>    Path to spec file (default: ./spec.md)
  --verbose        Show detailed validation info
```

### `onboardkit generate`

Generate code from spec (template-only, no AI).

```bash
npx onboardkit generate [options]

Options:
  --spec <path>      Path to spec file (default: ./spec.md)
  --output <path>    Output directory (default: ./onboardkit-output)
  --dry-run          Preview without writing files
  --overwrite        Overwrite existing output directory
  --verbose          Show detailed generation info
```

### `onboardkit onboard`

Run the full 7-phase AI-powered workflow.

```bash
npx onboardkit onboard [options]

Options:
  --spec <path>       Path to spec file (default: ./spec.md)
  --output <path>     Output directory (default: ./onboardkit-output)
  --skip-enhance      Skip AI enhancement phase
  --verbose           Show detailed progress
```

Phases:
1. Auth Check - Verify AI provider authentication
2. Spec Check - Validate spec or create interactively
3. Spec Repair - AI fixes validation errors
4. AI Enhancement - AI suggests UX improvements
5. Generation - Generate all code and prompts
6. Refinement Chat - Interactive improvements
7. Finalize - Write files and show summary

### `onboardkit reset`

Clear workflow checkpoints.

```bash
npx onboardkit reset
```

## Example Output

### Before: Your Spec

```markdown
## Welcome Screen
- Headline: Track Your Fitness Journey
- Subtext: Log workouts, set goals, achieve results
- Image: fitness-welcome
- CTA: Start Training
```

### After: Generated Code

```tsx
// screens/WelcomeScreen.tsx
import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing } from '../theme';

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Image source={{ uri: 'fitness-welcome' }} style={styles.image} />
      <Text style={styles.headline}>Track Your Fitness Journey</Text>
      <Text style={styles.subtext}>Log workouts, set goals, achieve results</Text>
      <Pressable style={styles.button} onPress={() => navigation.navigate('OnboardingStep1')}>
        <Text style={styles.buttonText}>Start Training</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  // ... more styles
});
```

Complete with:
- Type-safe navigation
- Themed components
- Responsive layouts
- Accessibility support

## Architecture Overview

```
OnboardKit CLI
├── Spec Parser (unified + remark + Zod)
├── OAuth System (PKCE + secure storage)
├── AI Integration (Anthropic Claude)
├── Template Engine (Handlebars)
├── Code Generator (TypeScript output)
└── Workflow Manager (7-phase checkpoint system)
```

**Generated Output:**
```
onboardkit-output/
├── screens/
│   ├── WelcomeScreen.tsx
│   ├── OnboardingStep1.tsx
│   ├── OnboardingStep2.tsx
│   ├── LoginScreen.tsx
│   ├── NameCaptureScreen.tsx
│   └── HomeScreen.tsx
├── navigation/
│   ├── stack.tsx
│   └── types.ts
├── theme/
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   └── index.ts
└── components/
    ├── Button.tsx
    ├── Input.tsx
    └── Card.tsx
```

## Spec Format

See [docs/SPEC-FORMAT.md](docs/SPEC-FORMAT.md) for complete documentation.

**Required sections:**
- Config (platform, navigation, styling)
- Theme (colors, typography)
- Welcome Screen
- Onboarding Steps (1+)
- Login
- Name Capture

**Optional sections:**
- Soft Paywall
- Hard Paywall

## Examples

### Basic Example

Minimal onboarding flow with 3 steps:

```bash
cp examples/basic/spec.md ./
npx onboardkit generate
```

### With Paywall Example

Includes soft paywall before login:

```bash
cp examples/with-paywall/spec.md ./
npx onboardkit generate
```

### Full-Featured Example

All features including hard paywall:

```bash
cp examples/full-featured/spec.md ./
npx onboardkit generate
```

## Troubleshooting

### OAuth Setup Issues

**Problem:** Browser doesn't open for OAuth

**Solution:**
```bash
# Manually open the URL shown in terminal
# Or check if port 3000 is available
lsof -ti:3000 | xargs kill -9
```

### Spec Validation Errors

**Problem:** "Invalid hex color"

**Solution:** Use format `#RRGGBB` or `#RGB` (e.g., `#FF5733` or `#F53`)

**Problem:** "Missing required field"

**Solution:** Check all required sections are present (run `npx onboardkit validate --verbose`)

### Generation Errors

**Problem:** TypeScript errors in generated code

**Solution:**
```bash
# Regenerate with verbose logging
npx onboardkit generate --verbose

# Report issue with error details
```

### Platform-Specific Issues

**macOS:** Keychain permission denied
```bash
# Grant terminal access in System Settings > Privacy & Security > Keychain
```

**Linux:** libsecret not found
```bash
# Install libsecret
sudo apt-get install libsecret-1-dev  # Ubuntu/Debian
sudo yum install libsecret-devel      # Fedora/RHEL
```

**Windows:** Credential Manager access denied
```bash
# Run terminal as administrator
```

## FAQ

### How does zero-cost AI work?

OnboardKit uses OAuth 2.0 + PKCE to access AI providers (like Claude) using your existing subscription. Instead of paying per API call, you leverage subscriptions you already have. No additional costs.

### Can I use my own API keys?

Not yet, but planned for a future release. Current focus is on OAuth for simplicity.

### Can I customize the templates?

Yes! Run `npx onboardkit eject` to copy templates to your project. Edit them locally and OnboardKit will use your customized versions.

### How do I add more screens?

Edit your spec.md to add more onboarding steps or screens, then regenerate. The spec format is extensible.

### Can I use with Next.js or Flutter?

Not currently. OnboardKit is focused on React Native/Expo. Support for other platforms may come based on community interest.

### What's the difference between generate and onboard?

- `generate` - Template-only, works offline, fast, no AI
- `onboard` - Full AI workflow with validation, enhancement, and refinement

Use `generate` for quick iterations, `onboard` for polished results.

### Is generated code production-ready?

Yes! Generated code uses:
- TypeScript strict mode
- Proper type safety
- React Navigation best practices
- Themed components
- Accessibility support

You should review and test, but it's production-quality.

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Ways to contribute:**
- Report bugs via [GitHub Issues](https://github.com/alifa20/onboarding-kit/issues)
- Submit feature requests
- Contribute templates
- Improve documentation
- Submit pull requests

### Development Setup

```bash
# Clone repo
git clone https://github.com/alifa20/onboarding-kit.git
cd onboarding-kit/cli

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Link for local testing
npm link
onboardkit --version
```

## Roadmap

**v1.1** (Next)
- Google Gemini OAuth support
- 5 additional screen templates
- Enhanced error recovery

**v1.2**
- GitHub Models support
- Ollama (local AI) support
- 10+ templates total

**v1.3**
- Community template contributions
- Template versioning
- `eject` command for customization

**v1.4**
- Interactive chat refinement
- Multi-turn conversations
- Context-aware suggestions

## License

MIT - see [LICENSE](LICENSE) file for details.

## Credits

Built with:
- [Commander.js](https://github.com/tj/commander.js) - CLI framework
- [Clack](https://github.com/natemoo-re/clack) - Terminal UI
- [Zod](https://github.com/colinhacks/zod) - Schema validation
- [Handlebars](https://handlebarsjs.com/) - Template engine
- [Anthropic Claude](https://www.anthropic.com/) - AI provider
- [unified](https://unifiedjs.com/) - Markdown processing

## Support

- Documentation: [/docs](docs/)
- Issues: [GitHub Issues](https://github.com/alifa20/onboarding-kit/issues)
- Discussions: [GitHub Discussions](https://github.com/alifa20/onboarding-kit/discussions)

---

**Made with ❤️ by [Ali](https://github.com/alifa20)**

If OnboardKit saves you time, consider giving it a star on GitHub!
