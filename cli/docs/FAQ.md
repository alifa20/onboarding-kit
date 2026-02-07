# Frequently Asked Questions

Common questions about OnboardKit.

## General

### What is OnboardKit?

OnboardKit is a CLI tool that generates production-ready onboarding screens for React Native/Expo apps from simple markdown specifications. It uses AI to enhance your specs and generate polished TypeScript code.

### Is OnboardKit free?

Yes, OnboardKit is free and open source (MIT license). The "zero-cost AI" feature leverages your existing Claude Pro/Max subscription via OAuth, so you don't pay per API call.

### What platforms are supported?

OnboardKit generates code for:
- **React Native** with Expo (v1.0)
- **Expo** projects

Support for Next.js, Flutter, and other platforms may come based on community interest.

---

## Features & Capabilities

### How does zero-cost AI work?

Instead of charging per API call, OnboardKit uses OAuth 2.0 + PKCE to access AI providers using your existing subscription. If you already have Claude Pro/Max, you can use OnboardKit's AI features at no additional cost.

**Example:**
- You pay: $20/month for Claude Pro (already)
- OnboardKit cost: $0 (uses your existing subscription)
- Alternative tools: $10-50/month additional for AI API access

### What AI providers are supported?

**v1.0:**
- Anthropic Claude (via OAuth)

**Planned:**
- Google Gemini (v1.1)
- GitHub Models (v1.2)
- Ollama local AI (v1.2)

### Can I use my own API keys instead of OAuth?

Not in v1.0. OAuth simplifies authentication and eliminates API key management. API key support may be added based on user feedback.

### What screens can OnboardKit generate?

**v1.0 Templates:**
- Welcome screen
- Onboarding steps (unlimited count)
- Login screen (email, Google, Apple)
- Name capture/signup screen
- Home screen (placeholder)

**Planned (v1.1+):**
- Soft paywall screen
- Hard paywall screen
- Settings screen
- Profile screen
- And more...

### Can I customize the generated code?

Absolutely! Generated code is fully editable TypeScript. Common customizations:

1. **Theme colors** - Edit `theme/colors.ts`
2. **Typography** - Edit `theme/typography.ts`
3. **Component styles** - Modify `StyleSheet.create` in each screen
4. **Business logic** - Add state management, API calls, etc.
5. **Add features** - The generated code is yours to extend

### Can I customize templates?

Yes, via the `eject` command (planned for v1.3):

```bash
onboardkit eject
```

This copies templates to your project where you can modify them. OnboardKit will use your custom templates for future generations.

---

## Usage & Workflow

### Do I need to install OnboardKit?

No! Use `npx` to run without installation:

```bash
npx onboardkit generate
```

Or install globally if you prefer:

```bash
npm install -g onboardkit
onboardkit generate
```

### What's the difference between `generate` and `onboard`?

| Feature | `generate` | `onboard` |
|---------|-----------|----------|
| Speed | Fast (~5 seconds) | Slower (~5-10 minutes) |
| AI Features | No | Yes (validation, enhancement, chat) |
| Offline | Works offline | Requires internet + auth |
| Output | Template-based code | AI-enhanced code |
| Use Case | Quick iterations | Polished final result |

**Recommendation:** Use `generate` during development, `onboard` for final polish.

### Can I use OnboardKit offline?

Yes! The `generate` command works completely offline. Only the `onboard` command requires internet access for AI features.

### How long does generation take?

- **`generate`**: 5-10 seconds
- **`onboard`**: 5-10 minutes (includes AI validation, enhancement, chat)

### Can I pause and resume the workflow?

Yes! Press `Ctrl+C` during `onboard` to save a checkpoint:

```bash
$ onboardkit onboard
Phase 3/7: Spec Repair
^C Interrupted

✓ Checkpoint saved

$ onboardkit onboard
? Resume from Phase 3? › yes
```

---

## Spec Format

### Do I have to write markdown manually?

No! Use the interactive `init` command:

```bash
npx onboardkit init
```

It creates a spec template with helpful prompts. You can also copy example specs from `/examples`.

### What sections are required?

**Required:**
- Project name (H1 heading)
- Config
- Theme
- Welcome Screen
- Onboarding Steps (at least 1)
- Login
- Name Capture

**Optional:**
- Soft Paywall
- Hard Paywall

### How many onboarding steps should I include?

**Best practice: 3 steps**

- Too few (1): Doesn't showcase features well
- Sweet spot (3): Highlights key features without overwhelming
- Too many (7+): Users will skip

Research shows 3-5 steps is optimal for mobile onboarding.

### Can I add custom sections?

Not in v1.0. The spec format is fixed to ensure reliable code generation. Custom sections may be added in future versions based on community requests.

### How do I validate my spec?

```bash
npx onboardkit validate
```

This checks:
- Required sections present
- Valid hex colors
- Proper array syntax
- Type constraints
- Minimum field lengths

---

## Authentication & Security

### Is OAuth authentication required?

Only for AI features (`onboard` command). The `generate` command works without any authentication.

### Where are credentials stored?

Securely in OS-native storage:
- **macOS**: Keychain
- **Linux**: Secret Service (libsecret)
- **Windows**: Credential Manager
- **Fallback**: AES-256-GCM encrypted file (`~/.onboardkit/credentials.json`)

### Can I revoke access?

Yes:

```bash
onboardkit auth revoke
```

This deletes stored credentials and revokes the OAuth token.

### Is my spec data sent to AI providers?

Only during the `onboard` command:
- Spec content is sent for validation and enhancement
- Generated code is NOT sent (stays local)
- All communication over HTTPS
- No data stored by OnboardKit servers (we don't have servers!)

**Privacy:** OnboardKit is a local CLI tool. Your data only goes to the AI provider you authenticate with (e.g., Anthropic).

---

## Generated Code

### Is the generated code production-ready?

Yes! Generated code includes:
- TypeScript strict mode compliance
- Proper type safety
- React Navigation best practices
- Themed components
- Accessibility support
- Prettier formatting

**However**, you should:
- Review and test all code
- Add actual images (placeholders provided)
- Implement authentication logic
- Add error handling for production scenarios
- Test on real devices

### Will generated code conflict with my existing code?

No, if you follow the recommended structure:

```bash
# Generate to separate directory
npx onboardkit generate --output ./src/onboarding

# Then integrate selectively
cp -r src/onboarding/screens/* src/screens/
```

Generated code is self-contained and won't overwrite existing files unless you explicitly copy them.

### How do I update generated code?

**Option 1: Regenerate and merge**

```bash
# Update spec.md
# Regenerate
npx onboardkit generate --output ./new-output

# Manually merge changes
```

**Option 2: Edit generated code directly**

Generated code is yours - edit it like any other source file.

### Can I TypeScript-compile the generated code?

Yes! Generated code uses TypeScript strict mode:

```bash
cd onboardkit-output
tsc --noEmit --strict
# Should complete with no errors
```

### What dependencies does generated code require?

**Required:**
```json
{
  "dependencies": {
    "@react-navigation/native": "^6.x",
    "@react-navigation/native-stack": "^6.x",
    "react-native-screens": "^3.x",
    "react-native-safe-area-context": "^4.x"
  }
}
```

Install with:

```bash
npx expo install @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context
```

---

## Comparison to Alternatives

### OnboardKit vs Manual Coding

| Aspect | OnboardKit | Manual |
|--------|-----------|--------|
| Time | 1 hour | 2-3 days |
| Code Quality | Consistent, typed | Varies |
| Theme System | Auto-generated | Manual setup |
| Navigation | Auto-wired | Manual setup |
| Updates | Regenerate | Refactor manually |

### OnboardKit vs Visual Builders

| Aspect | OnboardKit | Visual Builder |
|--------|-----------|----------------|
| Output | TypeScript source | Vendor-locked JSON/XML |
| Customization | Full control | Limited |
| Cost | Free | $10-50/month |
| Offline | Yes | Usually no |
| Version Control | Markdown (git-friendly) | Binary/JSON (harder) |

### OnboardKit vs Template Libraries

| Aspect | OnboardKit | Template Library |
|--------|-----------|------------------|
| Customization | Spec-driven, AI-enhanced | Copy-paste, manual edit |
| Maintenance | Regenerate on updates | Manual updates |
| Consistency | Enforced by schema | Manual effort |
| Learning Curve | Write markdown | Learn library API |

---

## Roadmap & Future Features

### What's coming in future versions?

**v1.1** (Q1 2026)
- Google Gemini OAuth support
- Soft paywall screen template
- Hard paywall screen template

**v1.2** (Q2 2026)
- GitHub Models support
- Ollama local AI support
- 10+ screen templates

**v1.3** (Q2 2026)
- Template ejection (`eject` command)
- Community template contributions
- Template marketplace

**v1.4** (Q3 2026)
- Interactive chat refinement
- Real-time code preview
- Multi-turn conversations

### Can I suggest features?

Yes! Open a [GitHub Discussion](https://github.com/alifa20/onboarding-kit/discussions) or file a feature request issue.

### Will OnboardKit support Next.js/Flutter?

Maybe! It depends on community interest. File an issue if you'd like to see support for other frameworks.

---

## Contributing & Support

### How can I contribute?

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines. Ways to contribute:
- Report bugs
- Suggest features
- Submit PRs for bug fixes
- Contribute templates
- Improve documentation
- Share example specs

### I found a bug. What should I do?

1. Check [existing issues](https://github.com/alifa20/onboarding-kit/issues)
2. If new, file an issue with:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment (OS, Node version, OnboardKit version)
   - Error logs (run with `--verbose`)

### Where can I get help?

- [GitHub Issues](https://github.com/alifa20/onboarding-kit/issues) - Bug reports
- [GitHub Discussions](https://github.com/alifa20/onboarding-kit/discussions) - Questions
- [Documentation](/docs) - Guides and references
- [Troubleshooting Guide](TROUBLESHOOTING.md) - Common problems

### How do I stay updated?

- Watch the [GitHub repository](https://github.com/alifa20/onboarding-kit)
- Follow [@alifa20](https://twitter.com/alifa20) on Twitter
- Check [CHANGELOG.md](../CHANGELOG.md) for release notes

---

## Licensing & Legal

### What license is OnboardKit under?

MIT License - free for commercial and personal use. See [LICENSE](../LICENSE).

### Can I use OnboardKit for commercial projects?

Yes! OnboardKit is MIT licensed. You can:
- Use in commercial projects
- Modify generated code
- Sell apps built with OnboardKit
- No attribution required (but appreciated!)

### Who owns the generated code?

You do! Generated code is yours to use, modify, and distribute as you see fit. OnboardKit makes no claims to ownership.

### Are there any usage limits?

No limits from OnboardKit. However:
- AI provider rate limits apply (e.g., Claude API rate limits)
- Your Claude subscription tier determines AI feature availability

---

## Performance & Best Practices

### How do I speed up generation?

1. Use `generate` instead of `onboard` for quick iterations
2. Skip optional AI enhancement: `onboard --skip-enhance`
3. Use SSD for output directory
4. Reduce onboarding step count

### What's the recommended workflow?

**Development:**
```bash
# Create spec
npx onboardkit init

# Quick iterations with generate
npx onboardkit generate

# Test in your app
cp -r onboardkit-output/* ./src/
npx expo start
```

**Final polish:**
```bash
# Run full AI workflow
npx onboardkit auth
npx onboardkit onboard

# Copy polished code
cp -r onboardkit-output/* ./src/
```

### Should I commit generated code?

**Yes** - Commit the generated code to your repository. Don't regenerate in CI.

**Also commit:** `spec.md` so others can regenerate if needed.

**Don't commit:**
- `.onboardkit/` (temporary files)
- `onboardkit-output/` before copying to src

---

## Miscellaneous

### Does OnboardKit track usage analytics?

No. OnboardKit is a local CLI tool with zero telemetry. We don't collect any data.

### Can I use OnboardKit in CI/CD?

Yes, but not recommended for AI features (requires OAuth). Use for template generation:

```yaml
# .github/workflows/generate.yml
- run: npx onboardkit generate
```

### What's the bundle size of generated code?

Approximately 8-12 KB per screen (unminified). The complete output (7 screens + navigation + theme + components) is typically 50-100 KB of source code.

### Does OnboardKit work with React Native CLI (non-Expo)?

The generated code is React Native compatible, but templates are optimized for Expo. React Native CLI support may require minor adjustments.

---

## Still have questions?

- Check the [User Guide](USER-GUIDE.md) for detailed tutorials
- See [Troubleshooting](TROUBLESHOOTING.md) for specific problems
- Ask in [GitHub Discussions](https://github.com/alifa20/onboarding-kit/discussions)
- File an [issue](https://github.com/alifa20/onboarding-kit/issues) for bugs

We're here to help!
