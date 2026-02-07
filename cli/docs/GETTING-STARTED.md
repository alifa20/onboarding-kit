# Getting Started with OnboardKit

Quick start guide to get you up and running in minutes.

## What is OnboardKit?

OnboardKit is a CLI tool that generates production-ready onboarding screens for React Native/Expo apps from simple markdown specifications. No boilerplate, no repetitive coding—just write a spec and generate polished TypeScript components.

## 5-Minute Quick Start

### 1. Create Your Spec (2 minutes)

```bash
cd your-expo-project
npx onboardkit init
```

Answer a few questions:
- App name: `MyApp`
- Primary color: `#6366F1`
- Secondary color: `#8B5CF6`
- Welcome headline: `Welcome to MyApp`
- Welcome subtext: `Get started now`

This creates `spec.md` with a complete template.

### 2. Generate Code (30 seconds)

```bash
npx onboardkit generate
```

Creates `onboardkit-output/` with 15+ TypeScript files.

### 3. Integrate (2 minutes)

```bash
# Copy generated files
cp -r onboardkit-output/* ./src/

# Install dependencies
npx expo install @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context

# Update App.tsx
```

Edit `App.tsx`:

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

### 4. Run Your App (30 seconds)

```bash
npx expo start
```

Press `i` for iOS or `a` for Android.

**You're done!** You now have fully functional onboarding screens.

---

## What Just Happened?

OnboardKit generated:

**Screens:**
- ✅ Welcome screen with your branding
- ✅ 3 onboarding step screens
- ✅ Login screen (email, Google, Apple)
- ✅ Name capture/signup screen
- ✅ Home screen placeholder

**Infrastructure:**
- ✅ React Navigation setup (type-safe!)
- ✅ Complete theme system (colors, typography, spacing)
- ✅ Shared components (Button, Input, Card)
- ✅ Properly typed TypeScript throughout

All in under 5 minutes.

---

## Next Steps

### Customize Your Screens

The easiest way is to edit the theme:

```typescript
// src/theme/colors.ts
export const colors = {
  primary: '#YOUR_BRAND_COLOR',
  secondary: '#YOUR_ACCENT_COLOR',
  // ...
};
```

Changes apply immediately across all screens.

### Add Real Images

Replace image placeholders:

```tsx
// Before (generated)
<Image source={{ uri: 'welcome-illustration' }} />

// After (with your asset)
<Image source={require('../assets/welcome-illustration.png')} />
```

### Customize Content

Edit any generated file—they're yours to modify:

```tsx
// src/screens/WelcomeScreen.tsx
<Text style={styles.headline}>
  Your Custom Headline
</Text>
```

### Add More Screens

Edit `spec.md` and regenerate:

```markdown
### Step 4

- Title: New Feature
- Headline: Check This Out
- Subtext: An amazing new feature
- Image: feature-4
```

Then:

```bash
npx onboardkit generate --overwrite
```

---

## Understanding the Spec

Your `spec.md` file controls everything. Here's the structure:

```markdown
# ProjectName           ← App name

## Config               ← Platform settings
- Platform: expo
- Navigation: react-navigation
- Styling: stylesheet

## Theme                ← Your brand colors
- Primary: #6366F1
- Secondary: #8B5CF6
- ...

## Welcome Screen       ← First screen
- Headline: ...
- Subtext: ...
- CTA: Get Started

## Onboarding Steps     ← Feature highlights
### Step 1
- Title: ...
- Headline: ...

## Login                ← Auth screen
- Methods: [email, google, apple]

## Name Capture         ← Signup form
- Fields: [first_name, last_name]
```

Each section generates a corresponding screen.

**Required sections:** Config, Theme, Welcome Screen, Onboarding Steps (1+), Login, Name Capture

**Optional sections:** Soft Paywall, Hard Paywall

Full documentation: [Spec Format Guide](SPEC-FORMAT.md)

---

## Common Workflows

### Quick Iteration

During development, use template-only generation:

```bash
# Edit spec.md
# Then regenerate (fast, no AI)
npx onboardkit generate --overwrite
```

### AI-Enhanced Final Polish

When ready to ship, use the full AI workflow:

```bash
# First-time: authenticate
npx onboardkit auth

# Run full 7-phase workflow
npx onboardkit onboard
```

This adds AI validation, UX enhancement, and refinement.

### Validate Before Generating

Check your spec is valid:

```bash
npx onboardkit validate

# Detailed output
npx onboardkit validate --verbose
```

---

## Examples

OnboardKit includes 3 complete examples:

### 1. Basic Example

Minimal onboarding (no paywalls):

```bash
cp node_modules/onboardkit/examples/basic/spec.md ./
npx onboardkit generate
```

[See Basic Example README](../examples/basic/README.md)

### 2. With Paywall Example

Adds skippable soft paywall:

```bash
cp node_modules/onboardkit/examples/with-paywall/spec.md ./
npx onboardkit generate
```

[See With Paywall Example README](../examples/with-paywall/README.md)

### 3. Full-Featured Example

All features (soft + hard paywalls):

```bash
cp node_modules/onboardkit/examples/full-featured/spec.md ./
npx onboardkit generate
```

[See Full-Featured Example README](../examples/full-featured/README.md)

---

## Troubleshooting

### "Node version too old"

OnboardKit requires Node.js >= 22:

```bash
node --version  # Check version
# Visit https://nodejs.org/ to update
```

### "Spec validation failed"

Common issues:

**Invalid hex color:**
```markdown
# Wrong
- Primary: blue

# Correct
- Primary: #0000FF
```

**Missing required field:**

Check all required sections are present. Run:

```bash
npx onboardkit validate --verbose
```

### "TypeScript errors in generated code"

Usually means spec validation issue. Run:

```bash
npx onboardkit validate
```

If valid spec still generates errors, please [file an issue](https://github.com/alifa20/onboarding-kit/issues).

### More Help

- [Troubleshooting Guide](TROUBLESHOOTING.md) - Detailed solutions
- [FAQ](FAQ.md) - Common questions
- [GitHub Issues](https://github.com/alifa20/onboarding-kit/issues) - Report bugs

---

## Learning More

### Documentation

- **[User Guide](USER-GUIDE.md)** - Complete step-by-step tutorial
- **[CLI Reference](CLI-REFERENCE.md)** - All commands and options
- **[Spec Format](SPEC-FORMAT.md)** - Complete spec syntax
- **[API Documentation](API.md)** - Programmatic usage
- **[Architecture](ARCHITECTURE.md)** - Technical deep dive

### Videos & Demos

- Terminal demo GIF (in README.md)
- Example output screenshots
- Step-by-step video tutorial (coming soon)

### Community

- [GitHub Discussions](https://github.com/alifa20/onboarding-kit/discussions) - Ask questions
- [GitHub Issues](https://github.com/alifa20/onboarding-kit/issues) - Report bugs
- [Twitter](https://twitter.com/alifa20) - Updates and tips

---

## What's Next?

After your first successful generation:

1. **Customize the theme** - Match your brand
2. **Add real images** - Replace placeholders
3. **Implement auth** - Wire up actual login
4. **Add analytics** - Track user flow
5. **Test on devices** - iOS and Android
6. **Ship it!** - Deploy to stores

---

## Tips & Best Practices

### Theme Colors

- Use your actual brand colors
- Ensure good contrast (check WCAG AA)
- Test in both light and dark mode

### Onboarding Steps

- Keep to 3-5 steps (less is more)
- Focus on benefits, not features
- Use action-oriented copy
- Make each step visually distinct

### Content Writing

- **Headlines:** 3-7 words, action-oriented
- **Subtext:** One sentence, clear value
- **CTAs:** Specific actions ("Start Training" > "Continue")

### Navigation Flow

Recommended flow:
```
Welcome → Steps → (Soft Paywall) → Login → Signup → (Hard Paywall) → Home
```

### Version Control

Commit your spec:

```bash
git add spec.md
git commit -m "feat: add onboarding spec"
```

Don't commit `onboardkit-output/` - regenerate as needed.

---

## Getting Help

**Stuck?** We're here to help:

1. Check [Troubleshooting Guide](TROUBLESHOOTING.md)
2. Search [GitHub Issues](https://github.com/alifa20/onboarding-kit/issues)
3. Ask in [GitHub Discussions](https://github.com/alifa20/onboarding-kit/discussions)
4. File a [bug report](https://github.com/alifa20/onboarding-kit/issues/new?template=bug_report.md)

Most questions are answered in 24 hours.

---

## What You've Learned

You now know how to:
- ✅ Create a spec with `init`
- ✅ Generate code with `generate`
- ✅ Integrate into your Expo project
- ✅ Customize theme and content
- ✅ Use examples for different use cases

**Ready to build something amazing?**

```bash
npx onboardkit init
```

Happy building!

---

**Next:** [User Guide](USER-GUIDE.md) for detailed tutorials

**Quick Reference:** [CLI Reference](CLI-REFERENCE.md) for all commands
