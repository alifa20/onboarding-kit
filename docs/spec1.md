**OnboardKit**

Generate production-ready mobile onboarding UI from markdown

Full Project Plan  
v1.0 — February 2026

Open Source • MIT License • `npx onboardkit onboard`

# **1\. Executive Summary**

OnboardKit is an open-source CLI tool that generates production-ready mobile onboarding screens from a simple markdown specification file. Users describe their onboarding flow, screens, theme, and content in markdown, then run a single command to get a complete set of Expo/React Native components with proper navigation, theming, and flow logic.

| Core Command: npx onboardkit onboard Platform: Expo (React Native) Styling: React Native StyleSheet (no external CSS frameworks) AI: Free models via OAuth (Claude, Gemini, GitHub Models, Ollama) License: MIT |
| :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

The tool differentiates itself through:

- Zero-cost AI — OAuth into existing subscriptions, no API bills

- Markdown-first — designers and PMs can write the spec, not just developers

- Opinionated flow — the Welcome → Onboarding → Paywall → Auth → Home pattern covers 90% of apps

- Working code output — real TypeScript components, not wireframes or mockups

- Chat refinement — iterate on generated screens via terminal chat

- Checkpoint system — stop and resume at any point

# **2\. The Onboarding Flow**

OnboardKit generates screens following a standard mobile onboarding pattern. This flow covers the vast majority of consumer mobile applications and is the default state machine that gets generated.

## **2.1 Flow Diagram**

The default navigation state machine:

| WELCOME SCREEN ├─ \[Skip\] → Login / Sign In └─ \[Next\] → Onboarding Step 1 → Step 2 → ... → Step N │ SOFT PAYWALL └─ \[Next\] → Login / Sign In LOGIN / SIGN IN ├─ \[Existing User\] → Home └─ \[New User\] → Name Capture → \[Create Account\] → Home HOME └─ \[If not subscribed\] → Hard Paywall |
| :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

## **2.2 Screen Descriptions**

| Screen                 | Purpose                                      | Navigation                                        |
| :--------------------- | :------------------------------------------- | :------------------------------------------------ |
| Welcome                | First impression, hero image, app value prop | Next → Step 1, Skip → Login                       |
| Onboarding Steps (1–N) | Feature highlights with illustrations        | Next/Back between steps, last step → Soft Paywall |
| Soft Paywall           | Optional subscription pitch before login     | Next → Login, Skip → Login                        |
| Login / Sign In        | Email, Google, Apple authentication          | Existing user → Home, New user → Name Capture     |
| Name Capture           | Collect user’s name for new accounts         | Next → Create Account → Home                      |
| Home                   | Main app screen (placeholder)                | If \!subscribed → Hard Paywall                    |
| Hard Paywall           | Mandatory subscription gate with plans       | Subscribe → Home, Restore Purchase                |

# **3\. Input Format (Markdown Spec)**

The user provides a structured markdown file (spec.md) that describes their entire onboarding flow. The CLI parses this into a typed configuration object validated against a Zod schema.

## **3.1 Spec Structure**

| Section               | Required | Description                                       |
| :-------------------- | :------- | :------------------------------------------------ |
| \# Project Name       | Yes      | The app name, used in generated file headers      |
| \#\# Config           | Yes      | Platform (expo), navigation lib, styling approach |
| \#\# Theme            | Yes      | Colors, font, border radius, spacing scale        |
| \#\# Welcome Screen   | Yes      | Headline, subtext, image, CTA, skip text          |
| \#\# Onboarding Steps | Yes      | 1–N steps with headline, subtext, image each      |
| \#\# Soft Paywall     | Optional | Features list, pricing, CTA, skip option          |
| \#\# Login            | Yes      | Auth methods (email, google, apple)               |
| \#\# Name Capture     | Yes      | Fields to collect, CTA text                       |
| \#\# Hard Paywall     | Optional | Plans, pricing, features, restore purchase        |

## **3.2 Example Spec File**

A complete example for a finance app:

`# MyFinanceApp Onboarding`

`## Config`

`- Platform: expo`

`- Navigation: react-navigation`

`- Styling: stylesheet`

`## Theme`

`- Primary: #6C5CE7`

`- Secondary: #A29BFE`

`- Background: #FFFFFF`

`- Surface: #F8F9FA`

`- Text: #2D3436`

`- TextSecondary: #636E72`

`- Error: #E17055`

`- Success: #00B894`

`- Font: Inter`

`- BorderRadius: 16`

`## Welcome Screen`

`- Headline: "Welcome to MyFinanceApp"`

`- Subtext: "Your personal finance companion"`

`- Image: wallet-hero.png`

`- CTA: "Get Started"`

`- Skip: "I already have an account"`

`## Onboarding Steps`

`### Step 1 - Track Spending`

`- Headline: "Track Every Dollar"`

`- Subtext: "Automatically categorize transactions"`

`- Image: tracking-illustration.png`

`### Step 2 - Set Budgets`

`- Headline: "Smart Budgets"`

`- Subtext: "AI-powered budgets that adapt"`

`- Image: budget-illustration.png`

`## Soft Paywall`

`- Headline: "Unlock Premium"`

`- Subtext: "Start your 7-day free trial"`

`- Features:`

`- "Unlimited accounts"`

`- "AI insights"`

`- "Export to CSV"`

`- "Priority support"`

`- CTA: "Start Free Trial"`

`- Skip: "Continue with Free"`

`- Price: "$9.99/month"`

`## Login`

`- Methods: [email, google, apple]`

`- Headline: "Welcome Back"`

`## Name Capture`

`- Headline: "What should we call you?"`

`- Fields: [first_name, last_name]`

`- CTA: "Create Account"`

`## Hard Paywall`

`- Headline: "Go Premium"`

`- Plans:`

`- Monthly: "$9.99/month"`

`- Yearly: "$79.99/year (save 33%)"`

`- CTA: "Subscribe Now"`

`- Restore: "Restore Purchase"`

# **4\. CLI Commands**

OnboardKit provides a primary guided command (onboard) and individual commands for power users who want to run specific phases independently.

## **4.1 Primary Command**

| npx onboardkit onboard The main command. Walks the user through the entire process: auth check → spec validation → spec repair → AI enhancement → generation → refinement Supports checkpoints so the user can stop and resume at any point. |
| :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

## **4.2 All Commands**

| Command                                 | Description                              | When to Use                        |
| :-------------------------------------- | :--------------------------------------- | :--------------------------------- |
| `npx onboardkit onboard`                | Full guided walkthrough with checkpoints | Default — recommended for everyone |
| `npx onboardkit init`                   | Create spec.md template \+ config file   | Starting a new project             |
| `npx onboardkit auth`                   | Connect an AI provider via OAuth         | First-time setup                   |
| `npx onboardkit auth status`            | Show connected providers                 | Checking auth state                |
| `npx onboardkit auth switch <provider>` | Switch active AI provider                | Changing providers                 |
| `npx onboardkit validate`               | Validate spec.md against schema          | Quick spec check                   |
| `npx onboardkit generate`               | Generate from templates (no AI)          | Offline / template-only mode       |
| `npx onboardkit chat`                   | Open chat to refine existing output      | Post-generation tweaks             |
| `npx onboardkit reset`                  | Clear all checkpoints                    | Starting over                      |
| `npx onboardkit eject`                  | Copy templates locally for customization | Advanced customization             |

# **5\. The Onboard Command (Detailed)**

The onboard command is the heart of OnboardKit. It walks the user through 7 phases, each with a checkpoint so progress is never lost.

## **5.1 Phase Overview**

| Phase | Name           | What Happens                                                      | Checkpoint    |
| :---- | :------------- | :---------------------------------------------------------------- | :------------ |
| 1     | Auth Check     | Verify AI provider is connected. If not, run OAuth flow.          | auth-done     |
| 2     | Spec Check     | Look for spec.md. If missing, create from guided chat.            | spec-ready    |
| 3     | Spec Repair    | Parse and validate spec. Chat to fix any issues.                  | spec-valid    |
| 4     | AI Enhancement | AI reviews spec, suggests UX improvements. User approves/rejects. | spec-enhanced |
| 5     | Generation     | Generate all screens, navigator, theme, hooks from spec.          | generated     |
| 6     | Refinement     | Interactive chat to tweak generated screens.                      | refined       |
| 7     | Finalize       | Format code, copy to output directory, print instructions.        | complete      |

## **5.2 Phase Details**

**Phase 1: Auth Check**

- Check if an AI provider is configured in \~/.onboardkit/credentials.json

- If not, present provider selection menu and run the appropriate OAuth flow

- Verify the token is valid by making a test API call

- Save checkpoint: auth-done

**Phase 2: Spec Check**

- Look for spec.md in the current directory (or path from config)

- If not found, ask: create from template or build interactively via chat?

- If building via chat, AI asks questions about the app and generates spec.md

- Save checkpoint: spec-ready

**Phase 3: Spec Repair**

- Parse spec.md with unified/remark into AST

- Validate against Zod schema

- For each validation error, enter chat mode with the user

- AI suggests fixes (e.g., "You’re missing a secondary color. How about \#A29BFE?")

- User approves or provides alternative

- Write fixes directly to spec.md

- Re-validate until all errors are resolved

- Save checkpoint: spec-valid

**Phase 4: AI Enhancement**

- AI reads the complete, valid spec

- Suggests UX improvements: better copy, missing screens, accessibility hints

- Each suggestion presented individually — user approves or skips

- Approved changes written to spec.md

- User can skip this entire phase

- Save checkpoint: spec-enhanced

**Phase 5: Generation**

- Read the final spec into a typed OnboardingSpec object

- For each screen, render the Handlebars template with spec data

- Generate navigation state machine (OnboardingNavigator.tsx)

- Generate theme files (colors, typography, spacing)

- Generate hooks (useOnboardingFlow, useAuth, useSubscription)

- Generate shared components (ProgressDots, PaywallFeatureRow, etc.)

- If \--ai flag or AI mode, AI reviews each component and can enhance

- Save checkpoint: generated

**Phase 6: Refinement Chat**

- Enter interactive chat mode

- Full context: the spec \+ all generated files loaded into AI context

- User can request changes: "make the paywall more aggressive", "add a progress bar"

- AI modifies the relevant files and shows diffs

- Each change auto-saves a checkpoint

- User says "done" to exit

- Save checkpoint: refined

**Phase 7: Finalize**

- Run prettier on all generated files

- Copy to ./onboardkit-output/ directory

- Print summary of generated files

- Print next steps: "Run npx expo start to preview"

- Save checkpoint: complete

## **5.3 Checkpoint System**

Checkpoints are stored at .onboardkit/checkpoint.json in the project directory. They track the current phase, generated files, chat history, and user decisions.

**Checkpoint data structure:**

`{`

`"phase": "spec-valid",`

`"timestamp": "2026-02-07T10:30:00Z",`

`"specHash": "a1b2c3...",`

`"generatedFiles": [`

    `"screens/WelcomeScreen.tsx",`

    `"screens/OnboardingStep1.tsx"`

`],`

`"chatHistory": [`

    `{ "role": "user", "content": "add priority support" },`

    `{ "role": "assistant", "content": "Done. Updated spec.md" }`

`],`

`"decisions": {`

    `"secondaryColor": "#A29BFE",`

    `"loginMethods": ["email", "google", "apple"]`

`}`

`}`

**Resume behavior:**

- On running onboard, check for existing checkpoint

- If found, prompt: Continue / Start over (keep spec) / Start fresh

- If spec.md hash changed since checkpoint, warn user and offer to re-validate

- Chat history is preserved so AI has context of previous decisions

# **6\. AI System**

## **6.1 Provider Architecture**

OnboardKit supports multiple AI providers through a unified interface. All providers that support OAuth use browser-based authentication — no API keys to manage.

| Provider         | Auth Method       | Cost               | Notes                               |
| :--------------- | :---------------- | :----------------- | :---------------------------------- |
| Anthropic Claude | OAuth 2.0 \+ PKCE | Free with Pro/Max  | Best code generation quality        |
| Google Gemini    | OAuth 2.0         | Free tier (15 RPM) | Good quality, generous free tier    |
| GitHub Models    | Device Flow       | Free tier          | Access to multiple models           |
| Ollama           | None (local)      | Free               | No signup, runs locally             |
| Manual API Key   | Key paste         | Varies             | Fallback for Groq, OpenRouter, etc. |

## **6.2 OAuth Implementation**

**Anthropic Claude (OAuth 2.0 \+ PKCE)**

- Generate PKCE code_verifier and code_challenge

- Open browser to console.anthropic.com/oauth/authorize

- User grants access to their Pro/Max subscription

- Redirect to localhost callback, capture auth code

- Exchange code for access \+ refresh tokens

- Store tokens securely in OS keychain

- Auto-refresh on expiry

**Google Gemini (OAuth 2.0)**

- Same PKCE flow targeting accounts.google.com

- Scope: generative-language API access

- Free tier: 15 requests/minute, 1M tokens/day

**GitHub Models (Device Flow)**

- CLI displays a code (e.g., ABCD-1234)

- User enters code at github.com/login/device

- CLI polls for completion — no local server needed

- Access to GitHub Models marketplace (multiple free models)

**Ollama (Local)**

- Ping localhost:11434 to verify Ollama is running

- No authentication required

- User selects model from installed list

- Fully private, unlimited usage

## **6.3 Credential Storage**

| Platform | Storage                                           |
| :------- | :------------------------------------------------ |
| macOS    | Keychain (via keytar)                             |
| Linux    | libsecret (via keytar)                            |
| Windows  | Credential Manager (via keytar)                   |
| Fallback | Encrypted file at \~/.onboardkit/credentials.json |

## **6.4 AI Prompts**

The AI system uses four specialized prompt chains:

| Prompt   | Phase           | Purpose                                                    |
| :------- | :-------------- | :--------------------------------------------------------- |
| Repair   | Spec Repair     | Given validation errors, suggest fixes in the user’s style |
| Enrich   | AI Enhancement  | Review a complete spec and suggest UX improvements         |
| Generate | Generation      | Review generated components, add animations/accessibility  |
| Refine   | Refinement Chat | Modify specific files based on user chat requests          |

# **7\. Generated Output**

All generated code targets Expo with React Native StyleSheet. No external CSS frameworks. Components use functional components with TypeScript.

## **7.1 Output Directory Structure**

`onboardkit-output/`

`screens/`

    `WelcomeScreen.tsx`

    `OnboardingStep1.tsx`

    `OnboardingStep2.tsx`

    `OnboardingStep3.tsx`

    `SoftPaywall.tsx`

    `LoginScreen.tsx`

    `NameCaptureScreen.tsx`

    `HardPaywall.tsx`

    `HomeScreen.tsx`

`navigation/`

    `OnboardingNavigator.tsx`

    `types.ts`

`theme/`

    `colors.ts`

    `typography.ts`

    `spacing.ts`

    `index.ts`

`hooks/`

    `useOnboardingFlow.ts`

    `useAuth.ts`

    `useSubscription.ts`

`components/`

    `ProgressDots.tsx`

    `OnboardingLayout.tsx`

    `PaywallFeatureRow.tsx`

    `SocialLoginButton.tsx`

## **7.2 Code Style**

All generated components follow these conventions:

- Functional components with TypeScript

- React Native StyleSheet.create for all styles

- Theme values imported from ../theme (never hardcoded colors/sizes)

- React Navigation for screen transitions

- Expo-compatible imports only

- Formatted with Prettier

- No third-party UI libraries — everything is built from primitives

## **7.3 Example: Generated WelcomeScreen**

What a generated screen looks like:

`import React from 'react';`

`import { View, Text, Image, Pressable, StyleSheet } from 'react-native';`

`import { useNavigation } from '@react-navigation/native';`

`import { colors, typography, spacing } from '../theme';`

`export default function WelcomeScreen() {`

`const navigation = useNavigation();`

`return (`

    `<View style={styles.container}>`

      `<Image`

        `source={require('../assets/wallet-hero.png')}`

        `style={styles.image}`

        `resizeMode="contain"`

      `/>`

      `<Text style={styles.headline}>Welcome to MyApp</Text>`

      `<Text style={styles.subtext}>`

        `Your personal finance companion`

      `</Text>`

      `<Pressable`

        `style={styles.cta}`

        `onPress={() => navigation.navigate('OnboardingStep1')}`

      `>`

        `<Text style={styles.ctaText}>Get Started</Text>`

      `</Pressable>`

      `<Pressable onPress={() => navigation.navigate('Login')}>`

        `<Text style={styles.skipText}>`

          `I already have an account`

        `</Text>`

      `</Pressable>`

    `</View>`

`);`

`}`

`const styles = StyleSheet.create({`

`container: {`

    `flex: 1,`

    `backgroundColor: colors.background,`

    `alignItems: 'center',`

    `justifyContent: 'center',`

    `paddingHorizontal: spacing.xl,`

`},`

`headline: {`

    `...typography.h1,`

    `color: colors.text,`

    `textAlign: 'center',`

`},`

`// ... more styles`

`});`

# **8\. Tech Stack**

| Layer             | Package                                       | Why                                            |
| :---------------- | :-------------------------------------------- | :--------------------------------------------- |
| CLI Prompts       | @clack/prompts                                | Beautiful terminal UI, simple API              |
| CLI Commands      | commander                                     | Industry standard CLI framework                |
| MD Parsing        | unified \+ remark-parse \+ remark-frontmatter | Robust, extensible markdown parser             |
| Schema Validation | zod                                           | Type-safe validation with TypeScript inference |
| Templating        | handlebars                                    | Proven, simple template engine                 |
| AI (Anthropic)    | @anthropic-ai/sdk                             | Official Claude SDK                            |
| AI (Google)       | @google/generative-ai                         | Official Gemini SDK                            |
| Secure Storage    | keytar                                        | OS-native keychain access                      |
| Code Formatting   | prettier                                      | Format generated TypeScript                    |
| Build             | tsup                                          | Fast TypeScript bundler                        |
| OAuth HTTP        | node:http (built-in)                          | Zero-dep local callback server                 |

Total: approximately 10 production dependencies. No monorepo tooling required.

# **9\. Project Structure**

Single package, flat structure. No monorepo.

`onboardkit/`

`src/`

    `index.ts                       # CLI entry (commander)`

    `commands/`

      `onboard.ts                   # the main guided command`

      `init.ts`

      `auth.ts`

      `generate.ts`

      `chat.ts`

      `validate.ts`

      `reset.ts`

      `eject.ts`

    `phases/                         # onboard command phases`

      `auth-check.ts`

      `spec-check.ts`

      `spec-repair.ts`

      `spec-enhance.ts`

      `generation.ts`

      `refinement.ts`

      `finalize.ts`

    `parser/`

      `markdown.ts                   # MD to structured spec`

      `schema.ts                     # Zod schemas`

      `validator.ts                  # validation rules`

    `generator/`

      `engine.ts                     # template rendering`

      `writer.ts                     # file output`

    `ai/`

      `client.ts                     # unified AI interface`

      `providers/`

        `anthropic.ts`

        `google.ts`

        `github.ts`

        `ollama.ts`

        `apikey.ts`

        `types.ts`

      `prompts/`

        `enrich.ts`

        `generate.ts`

        `repair.ts`

        `refine.ts`

      `chat.ts                       # chat loop`

    `auth/`

      `oauth.ts                      # shared PKCE utilities`

      `store.ts                      # credential storage`

      `manager.ts                    # provider selection`

    `checkpoint/`

      `store.ts                      # read/write checkpoints`

      `resume.ts                     # resume logic`

    `utils/`

      `logger.ts`

      `format.ts`

`templates/`

    `expo/                            # Expo + StyleSheet templates`

      `screens/`

        `WelcomeScreen.tsx.hbs`

        `OnboardingStep.tsx.hbs`

        `SoftPaywall.tsx.hbs`

        `LoginScreen.tsx.hbs`

        `NameCaptureScreen.tsx.hbs`

        `HardPaywall.tsx.hbs`

        `HomeScreen.tsx.hbs`

      `navigation/`

        `OnboardingNavigator.tsx.hbs`

        `types.ts.hbs`

      `theme/`

        `colors.ts.hbs`

        `typography.ts.hbs`

        `spacing.ts.hbs`

        `index.ts.hbs`

      `hooks/`

        `useOnboardingFlow.ts.hbs`

        `useAuth.ts.hbs`

        `useSubscription.ts.hbs`

      `components/`

        `ProgressDots.tsx.hbs`

        `OnboardingLayout.tsx.hbs`

        `PaywallFeatureRow.tsx.hbs`

        `SocialLoginButton.tsx.hbs`

    `nextjs/                          # future`

`examples/`

    `fitness-app.md`

    `saas-app.md`

    `finance-app.md`

`package.json`

`tsconfig.json`

`tsup.config.ts`

`README.md`

`CONTRIBUTING.md`

`LICENSE`

# **10\. Roadmap**

| Version | Milestone       | What Ships                                                                              | Effort   |
| :------ | :-------------- | :-------------------------------------------------------------------------------------- | :------- |
| v0.1.0  | Template MVP    | init, generate (template-only, no AI), Expo \+ StyleSheet output, Zod schema, MD parser | 4–5 days |
| v0.2.0  | Auth System     | auth command, Anthropic OAuth \+ PKCE, Gemini OAuth, credential storage (keytar)        | 3–4 days |
| v0.3.0  | Onboard Command | Full guided flow with 7 phases, checkpoint system, resume logic                         | 4–5 days |
| v0.4.0  | AI Integration  | Spec repair via chat, AI enhancement suggestions, generation enrichment                 | 3–4 days |
| v0.5.0  | Chat Refinement | Interactive chat mode, file modification with diffs, context management                 | 3–4 days |
| v0.6.0  | More Providers  | GitHub Models (device flow), Ollama (local), eject command                              | 2–3 days |
| v0.7.0  | Polish          | README with terminal GIF (vhs), 3 example specs, error handling, validate command       | 2–3 days |
| v1.0.0  | Stable Release  | Docs, npm publish, CI/CD (GitHub Actions), community launch                             | 2–3 days |

**Total estimated time to v1.0.0:** 4–5 weeks

# **11\. Launch Strategy**

## **11.1 Pre-Launch**

- Clean GitHub repo with MIT license

- README with terminal recording (use vhs or terminalizer)

- 3 example spec files: fitness app, SaaS app, finance app

- CONTRIBUTING.md with clear guidelines

- GitHub Actions CI: lint, test, build on every PR

- Changesets for semantic versioning

## **11.2 Launch Day**

- npm publish — npx onboardkit onboard works immediately

- Twitter/X thread showing the full flow (terminal GIF)

- Reddit posts: r/reactnative, r/expo, r/webdev, r/SideProject

- Hacker News: Show HN post

- Product Hunt launch with demo video

- Indie Hackers post with build story

## **11.3 Post-Launch**

- Monitor GitHub issues and respond quickly

- Blog post: "I built a CLI that generates your entire onboarding flow from markdown"

- Accept community template contributions

- Iterate based on feedback — Next.js templates, more screen types

# **12\. Success Metrics**

| Metric                     | 30-Day Target | 90-Day Target |
| :------------------------- | :------------ | :------------ |
| GitHub Stars               | 200+          | 1,000+        |
| npm Weekly Downloads       | 100+          | 500+          |
| GitHub Issues (engagement) | 20+           | 50+           |
| Community PRs              | 5+            | 15+           |
| Example specs contributed  | 3+            | 10+           |

— End of Plan —
