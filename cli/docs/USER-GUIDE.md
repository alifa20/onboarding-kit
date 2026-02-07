# User Guide

Step-by-step guide to using OnboardKit to generate onboarding screens for your React Native/Expo app.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Creating Your First Spec](#creating-your-first-spec)
3. [Understanding the Spec Format](#understanding-the-spec-format)
4. [Generating Code](#generating-code)
5. [Integrating into Your Expo Project](#integrating-into-your-expo-project)
6. [Using AI Features](#using-ai-features)
7. [Customizing Generated Code](#customizing-generated-code)
8. [Advanced Usage](#advanced-usage)
9. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

Before using OnboardKit, ensure you have:

- **Node.js >= 22** installed ([download](https://nodejs.org/))
- An existing **Expo** or **React Native** project
- (Optional) **Claude Pro/Max** subscription for AI features

### Verify Installation

```bash
# Check Node.js version
node --version
# Should output: v22.0.0 or higher

# Test OnboardKit (no installation needed)
npx onboardkit --version
```

### Project Setup

OnboardKit works best in your project root:

```bash
cd your-expo-project
```

---

## Creating Your First Spec

### Option 1: Interactive Init

The easiest way to start:

```bash
npx onboardkit init
```

Answer the prompts:

```
? What is your app name? › FitTrack Pro
? Primary color (hex): › #F59E0B
? Secondary color (hex): › #EF4444
? Welcome screen headline: › Your Fitness Journey Starts Here
? Welcome screen subtext: › Track workouts, monitor progress, achieve goals
```

This creates `spec.md` in your current directory.

### Option 2: Copy an Example

Start from a complete example:

```bash
# Download OnboardKit examples
git clone https://github.com/alifa20/onboarding-kit.git
cd onboarding-kit/cli/examples

# Copy example to your project
cp fitness-app.md ~/your-expo-project/spec.md
cd ~/your-expo-project
```

### Option 3: Manual Creation

Create `spec.md` manually:

```markdown
# MyApp

## Config
- Platform: expo
- Navigation: react-navigation
- Styling: stylesheet

## Theme
- Primary: #6366F1
- Secondary: #8B5CF6
- Background: #FFFFFF
- Surface: #F5F5F5
- Text: #000000
- Text Secondary: #666666
- Error: #DC2626
- Success: #10B981
- Font: System
- Border Radius: 12

## Welcome Screen
- Headline: Welcome to MyApp
- Subtext: Get started with the best experience
- Image: welcome-illustration
- CTA: Get Started
- Skip: Skip

## Onboarding Steps

### Step 1
- Title: First Step
- Headline: Discover Features
- Subtext: Learn what makes MyApp special
- Image: onboarding-1

### Step 2
- Title: Second Step
- Headline: Personalize
- Subtext: Customize your experience
- Image: onboarding-2

### Step 3
- Title: Third Step
- Headline: You're Ready!
- Subtext: Let's get started
- Image: onboarding-3

## Login
- Methods: [email, google, apple]
- Headline: Welcome back!

## Name Capture
- Headline: What should we call you?
- Fields: [first_name, last_name]
- CTA: Continue
```

---

## Understanding the Spec Format

### Required Sections

Every spec must include:

1. **Project Name** - H1 heading
2. **Config** - Platform and navigation settings
3. **Theme** - Colors, typography, spacing
4. **Welcome Screen** - First screen shown
5. **Onboarding Steps** - At least 1 step
6. **Login** - Authentication methods
7. **Name Capture** - User signup form

### Optional Sections

Add these for extended functionality:

- **Soft Paywall** - Pre-login feature upsell
- **Hard Paywall** - Post-signup subscription gate

### Key Concepts

**Theme System**

Your theme colors are used throughout:

```markdown
## Theme
- Primary: #F59E0B     # Main brand color (buttons, headers)
- Secondary: #EF4444   # Accent color (highlights, icons)
- Background: #FAFAFA  # Main background
- Surface: #FFFFFF     # Card backgrounds
- Text: #1F2937        # Primary text
- Text Secondary: #9CA3AF  # Muted text
- Error: #DC2626       # Error states
- Success: #059669     # Success states
```

**Navigation Flow**

Generated navigation automatically connects screens:

```
Welcome
  → Onboarding Step 1
  → Onboarding Step 2
  → Onboarding Step 3
  → (Soft Paywall)
  → Login
  → Name Capture
  → (Hard Paywall)
  → Home
```

**Image Placeholders**

Image identifiers are placeholders:

```markdown
- Image: welcome-hero
```

Replace with actual images in your code:

```tsx
<Image source={require('../assets/welcome-hero.png')} />
```

### Best Practices

**Colors:**
- Use your brand colors for Primary and Secondary
- Ensure good contrast (WCAG AA compliance)
- Test in both light and dark mode

**Content:**
- Keep headlines short (3-7 words)
- Make subtext actionable (one sentence)
- Use action verbs in CTAs ("Start", "Join", "Get")

**Onboarding Steps:**
- Limit to 3-5 steps (less is more)
- Each step should highlight one key feature
- Progressive disclosure (simple → complex)

---

## Generating Code

### Quick Generation (No AI)

Fastest way to generate code:

```bash
npx onboardkit generate
```

**What happens:**
1. Reads and validates `spec.md`
2. Renders Handlebars templates
3. Generates TypeScript files
4. Formats with Prettier
5. Writes to `onboardkit-output/`

**Output:**

```
onboardkit-output/
├── screens/
│   ├── WelcomeScreen.tsx
│   ├── OnboardingStep1.tsx
│   ├── OnboardingStep2.tsx
│   ├── OnboardingStep3.tsx
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

### Preview Before Generating

Use dry-run to see what will be created:

```bash
npx onboardkit generate --dry-run
```

Shows file list and sizes without writing.

### Custom Output Directory

Generate to a different location:

```bash
npx onboardkit generate --output ./src/onboarding
```

---

## Integrating into Your Expo Project

### Step 1: Copy Generated Files

```bash
# Copy all generated files to your src directory
cp -r onboardkit-output/* ./src/

# Or copy selectively
cp -r onboardkit-output/screens ./src/
cp -r onboardkit-output/navigation ./src/
cp -r onboardkit-output/theme ./src/
cp -r onboardkit-output/components ./src/
```

### Step 2: Install Dependencies

```bash
npx expo install \
  @react-navigation/native \
  @react-navigation/native-stack \
  react-native-screens \
  react-native-safe-area-context
```

### Step 3: Update App Entry Point

Edit your `App.tsx`:

```tsx
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

### Step 4: Add Image Assets

Replace image placeholders with real images:

```tsx
// Before (generated)
<Image source={{ uri: 'welcome-hero' }} style={styles.image} />

// After (with your asset)
<Image
  source={require('../assets/images/welcome-hero.png')}
  style={styles.image}
/>
```

Place images in your assets folder:

```
assets/
└── images/
    ├── welcome-hero.png
    ├── onboarding-1.png
    ├── onboarding-2.png
    └── onboarding-3.png
```

### Step 5: Test Your App

```bash
npx expo start
```

Press `i` for iOS simulator or `a` for Android emulator.

### Step 6: Customize Styling

The generated theme system makes customization easy:

**Colors** (`theme/colors.ts`):
```typescript
export const colors = {
  primary: '#F59E0B',    // Change these!
  secondary: '#EF4444',
  // ...
};
```

**Typography** (`theme/typography.ts`):
```typescript
export const typography = {
  h1: {
    fontSize: 32,        // Adjust sizes
    fontWeight: '700',
    // ...
  },
};
```

**Spacing** (`theme/spacing.ts`):
```typescript
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,               // Adjust spacing scale
  lg: 24,
  // ...
};
```

---

## Using AI Features

AI features enhance your spec and generated code using your existing Claude subscription.

### Step 1: Authenticate

First-time setup:

```bash
npx onboardkit auth
```

**Flow:**
1. Select provider (Anthropic Claude)
2. Browser opens to Claude OAuth page
3. Log in with your Claude account
4. Authorize OnboardKit
5. Credentials stored securely

### Step 2: Run Full AI Workflow

```bash
npx onboardkit onboard
```

**The 7 Phases:**

**Phase 1: Auth Check**
- Verifies authentication
- Refreshes token if needed

**Phase 2: Spec Check**
- Validates your spec
- Offers to create interactively if missing

**Phase 3: Spec Repair**
- AI detects validation errors
- Suggests fixes
- You approve or modify each fix

**Phase 4: AI Enhancement**
- AI reviews entire spec
- Suggests UX improvements
- Better copy, accessibility hints, flow improvements
- You approve or skip each suggestion

**Phase 5: Generation**
- Generates all code files
- Creates design prompts for Stitch MCP
- Builds screen manifests

**Phase 6: Refinement Chat**
- Interactive chat mode
- Request changes in natural language
- AI modifies files and shows diffs
- You approve or revert each change

**Phase 7: Finalize**
- Formats all code
- Writes files to disk
- Shows summary
- Optionally connects to Stitch MCP for designs

### Example AI Interactions

**Spec Repair:**

```
⚠ Error: theme.primary - Invalid hex color
  Found: "orange"

AI: I'll change this to a proper hex color.
    Based on the word "orange", I suggest: #FF9500

? Apply this fix? › yes
✓ Applied
```

**Enhancement:**

```
AI: I notice your welcome headline is generic: "Welcome"

    Suggested improvement:
    "Welcome to FitTrack Pro - Your Fitness Journey Starts Here"

    This is more engaging and sets clear expectations.

? Apply this enhancement? › yes
✓ Applied
```

**Refinement Chat:**

```
You: Make the welcome button more prominent

AI: I'll increase the button size and add a gradient background.

    Changes:
    + Increased height from 50 to 60
    + Added padding from 16 to 24
    + Added gradient background (primary → secondary)
    + Increased font size from 16 to 18

? Apply these changes? › yes
✓ Applied to screens/WelcomeScreen.tsx

You: Add a subtle shadow to cards

AI: I'll add elevation for Android and shadow for iOS.

    Modified: components/Card.tsx
    ...
```

### Skipping AI Phases

Skip enhancement if you want:

```bash
npx onboardkit onboard --skip-enhance
```

### Resume After Interruption

Press `Ctrl+C` to pause:

```
^C Workflow interrupted
✓ Checkpoint saved at Phase 4/7

Run 'onboardkit onboard' to resume
```

Resume later:

```bash
npx onboardkit onboard

? Found checkpoint. Continue from Phase 4? › yes
Resuming...
```

---

## Customizing Generated Code

### Method 1: Edit Theme Files

Quickest way to customize appearance:

**Colors:**
```typescript
// theme/colors.ts
export const colors = {
  primary: '#YOUR_COLOR',
  secondary: '#YOUR_COLOR',
  // ...
};
```

**Typography:**
```typescript
// theme/typography.ts
export const typography = {
  h1: {
    fontSize: 36,              // Adjust sizes
    fontFamily: 'YourFont',    // Use custom fonts
  },
};
```

### Method 2: Modify Screen Components

Generated screens are fully editable TypeScript:

```tsx
// screens/WelcomeScreen.tsx
export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* Add custom content here */}
      <YourCustomComponent />

      <Text style={styles.headline}>Welcome</Text>

      {/* Modify existing elements */}
      <Pressable
        style={[styles.button, styles.customButton]}  // Add styles
        onPress={handleCustomAction}                   // Change behavior
      >
        <Text style={styles.buttonText}>Get Started</Text>
      </Pressable>
    </View>
  );
};
```

### Method 3: Extend Components

Add features to shared components:

```tsx
// components/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';     // Add new prop
  onPress: () => void;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',                          // Handle new prop
  onPress,
  children
}) => {
  return (
    <Pressable
      style={[
        styles.button,
        styles[variant],
        styles[size]                        // Apply size styles
      ]}
      onPress={onPress}
    >
      {children}
    </Pressable>
  );
};
```

### Method 4: Add New Screens

Follow the same pattern as generated screens:

```tsx
// screens/SettingsScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../theme';

export const SettingsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
});
```

Add to navigation:

```tsx
// navigation/stack.tsx
<Stack.Screen
  name="Settings"
  component={SettingsScreen}
/>
```

---

## Advanced Usage

### Custom Spec Validation

Validate before generating:

```bash
npx onboardkit validate --verbose
```

Fix errors, then regenerate.

### Multiple Spec Variants

Maintain different specs for different flows:

```bash
# Onboarding for new users
npx onboardkit generate --spec onboarding-new.md --output ./src/onboarding-new

# Onboarding for existing users
npx onboardkit generate --spec onboarding-existing.md --output ./src/onboarding-existing
```

### Version Control

Add to `.gitignore`:

```gitignore
# OnboardKit
.onboardkit/
onboardkit-output/
```

Commit `spec.md`:

```bash
git add spec.md
git commit -m "feat: add onboarding spec"
```

Regenerate on each machine:

```bash
npx onboardkit generate
```

### CI/CD Integration

Generate in CI for consistency:

```yaml
# .github/workflows/generate.yml
name: Generate Onboarding
on: [push]

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 22
      - run: npx onboardkit generate
      - run: git diff --exit-code src/
```

---

## Troubleshooting

### Generation Fails

**Symptom:** `onboardkit generate` errors

**Solution:**

```bash
# Validate spec first
npx onboardkit validate --verbose

# Check for common issues:
# - Invalid hex colors (#RRGGBB format)
# - Missing required fields
# - Empty arrays
```

### TypeScript Errors in Generated Code

**Symptom:** Generated files have type errors

**Solution:**

```bash
# Regenerate with verbose logging
npx onboardkit generate --verbose

# If errors persist, report issue:
# Include error message and spec.md
```

### Styles Don't Look Right

**Symptom:** Generated screens look different than expected

**Solution:**

Check theme values:

```typescript
// theme/colors.ts - Verify colors are correct
// theme/typography.ts - Check font sizes
// theme/spacing.ts - Verify spacing scale
```

Adjust and rebuild:

```bash
npx expo start --clear
```

### OAuth Timeout

**Symptom:** Authentication times out

**Solution:**

```bash
# Check network connection
ping anthropic.com

# Try again with longer timeout
ONBOARDKIT_TIMEOUT=300000 npx onboardkit auth
```

### Images Not Showing

**Symptom:** Image placeholders don't display

**Solution:**

Replace placeholders with actual assets:

```tsx
// Before
<Image source={{ uri: 'welcome-hero' }} />

// After
<Image source={require('../assets/welcome-hero.png')} />
```

### Navigation Errors

**Symptom:** Navigation doesn't work

**Solution:**

Ensure dependencies installed:

```bash
npx expo install @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context
```

Check `App.tsx` setup:

```tsx
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

---

## Next Steps

Now that you've completed the user guide:

1. **Create Your Spec** - Run `npx onboardkit init`
2. **Generate Code** - Run `npx onboardkit generate`
3. **Integrate** - Copy files to your Expo project
4. **Customize** - Adjust theme and content
5. **Ship** - Deploy your polished onboarding flow

## Additional Resources

- [CLI Reference](CLI-REFERENCE.md) - Complete command documentation
- [Spec Format Guide](SPEC-FORMAT.md) - Detailed spec syntax
- [FAQ](FAQ.md) - Common questions
- [Troubleshooting](TROUBLESHOOTING.md) - Detailed problem solving
- [GitHub Issues](https://github.com/alifa20/onboarding-kit/issues) - Report bugs

Happy building!
