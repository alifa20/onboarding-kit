# Basic Example

Minimal onboarding flow with essential screens only.

## Overview

This example demonstrates the simplest possible onboarding flow:
- Welcome screen
- 3 onboarding steps
- Login screen
- Name capture screen

Perfect for:
- Learning OnboardKit basics
- Quick prototypes
- Simple apps without paywalls

## Features

- **Minimal setup** - Only required sections
- **Clean design** - Simple color scheme
- **Fast generation** - Generates in ~5 seconds

## Usage

### Generate from this spec

```bash
cd your-expo-project

# Copy spec
cp node_modules/onboardkit/examples/basic/spec.md ./

# Generate
npx onboardkit generate

# Output in ./onboardkit-output/
```

### What's Generated

**Screens (5):**
- `WelcomeScreen.tsx` - Initial welcome
- `OnboardingStep1.tsx` - Feature highlight
- `OnboardingStep2.tsx` - Feature highlight
- `OnboardingStep3.tsx` - Feature highlight
- `LoginScreen.tsx` - Email, Google, Apple login
- `NameCaptureScreen.tsx` - Name capture form
- `HomeScreen.tsx` - Post-login placeholder

**Navigation:**
- `navigation/stack.tsx` - React Navigation setup
- `navigation/types.ts` - Type-safe navigation

**Theme:**
- `theme/colors.ts` - Color palette
- `theme/typography.ts` - Font styles
- `theme/spacing.ts` - Spacing scale
- `theme/index.ts` - Theme exports

**Components:**
- `components/Button.tsx` - Themed button
- `components/Input.tsx` - Themed text input
- `components/Card.tsx` - Container card

## Customization

### Change colors

Edit the spec's Theme section:

```markdown
## Theme

- Primary: #YOUR_COLOR
- Secondary: #YOUR_COLOR
```

Then regenerate:

```bash
npx onboardkit generate --overwrite
```

### Add more steps

Add more steps under Onboarding Steps:

```markdown
### Step 4

- Title: Fourth Step
- Headline: One More Thing
- Subtext: You'll love this feature
- Image: onboarding-4
```

### Change login methods

Edit the Login section:

```markdown
## Login

- Methods: [email, google]  # Remove apple
- Headline: Sign In
```

## Next Steps

After generating:

1. **Copy to your project**
   ```bash
   cp -r onboardkit-output/* ./src/
   ```

2. **Install dependencies**
   ```bash
   npx expo install @react-navigation/native @react-navigation/native-stack
   ```

3. **Add images**
   Place images in `assets/images/`:
   - `welcome-illustration.png`
   - `onboarding-1.png`
   - `onboarding-2.png`
   - `onboarding-3.png`

4. **Test**
   ```bash
   npx expo start
   ```

## See Also

- [With Paywall Example](../with-paywall/) - Adds soft paywall
- [Full-Featured Example](../full-featured/) - All features
- [Spec Format Guide](../../docs/SPEC-FORMAT.md) - Complete spec documentation
