# OnboardKit CLI — Implementation Plan v1

## Context

OnboardKit is a CLI tool that generates production-ready mobile onboarding UI from a markdown spec. Users describe their onboarding flow in markdown, then the CLI uses AI (via OAuth to Anthropic/Gemini/etc.) to enhance the spec and produce optimized Stitch MCP prompts for each screen. At the end, the user is optionally asked if they want to connect to Stitch MCP to generate the actual designs — if yes, the CLI orchestrates Stitch calls; if no, the prompts are saved to disk so nothing is lost.

**The CLI does NOT require Stitch MCP to function.** Its core job is: parse spec → validate → AI-enhance → generate screen prompts + React Native code. Stitch integration is an optional final step.

---

## Architecture Overview

```
User writes spec.md (at repo root or anywhere)
       ↓
  onboardkit onboard (7 phases)
       ↓
  Phase 1: Auth Check → OAuth to AI provider (Anthropic)
  Phase 2: Spec Check → Find/create spec.md
  Phase 3: Spec Repair → Parse + validate, AI fixes errors
  Phase 4: AI Enhancement → AI suggests UX improvements
  Phase 5: Generation → Handlebars templates + AI-enhanced Stitch prompts
  Phase 6: Refinement → Chat to tweak generated output
  Phase 7: Finalize → Format, save prompts, optionally call Stitch
       ↓
  Output (in user's working directory):
    onboardkit-output/
      screens/*.tsx              ← React Native components
      navigation/*.tsx           ← Navigator + types
      theme/*.ts                 ← Colors, typography, spacing
      hooks/*.ts                 ← Flow, auth, subscription hooks
      components/*.tsx           ← Shared UI components
      stitch-prompts/            ← Per-screen Stitch MCP prompts (always saved)
        welcome.md
        onboarding-step-1.md
        ...
```

---

## Repo Layout

CLI code lives in `cli/` — the repo root stays clean for testing generated output, example Expo projects, etc.

```
onboarding-kit/                     ← repo root (available for testing)
  docs/
    spec1.md                        ← project spec
    plan1.md                        ← this plan
  cli/                              ← all CLI source code + config
    package.json
    tsconfig.json
    tsup.config.ts
    src/
      index.ts                      # CLI entry (commander)
      commands/
        onboard.ts                  # Full guided walkthrough
        init.ts                     # Create template spec.md
        auth.ts                     # OAuth connect/status/switch
        validate.ts                 # Parse + validate spec
        generate.ts                 # Template-only generation (no AI)
        chat.ts                     # Refinement chat
        reset.ts                    # Clear checkpoints
        eject.ts                    # Copy templates locally
      phases/
        auth-check.ts               # Phase 1
        spec-check.ts               # Phase 2
        spec-repair.ts              # Phase 3
        spec-enhance.ts             # Phase 4
        generation.ts               # Phase 5
        refinement.ts               # Phase 6
        finalize.ts                 # Phase 7
      parser/
        markdown.ts                 # MD → structured object (unified + remark)
        schema.ts                   # Zod schemas + TS types
        validator.ts                # Parse + validate wrapper
      generator/
        engine.ts                   # Handlebars template rendering
        writer.ts                   # Write files to disk
        prompt-builder.ts           # Build per-screen Stitch prompts from spec
      ai/
        client.ts                   # Unified AI interface (provider-agnostic)
        providers/
          anthropic.ts              # Anthropic Claude via OAuth
          google.ts                 # Google Gemini via OAuth
          github.ts                 # GitHub Models via Device Flow
          ollama.ts                 # Local Ollama
          apikey.ts                 # Manual API key fallback
          types.ts                  # Provider interface
        prompts/
          repair.ts                 # Prompt for spec repair suggestions
          enrich.ts                 # Prompt for UX enhancement suggestions
          generate.ts               # Prompt to enhance Stitch screen prompts
          refine.ts                 # Prompt for chat-based refinement
        chat.ts                     # Interactive chat loop
      auth/
        oauth.ts                    # PKCE utilities, local callback server
        store.ts                    # Credential storage (keytar + fallback)
        manager.ts                  # Provider selection + token management
      checkpoint/
        store.ts                    # Read/write checkpoint.json
        resume.ts                   # Resume logic
      utils/
        logger.ts                   # Logging with picocolors
        format.ts                   # Prettier formatting
        constants.ts                # Paths, defaults
    templates/
      expo/
        screens/                    # 7 Handlebars templates
        navigation/                 # Navigator + types
        theme/                      # Colors, typography, spacing, index
        hooks/                      # useOnboardingFlow, useAuth, useSubscription
        components/                 # ProgressDots, OnboardingLayout, etc.
    examples/
      finance-app.md
      fitness-app.md
      saas-app.md
  scripts/                          ← utility scripts (optional)
  LICENSE
  README.md
  .gitignore
```

---

## Implementation Sequence (13 steps)

### Step 1: Project Scaffolding

Create `cli/package.json`, `cli/tsconfig.json`, `cli/tsup.config.ts`. Run `npm install` inside `cli/`.

**Dependencies:**
- Runtime: `commander`, `@clack/prompts`, `unified`, `remark-parse`, `zod`, `handlebars`, `prettier`, `picocolors`, `@anthropic-ai/sdk`, `open`, `keytar`
- Dev: `tsup`, `typescript`, `@types/node`

**Key config:**
- `package.json`: `"type": "module"`, `"bin": { "onboardkit": "./dist/index.js" }`
- `tsup.config.ts`: ESM output, `banner: { js: "#!/usr/bin/env node" }`, `shims: true`
- `tsconfig.json`: `"module": "ESNext"`, `"moduleResolution": "bundler"`, strict mode

**Files:** `cli/package.json`, `cli/tsconfig.json`, `cli/tsup.config.ts`

### Step 2: Core Types + Schema

Define all Zod schemas matching the spec format. This is the canonical data shape every module depends on.

**Schemas:** Config, Theme, WelcomeScreen, OnboardingStep, SoftPaywall, Login, NameCapture, HardPaywall → composed into `OnboardingSpecSchema`. All TS types inferred via `z.infer`.

**Also:** `ScreenManifest` type — bridges spec data to both template rendering and Stitch prompt building:
```ts
{ type: ScreenType, fileName: string, templateName: string, data: Record<string, unknown> }
```

**Files:** `cli/src/parser/schema.ts`, `cli/src/utils/constants.ts`, `cli/src/utils/logger.ts`

### Step 3: Markdown Parser

Convert raw markdown into an unvalidated plain object using `unified().use(remarkParse).parse()` → mdast tree walking.

**Parsing rules:**
- `# Heading` (depth 1) = project name
- `## Section` (depth 2) = Config, Theme, Welcome Screen, etc.
- `### Step N` (depth 3) = individual onboarding steps
- `- Key: Value` list items = properties (split on first colon only)
- `- Features:` with nested list or `[a, b, c]` inline = arrays
- Quoted strings have quotes stripped

**Files:** `cli/src/parser/markdown.ts`, `cli/src/parser/validator.ts`

### Step 4: Handlebars Templates

Create all 20 `.hbs` template files for Expo/React Native output. Each generates a functional TypeScript component using `StyleSheet.create`, theme imports, and React Navigation.

**Template list (20 files):**
- 7 screen templates: Welcome, OnboardingStep, SoftPaywall, Login, NameCapture, HardPaywall, Home
- 2 navigation: Navigator, types
- 4 theme: colors, typography, spacing, index
- 3 hooks: useOnboardingFlow, useAuth, useSubscription
- 4 components: ProgressDots, OnboardingLayout, PaywallFeatureRow, SocialLoginButton

**Files:** `cli/templates/expo/**/*.hbs`

### Step 5: Generator Engine

Build screen manifest from validated spec → compile Handlebars templates → render all files.

**Files:** `cli/src/generator/engine.ts`, `cli/src/generator/writer.ts`, `cli/src/utils/format.ts`

### Step 6: Stitch Prompt Builder

Build per-screen Stitch MCP prompts from the validated spec. Each screen type gets a specialized prompt including theme colors, app context, headlines, and design instructions.

Prompts are always saved as individual markdown files in `stitch-prompts/` — they never get lost regardless of whether the user opts into Stitch generation.

**Screen-specific prompt focus:**

| Screen | Prompt Focus |
|--------|-------------|
| Welcome | Hero illustration, brand personality, CTA prominence |
| Onboarding Step | Progress indicators, illustration consistency, swipe feel |
| Soft Paywall | Social proof, urgency cues, feature iconography |
| Login | Trust signals, SSO button styling per platform |
| Name Capture | Input micro-interactions, keyboard handling |
| Hard Paywall | Plan comparison, pricing psychology |
| Home | Content density, navigation pattern |

**Files:** `cli/src/generator/prompt-builder.ts`

### Step 7: Auth System (OAuth + PKCE)

Implement OAuth 2.0 + PKCE for Anthropic Claude:
1. Generate `code_verifier` + `code_challenge`
2. Open browser to Anthropic OAuth endpoint via `open` package
3. Spin up `node:http` server on localhost for redirect callback
4. Capture auth code → exchange for access + refresh tokens
5. Store in OS keychain via `keytar` (fallback: encrypted `~/.onboardkit/credentials.json`)
6. Auto-refresh on expiry

Provider interface: `{ name, isConfigured(), authenticate(), getClient(), testConnection() }`

**Files:** `cli/src/auth/oauth.ts`, `cli/src/auth/store.ts`, `cli/src/auth/manager.ts`, `cli/src/ai/providers/anthropic.ts`, `cli/src/ai/providers/types.ts`

### Step 8: AI Client + Prompts

Unified AI client abstracting over providers. Four specialized prompt chains:

| Prompt | Phase | Purpose |
|--------|-------|---------|
| repair | 3 - Spec Repair | Given validation errors, suggest fixes in user's style |
| enrich | 4 - AI Enhancement | Review full spec, suggest UX improvements |
| generate | 5 - Generation | Enhance base Stitch prompts with design best practices |
| refine | 6 - Refinement | Modify files based on user chat requests |

**Files:** `cli/src/ai/client.ts`, `cli/src/ai/prompts/*.ts`, `cli/src/ai/chat.ts`

### Step 9: Checkpoint System

Store at `.onboardkit/checkpoint.json` in the user's working directory:
```json
{
  "phase": "spec-valid",
  "timestamp": "...",
  "specHash": "...",
  "generatedFiles": [...],
  "chatHistory": [...],
  "decisions": {...}
}
```

Resume: detect existing checkpoint → prompt "Continue / Start over (keep spec) / Start fresh". If spec hash changed since checkpoint, warn + offer re-validate.

**Files:** `cli/src/checkpoint/store.ts`, `cli/src/checkpoint/resume.ts`

### Step 10: The 7 Phases

Each phase is a standalone async function receiving context, returning updated context.

- **Phase 1 (auth-check.ts):** Check credentials → if missing, run OAuth → verify with test API call → checkpoint `auth-done`
- **Phase 2 (spec-check.ts):** Find spec.md → if missing, offer template or interactive creation → checkpoint `spec-ready`
- **Phase 3 (spec-repair.ts):** Parse + validate → for each error, AI suggests fix → user approves → write to spec.md → re-validate until clean → checkpoint `spec-valid`
- **Phase 4 (spec-enhance.ts):** AI reviews full spec → suggests UX improvements one by one → user approves/skips each → write approved changes → checkpoint `spec-enhanced`
- **Phase 5 (generation.ts):** Render Handlebars templates → build base Stitch prompts → AI enhances prompts → save all to output dir → checkpoint `generated`
- **Phase 6 (refinement.ts):** Interactive chat → user requests changes → AI modifies files/prompts → show diffs → user says "done" → checkpoint `refined`
- **Phase 7 (finalize.ts):** Prettier format all code → save stitch prompts to `stitch-prompts/` → ask "Connect to Stitch MCP to generate designs?" → if yes, call Stitch MCP tools for each screen → print summary → checkpoint `complete`

**Files:** `cli/src/phases/*.ts`

### Step 11: CLI Commands

- `onboard` — main command, runs all 7 phases with checkpoints
- `init` — interactive spec.md template creation via @clack/prompts
- `auth` / `auth status` / `auth switch <provider>` — credential management
- `validate` — parse + validate spec, print summary or errors
- `generate` — template-only generation (no AI), for offline use
- `chat` — open refinement chat on existing output
- `reset` — clear checkpoints
- `eject` — copy templates to local project for customization

**Files:** `cli/src/commands/*.ts`, `cli/src/index.ts`

### Step 12: Example Specs

Three complete example spec files users can reference:
- `cli/examples/finance-app.md` — the MyFinanceApp example from spec doc
- `cli/examples/fitness-app.md` — fitness tracking app
- `cli/examples/saas-app.md` — SaaS productivity app

### Step 13: Build + Test

- `cd cli && npm run build` → verify tsup bundles correctly
- `npm link` → test `onboardkit` command globally
- Test at repo root: `cd .. && onboardkit init` → creates spec.md at repo root
- Test: `onboardkit validate spec.md` → passes with summary
- Test: `onboardkit generate` → creates `onboardkit-output/` at repo root
- Test: `onboardkit onboard` → full 7-phase flow with OAuth
- Verify generated `.tsx` files are valid TypeScript

---

## Key Design Decisions

1. **CLI code in `cli/`, repo root stays clean.** Users can test generated output, create example Expo projects, etc. at the root without conflicting with CLI source.

2. **Stitch prompts always saved to disk.** `stitch-prompts/*.md` files are written regardless of whether the user opts into Stitch generation — prompts are never lost.

3. **Stitch is optional, asked at the end.** Phase 7 asks "Would you like to connect to Stitch MCP to generate designs?" — if yes, CLI calls Stitch; if no, just saves prompts.

4. **AI enhances Stitch prompts.** Base prompts are template-generated from spec. AI enriches them with design best practices, accessibility hints, animation suggestions.

5. **`ScreenManifest` bridges templates and prompts.** Same data structure feeds both Handlebars rendering and Stitch prompt building.

6. **Checkpoint at every phase.** User can Ctrl+C and resume later without losing progress.

7. **`generate` command works offline.** Template-only mode, no AI needed — useful for quick iteration.

---

## Verification Plan

1. **Build:** `cd cli && npm run build` succeeds, `dist/index.js` has shebang
2. **Init:** `onboardkit init` creates a valid spec.md interactively
3. **Validate pass:** `onboardkit validate` on finance-app.md passes with correct summary
4. **Validate fail:** A malformed spec shows clear Zod error messages per field
5. **Generate:** `onboardkit generate` produces all expected files in `onboardkit-output/`
6. **Generated code valid:** All `.tsx` files pass `tsc --noEmit`
7. **Stitch prompts saved:** `stitch-prompts/*.md` contain detailed per-screen prompts
8. **Auth:** `onboardkit auth` opens browser for OAuth, stores token, `auth status` shows connected
9. **Full onboard:** `onboardkit onboard` completes all 7 phases
10. **Resume:** Kill mid-Phase 4 → re-run → resumes from checkpoint
11. **Stitch opt-in:** Phase 7 asks about Stitch, yes → calls MCP, no → saves prompts only
