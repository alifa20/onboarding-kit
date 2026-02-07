# OnboardKit - Implementation Checklist

**Based on:** 13-Step Implementation Plan from `docs/plan1.md`
**Timeline:** 4-5 weeks (solo developer)
**Last Updated:** 2026-02-07

---

## Pre-Implementation Setup

### Environment Preparation
- [ ] Install Node.js >= 22
- [ ] Install pnpm (recommended) or npm
- [ ] Configure Git with user.name and user.email
- [ ] Set up GitHub repository
- [ ] Install VS Code with TypeScript extensions
- [ ] Install recommended VS Code extensions:
  - [ ] ESLint
  - [ ] Prettier
  - [ ] Vitest

### Repository Structure
- [ ] Create `cli/` directory for all CLI code
- [ ] Keep repo root clean for testing
- [ ] Add `.gitignore` (node_modules, dist, .env, etc.)
- [ ] Create initial README.md
- [ ] Add LICENSE file (MIT)

---

## Step 1: Project Scaffolding

**Duration:** 1-2 days
**Location:** `cli/`

### Package Configuration
- [ ] Create `cli/package.json`
  - [ ] Set `"type": "module"` for ESM
  - [ ] Add `"bin": { "onboardkit": "./dist/index.js" }`
  - [ ] Configure `"files": ["dist", "templates"]`
  - [ ] Set `"engines": { "node": ">=22" }`
  - [ ] Add scripts: build, dev, test, test:coverage

### Dependencies Installation
```bash
cd cli
pnpm init
pnpm add commander @clack/prompts unified remark-parse remark-frontmatter zod handlebars prettier picocolors @anthropic-ai/sdk @google/generative-ai keyring-node
pnpm add -D tsup typescript @types/node vitest
```

#### Runtime Dependencies Checklist
- [ ] `commander` - CLI framework
- [ ] `@clack/prompts` - Terminal UI
- [ ] `unified` - Markdown processing core
- [ ] `remark-parse` - Markdown parser
- [ ] `remark-frontmatter` - YAML frontmatter support
- [ ] `zod` - Schema validation
- [ ] `handlebars` - Template engine
- [ ] `prettier` - Code formatting
- [ ] `picocolors` - Terminal colors (fast)
- [ ] `@anthropic-ai/sdk` - Claude API
- [ ] `@google/generative-ai` - Gemini API
- [ ] `keyring-node` - Credential storage

#### Dev Dependencies Checklist
- [ ] `tsup` - Build tool
- [ ] `typescript` - TypeScript compiler
- [ ] `@types/node` - Node.js types
- [ ] `vitest` - Testing framework

### TypeScript Configuration
- [ ] Create `cli/tsconfig.json`
  - [ ] Set `"module": "ESNext"`
  - [ ] Set `"moduleResolution": "bundler"`
  - [ ] Enable strict mode
  - [ ] Configure paths for cleaner imports
  - [ ] Set `"outDir": "./dist"`
  - [ ] Set `"rootDir": "./src"`

**Example tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Build Configuration
- [ ] Create `cli/tsup.config.ts`
  - [ ] Set entry: `src/index.ts`
  - [ ] Set format: ESM only
  - [ ] Enable shims (for __dirname, __filename)
  - [ ] Add shebang banner: `#!/usr/bin/env node`
  - [ ] Enable source maps
  - [ ] Enable TypeScript declaration files

**Example tsup.config.ts:**
```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  shims: true,
  banner: {
    js: '#!/usr/bin/env node'
  },
  sourcemap: true,
  clean: true,
  outDir: 'dist'
});
```

### Vitest Configuration
- [ ] Create `cli/vitest.config.ts`
  - [ ] Set environment to 'node'
  - [ ] Configure coverage (v8 provider)
  - [ ] Exclude dist/, templates/, examples/
  - [ ] Enable globals for convenience

**Example vitest.config.ts:**
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['dist/', 'examples/', 'templates/']
    }
  }
});
```

### Initial Build Test
- [ ] Create minimal `cli/src/index.ts`
- [ ] Run `pnpm build` - verify success
- [ ] Check `dist/index.js` has shebang
- [ ] Run `pnpm link` - test global command
- [ ] Run `onboardkit --version` - verify works

---

## Step 2: Core Types + Schema

**Duration:** 2-3 days
**Location:** `cli/src/parser/`, `cli/src/utils/`

### Zod Schema Definition
- [ ] Create `cli/src/parser/schema.ts`

#### Config Schema
- [ ] Define `ConfigSchema`
  - [ ] platform (literal: 'expo')
  - [ ] navigation (literal: 'react-navigation')
  - [ ] styling (literal: 'stylesheet')

#### Theme Schema
- [ ] Define `ThemeSchema`
  - [ ] Primary color (string, hex validation)
  - [ ] Secondary color
  - [ ] Background color
  - [ ] Surface color
  - [ ] Text color
  - [ ] TextSecondary color
  - [ ] Error color
  - [ ] Success color
  - [ ] Font (string)
  - [ ] BorderRadius (number)

#### Welcome Screen Schema
- [ ] Define `WelcomeScreenSchema`
  - [ ] Headline (string)
  - [ ] Subtext (string)
  - [ ] Image (string)
  - [ ] CTA (string)
  - [ ] Skip (string, optional)

#### Onboarding Step Schema
- [ ] Define `OnboardingStepSchema`
  - [ ] title (string)
  - [ ] headline (string)
  - [ ] subtext (string)
  - [ ] image (string)

#### Soft Paywall Schema
- [ ] Define `SoftPaywallSchema` (optional)
  - [ ] headline (string)
  - [ ] subtext (string)
  - [ ] features (array of strings)
  - [ ] cta (string)
  - [ ] skip (string, optional)
  - [ ] price (string)

#### Login Schema
- [ ] Define `LoginSchema`
  - [ ] methods (array: email, google, apple)
  - [ ] headline (string)

#### Name Capture Schema
- [ ] Define `NameCaptureSchema`
  - [ ] headline (string)
  - [ ] fields (array: first_name, last_name, etc.)
  - [ ] cta (string)

#### Hard Paywall Schema
- [ ] Define `HardPaywallSchema` (optional)
  - [ ] headline (string)
  - [ ] plans (array of plan objects)
  - [ ] cta (string)
  - [ ] restore (string)

#### Composite Schema
- [ ] Define `OnboardingSpecSchema`
  - [ ] projectName (string)
  - [ ] config (ConfigSchema)
  - [ ] theme (ThemeSchema)
  - [ ] welcome (WelcomeScreenSchema)
  - [ ] onboardingSteps (array of OnboardingStepSchema, min 1)
  - [ ] softPaywall (SoftPaywallSchema, optional)
  - [ ] login (LoginSchema)
  - [ ] nameCapture (NameCaptureSchema)
  - [ ] hardPaywall (HardPaywallSchema, optional)

### TypeScript Type Inference
- [ ] Export inferred types using `z.infer<>`
  ```typescript
  export type OnboardingSpec = z.infer<typeof OnboardingSpecSchema>;
  export type Config = z.infer<typeof ConfigSchema>;
  export type Theme = z.infer<typeof ThemeSchema>;
  // ... etc for all schemas
  ```

### Screen Manifest Type
- [ ] Define `ScreenManifest` type
  ```typescript
  type ScreenType = 'welcome' | 'onboarding-step' | 'soft-paywall' |
                    'login' | 'name-capture' | 'hard-paywall' | 'home';

  interface ScreenManifest {
    type: ScreenType;
    fileName: string;
    templateName: string;
    data: Record<string, unknown>;
  }
  ```

### Utility Files
- [ ] Create `cli/src/utils/constants.ts`
  - [ ] Define default colors
  - [ ] Define supported platforms
  - [ ] Define screen type constants
  - [ ] Define file paths

- [ ] Create `cli/src/utils/logger.ts`
  - [ ] Implement colored logging with picocolors
  - [ ] Add log levels: info, success, warn, error
  - [ ] Add verbose mode support

### Unit Tests
- [ ] Create `cli/src/parser/schema.test.ts`
  - [ ] Test valid spec parsing
  - [ ] Test invalid specs (missing required fields)
  - [ ] Test color validation (valid/invalid hex)
  - [ ] Test enum validation (platform, navigation)
  - [ ] Test array validation (onboarding steps min length)

---

## Step 3: Markdown Parser

**Duration:** 2-3 days
**Location:** `cli/src/parser/`

### Parser Implementation
- [ ] Create `cli/src/parser/markdown.ts`

#### AST Processing Functions
- [ ] Implement `parseMarkdown(content: string): unknown`
  - [ ] Use unified + remark-parse
  - [ ] Use remark-frontmatter for metadata
  - [ ] Walk AST tree to extract sections

#### Section Extraction
- [ ] Extract project name (heading depth 1)
- [ ] Extract Config section (heading depth 2)
- [ ] Extract Theme section
- [ ] Extract Welcome Screen section
- [ ] Extract Onboarding Steps (heading depth 3)
- [ ] Extract Soft Paywall section (optional)
- [ ] Extract Login section
- [ ] Extract Name Capture section
- [ ] Extract Hard Paywall section (optional)

#### Property Parsing
- [ ] Parse list items as key-value pairs
  - [ ] Split on first colon only
  - [ ] Strip quotes from values
  - [ ] Handle nested lists (features array)
  - [ ] Handle inline arrays `[a, b, c]`

#### Special Cases
- [ ] Handle multi-step onboarding (### Step 1, ### Step 2, etc.)
- [ ] Handle optional sections gracefully
- [ ] Preserve original structure for error reporting

### Validator Wrapper
- [ ] Create `cli/src/parser/validator.ts`
  - [ ] Implement `validateSpec(spec: unknown): Result<OnboardingSpec, ValidationError>`
  - [ ] Use Zod `.safeParse()` for validation
  - [ ] Return Result type (Ok/Err)
  - [ ] Format Zod errors into user-friendly messages

### Unit Tests
- [ ] Create `cli/src/parser/markdown.test.ts`
  - [ ] Test parsing finance-app.md example
  - [ ] Test parsing with missing sections
  - [ ] Test parsing with malformed markdown
  - [ ] Test nested list parsing
  - [ ] Test inline array parsing
  - [ ] Test quote stripping

- [ ] Create `cli/src/parser/validator.test.ts`
  - [ ] Test valid spec validation
  - [ ] Test invalid spec (missing required fields)
  - [ ] Test partial validation (optional fields)
  - [ ] Test error message formatting

### Integration Test
- [ ] Test full pipeline: MD file → parsed object → validated spec
- [ ] Verify type inference works correctly
- [ ] Test with all three example specs (finance, fitness, SaaS)

---

## Step 4: Handlebars Templates

**Duration:** 3-4 days
**Location:** `cli/templates/expo/`

### Screen Templates (7 files)
- [ ] Create `templates/expo/screens/WelcomeScreen.tsx.hbs`
  - [ ] Use `View`, `Text`, `Image`, `Pressable` from react-native
  - [ ] Import theme (colors, typography, spacing)
  - [ ] Use navigation hook
  - [ ] Implement "Next" → OnboardingStep1
  - [ ] Implement "Skip" → Login
  - [ ] Use StyleSheet.create

- [ ] Create `templates/expo/screens/OnboardingStep.tsx.hbs`
  - [ ] Support dynamic step number
  - [ ] Include ProgressDots component
  - [ ] Implement "Next" / "Back" navigation
  - [ ] Last step → SoftPaywall or Login

- [ ] Create `templates/expo/screens/SoftPaywall.tsx.hbs`
  - [ ] Display features list
  - [ ] Show pricing
  - [ ] Implement "Start Trial" CTA
  - [ ] Implement "Skip" → Login

- [ ] Create `templates/expo/screens/LoginScreen.tsx.hbs`
  - [ ] Email login input
  - [ ] Social login buttons (Google, Apple)
  - [ ] "Existing user" → Home
  - [ ] "New user" → NameCapture

- [ ] Create `templates/expo/screens/NameCaptureScreen.tsx.hbs`
  - [ ] Dynamic fields (first_name, last_name, etc.)
  - [ ] Input validation
  - [ ] "Create Account" → Home

- [ ] Create `templates/expo/screens/HardPaywall.tsx.hbs`
  - [ ] Plan comparison table
  - [ ] Pricing display
  - [ ] "Subscribe" CTA
  - [ ] "Restore Purchase" option

- [ ] Create `templates/expo/screens/HomeScreen.tsx.hbs`
  - [ ] Placeholder home screen
  - [ ] Check subscription status
  - [ ] Redirect to HardPaywall if not subscribed

### Navigation Templates (2 files)
- [ ] Create `templates/expo/navigation/OnboardingNavigator.tsx.hbs`
  - [ ] Use @react-navigation/native
  - [ ] Define all screen routes
  - [ ] Implement navigation state machine
  - [ ] Handle conditional routing (soft paywall, hard paywall)

- [ ] Create `templates/expo/navigation/types.ts.hbs`
  - [ ] Define navigation param types
  - [ ] Export RootStackParamList
  - [ ] Type-safe navigation helpers

### Theme Templates (4 files)
- [ ] Create `templates/expo/theme/colors.ts.hbs`
  - [ ] Export color palette from spec
  - [ ] Use theme values from schema

- [ ] Create `templates/expo/theme/typography.ts.hbs`
  - [ ] Define h1, h2, h3, body, caption styles
  - [ ] Use font from spec

- [ ] Create `templates/expo/theme/spacing.ts.hbs`
  - [ ] Define spacing scale (xs, sm, md, lg, xl, xxl)
  - [ ] Base on border radius from spec

- [ ] Create `templates/expo/theme/index.ts.hbs`
  - [ ] Re-export colors, typography, spacing

### Hook Templates (3 files)
- [ ] Create `templates/expo/hooks/useOnboardingFlow.ts.hbs`
  - [ ] Track current step
  - [ ] Navigate between steps
  - [ ] Handle completion

- [ ] Create `templates/expo/hooks/useAuth.ts.hbs`
  - [ ] Mock authentication state
  - [ ] Login/logout methods
  - [ ] User state management

- [ ] Create `templates/expo/hooks/useSubscription.ts.hbs`
  - [ ] Mock subscription state
  - [ ] Subscribe/cancel methods
  - [ ] Check subscription status

### Component Templates (4 files)
- [ ] Create `templates/expo/components/ProgressDots.tsx.hbs`
  - [ ] Display step progress
  - [ ] Highlight current step
  - [ ] Use theme colors

- [ ] Create `templates/expo/components/OnboardingLayout.tsx.hbs`
  - [ ] Shared layout wrapper
  - [ ] SafeAreaView handling
  - [ ] Consistent padding

- [ ] Create `templates/expo/components/PaywallFeatureRow.tsx.hbs`
  - [ ] Feature item display
  - [ ] Check icon
  - [ ] Typography styling

- [ ] Create `templates/expo/components/SocialLoginButton.tsx.hbs`
  - [ ] Platform-specific button (Google, Apple)
  - [ ] Icon + text layout
  - [ ] Themed styling

### Template Testing
- [ ] Manually render templates with sample data
- [ ] Verify TypeScript syntax is valid
- [ ] Check imports are correct
- [ ] Ensure navigation logic works
- [ ] Test with all three example specs

---

## Step 5: Generator Engine

**Duration:** 2-3 days
**Location:** `cli/src/generator/`

### Engine Implementation
- [ ] Create `cli/src/generator/engine.ts`

#### Screen Manifest Builder
- [ ] Implement `buildScreenManifests(spec: OnboardingSpec): ScreenManifest[]`
  - [ ] Create manifest for Welcome screen
  - [ ] Create manifests for each onboarding step (dynamic count)
  - [ ] Create manifest for Soft Paywall (if present)
  - [ ] Create manifest for Login screen
  - [ ] Create manifest for Name Capture screen
  - [ ] Create manifest for Hard Paywall (if present)
  - [ ] Create manifest for Home screen

#### Template Rendering
- [ ] Implement `renderTemplate(templatePath: string, data: unknown): string`
  - [ ] Load Handlebars template from file
  - [ ] Compile template
  - [ ] Render with data
  - [ ] Return generated code string

#### Batch Rendering
- [ ] Implement `generateAllScreens(spec: OnboardingSpec): GeneratedFile[]`
  - [ ] Build screen manifests
  - [ ] Render each screen template
  - [ ] Render navigation templates
  - [ ] Render theme templates
  - [ ] Render hook templates
  - [ ] Render component templates
  - [ ] Return array of { path, content } objects

### File Writer
- [ ] Create `cli/src/generator/writer.ts`

#### Atomic Write Function
- [ ] Implement `atomicWrite(filePath: string, content: string): Promise<void>`
  - [ ] Write to temporary file first
  - [ ] Atomic rename to target path
  - [ ] Handle errors gracefully

#### Batch Write Function
- [ ] Implement `writeGeneratedFiles(files: GeneratedFile[], outputDir: string): Promise<void>`
  - [ ] Create output directory structure
  - [ ] Write each file atomically
  - [ ] Set file permissions (chmod 644)
  - [ ] Log progress

### Prettier Formatting
- [ ] Create `cli/src/utils/format.ts`
  - [ ] Implement `formatTypeScript(code: string): string`
  - [ ] Use Prettier with TypeScript parser
  - [ ] Catch formatting errors gracefully
  - [ ] Return original code if formatting fails

### Unit Tests
- [ ] Create `cli/src/generator/engine.test.ts`
  - [ ] Test manifest building for simple spec
  - [ ] Test manifest building with optional sections
  - [ ] Test template rendering with sample data
  - [ ] Test full generation pipeline

- [ ] Create `cli/src/generator/writer.test.ts`
  - [ ] Test atomic write
  - [ ] Test batch write
  - [ ] Test directory creation
  - [ ] Test error handling

### Integration Test
- [ ] Generate full output from finance-app example
- [ ] Verify all files created
- [ ] Run `tsc --noEmit` on generated files
- [ ] Verify no TypeScript errors
- [ ] Verify Prettier formatting applied

---

## Step 6: Stitch Prompt Builder

**Duration:** 1-2 days
**Location:** `cli/src/generator/`

### Prompt Builder Implementation
- [ ] Create `cli/src/generator/prompt-builder.ts`

#### Base Prompt Structure
- [ ] Define prompt template structure
  - [ ] App context section
  - [ ] Theme/design system section
  - [ ] Screen-specific requirements
  - [ ] Technical constraints
  - [ ] Accessibility requirements

#### Screen-Specific Prompts
- [ ] Implement `buildWelcomePrompt(spec: OnboardingSpec): string`
  - [ ] Hero illustration focus
  - [ ] Brand personality emphasis
  - [ ] CTA prominence
  - [ ] First impression considerations

- [ ] Implement `buildOnboardingStepPrompt(step: OnboardingStep, stepNumber: number, totalSteps: number): string`
  - [ ] Progress indicator design
  - [ ] Illustration consistency across steps
  - [ ] Swipe gesture feel
  - [ ] Step context (1 of 3, 2 of 3, etc.)

- [ ] Implement `buildSoftPaywallPrompt(spec: OnboardingSpec): string`
  - [ ] Social proof elements
  - [ ] Urgency cues
  - [ ] Feature iconography
  - [ ] Pricing psychology

- [ ] Implement `buildLoginPrompt(spec: OnboardingSpec): string`
  - [ ] Trust signals
  - [ ] SSO button styling per platform
  - [ ] Input field design
  - [ ] Security indicators

- [ ] Implement `buildNameCapturePrompt(spec: OnboardingSpec): string`
  - [ ] Input micro-interactions
  - [ ] Keyboard handling
  - [ ] Form validation feedback
  - [ ] Friendly tone

- [ ] Implement `buildHardPaywallPrompt(spec: OnboardingSpec): string`
  - [ ] Plan comparison table design
  - [ ] Pricing psychology tactics
  - [ ] Feature differentiation
  - [ ] Call-to-action optimization

- [ ] Implement `buildHomePrompt(spec: OnboardingSpec): string`
  - [ ] Content density guidelines
  - [ ] Navigation pattern
  - [ ] Placeholder state design

#### Batch Prompt Generation
- [ ] Implement `generateAllPrompts(spec: OnboardingSpec): PromptFile[]`
  - [ ] Generate prompt for each screen
  - [ ] Include app context in each prompt
  - [ ] Include theme colors and typography
  - [ ] Return array of { screenName, promptContent } objects

### Prompt File Writer
- [ ] Implement `writePrompts(prompts: PromptFile[], outputDir: string): Promise<void>`
  - [ ] Create `stitch-prompts/` directory
  - [ ] Write each prompt as markdown file
  - [ ] Use descriptive filenames (welcome.md, onboarding-step-1.md, etc.)
  - [ ] Always save prompts regardless of Stitch MCP connection

### Unit Tests
- [ ] Create `cli/src/generator/prompt-builder.test.ts`
  - [ ] Test prompt generation for each screen type
  - [ ] Verify theme colors included
  - [ ] Verify app context included
  - [ ] Test with optional sections (soft paywall, hard paywall)

### Integration Test
- [ ] Generate prompts from finance-app example
- [ ] Verify all prompt files created
- [ ] Manually review prompt quality
- [ ] Ensure prompts are actionable for Stitch MCP

---

## Step 7: Auth System (OAuth + PKCE)

**Duration:** 3-4 days
**Location:** `cli/src/auth/`

### OAuth Utilities
- [ ] Create `cli/src/auth/oauth.ts`

#### PKCE Implementation
- [ ] Implement `generateCodeVerifier(): string`
  - [ ] Generate 43-128 char random string
  - [ ] Use chars: A-Z, a-z, 0-9, -._~
  - [ ] Use crypto.randomBytes

- [ ] Implement `generateCodeChallenge(verifier: string): string`
  - [ ] SHA256 hash of verifier
  - [ ] BASE64-URL encode result

- [ ] Implement `buildAuthorizationUrl(provider: string, codeChallenge: string, state: string): string`
  - [ ] Build OAuth authorization URL
  - [ ] Include client_id, redirect_uri, code_challenge, state
  - [ ] Use provider-specific endpoints

#### Callback Server
- [ ] Implement `startCallbackServer(): Promise<{ code: string; state: string }>`
  - [ ] Create Node.js http server
  - [ ] Listen on localhost random port (3000-9000)
  - [ ] Parse query parameters from redirect
  - [ ] Extract authorization code and state
  - [ ] Return to caller
  - [ ] Shut down server after receiving callback
  - [ ] Implement 2-minute timeout

#### Token Exchange
- [ ] Implement `exchangeCodeForTokens(code: string, verifier: string, provider: string): Promise<Tokens>`
  - [ ] POST to provider's token endpoint
  - [ ] Include code, code_verifier, client_id, redirect_uri
  - [ ] Parse response for access_token and refresh_token
  - [ ] Return tokens object

#### Token Refresh
- [ ] Implement `refreshAccessToken(refreshToken: string, provider: string): Promise<string>`
  - [ ] POST to provider's token endpoint
  - [ ] Include refresh_token and grant_type
  - [ ] Return new access_token

### Credential Storage
- [ ] Create `cli/src/auth/store.ts`

#### Keyring Integration
- [ ] Implement `saveCredential(key: string, value: string): Promise<void>`
  - [ ] Try keyring-node first
  - [ ] Fallback to encrypted file if keyring fails
  - [ ] Handle errors gracefully

- [ ] Implement `getCredential(key: string): Promise<string | null>`
  - [ ] Try keyring-node first
  - [ ] Fallback to encrypted file
  - [ ] Return null if not found

- [ ] Implement `deleteCredential(key: string): Promise<void>`
  - [ ] Remove from keyring
  - [ ] Remove from encrypted file
  - [ ] Handle errors gracefully

#### Encrypted File Fallback
- [ ] Implement `encryptData(data: string, key: string): string`
  - [ ] Use AES-256-GCM
  - [ ] Derive key from machine ID
  - [ ] Return encrypted string

- [ ] Implement `decryptData(encrypted: string, key: string): string`
  - [ ] Use AES-256-GCM
  - [ ] Use same key derivation
  - [ ] Return decrypted string

- [ ] Implement file storage at `~/.onboardkit/credentials.json`
  - [ ] Create directory if needed
  - [ ] Set permissions to 600 (owner read/write only)
  - [ ] Store encrypted credentials

### Provider Manager
- [ ] Create `cli/src/auth/manager.ts`

#### Provider Interface
```typescript
interface IAuthProvider {
  name: string;
  isConfigured(): Promise<boolean>;
  authenticate(): Promise<void>;
  getClient(): AIClient;
  testConnection(): Promise<boolean>;
}
```

- [ ] Implement `AuthManager` class
  - [ ] Manage multiple providers
  - [ ] Track active provider
  - [ ] Provide provider selection
  - [ ] Cache credentials in memory

- [ ] Implement `selectProvider(name: string): Promise<IAuthProvider>`
  - [ ] Return provider instance
  - [ ] Initialize if needed

- [ ] Implement `getActiveProvider(): Promise<IAuthProvider | null>`
  - [ ] Return currently active provider
  - [ ] Check if authenticated

### Unit Tests
- [ ] Create `cli/src/auth/oauth.test.ts`
  - [ ] Test code verifier generation (length, charset)
  - [ ] Test code challenge generation (SHA256 + BASE64-URL)
  - [ ] Test authorization URL building
  - [ ] Test token exchange (mock HTTP)
  - [ ] Test token refresh (mock HTTP)

- [ ] Create `cli/src/auth/store.test.ts`
  - [ ] Test credential save/get/delete
  - [ ] Test keyring fallback to file
  - [ ] Test encryption/decryption
  - [ ] Test file permissions

- [ ] Create `cli/src/auth/manager.test.ts`
  - [ ] Test provider selection
  - [ ] Test active provider retrieval
  - [ ] Test credential caching

### Integration Test
- [ ] Test full OAuth flow with mock provider
- [ ] Test credential persistence across restarts
- [ ] Test fallback from keyring to file

---

## Step 8: AI Client + Prompts

**Duration:** 3-4 days
**Location:** `cli/src/ai/`

### AI Provider Abstraction
- [ ] Create `cli/src/ai/providers/types.ts`

```typescript
interface AIProvider {
  name: string;
  chat(messages: Message[]): Promise<string>;
  streamChat(messages: Message[]): AsyncIterable<string>;
  getMaxTokens(): number;
  validateModel(model: string): boolean;
}
```

### Anthropic Provider
- [ ] Create `cli/src/ai/providers/anthropic.ts`
  - [ ] Implement `AnthropicProvider` class
  - [ ] Use `@anthropic-ai/sdk`
  - [ ] Implement OAuth token refresh
  - [ ] Implement chat method
  - [ ] Implement streaming chat method
  - [ ] Handle rate limits
  - [ ] Handle errors gracefully

### Google Gemini Provider
- [ ] Create `cli/src/ai/providers/google.ts`
  - [ ] Implement `GoogleProvider` class
  - [ ] Use `@google/generative-ai`
  - [ ] Implement OAuth token refresh
  - [ ] Implement chat method
  - [ ] Implement streaming chat method
  - [ ] Handle rate limits (15 RPM)

### GitHub Models Provider
- [ ] Create `cli/src/ai/providers/github.ts`
  - [ ] Implement `GitHubProvider` class
  - [ ] Use GitHub Models API
  - [ ] Implement device flow authentication
  - [ ] Implement chat method
  - [ ] Support multiple models

### Ollama Provider
- [ ] Create `cli/src/ai/providers/ollama.ts`
  - [ ] Implement `OllamaProvider` class
  - [ ] Ping localhost:11434 for availability
  - [ ] Implement chat method
  - [ ] List available models
  - [ ] No authentication required

### Unified AI Client
- [ ] Create `cli/src/ai/client.ts`

#### Middleware Support
- [ ] Implement `withRetry(client: AIClient, options: RetryOptions): AIClient`
  - [ ] Retry on network errors
  - [ ] Exponential backoff
  - [ ] Max retry attempts

- [ ] Implement `withFallback(primary: AIClient, fallback: AIClient): AIClient`
  - [ ] Try primary first
  - [ ] Fall back on failure
  - [ ] Log fallback events

- [ ] Implement `withLogging(client: AIClient): AIClient`
  - [ ] Log requests
  - [ ] Log responses
  - [ ] Log errors
  - [ ] Respect verbose mode

#### Client Factory
- [ ] Implement `createAIClient(provider: IAuthProvider): AIClient`
  - [ ] Create provider-specific client
  - [ ] Apply middleware (retry, logging)
  - [ ] Return configured client

### Specialized Prompts
- [ ] Create `cli/src/ai/prompts/repair.ts`
  - [ ] Build prompt for spec repair
  - [ ] Include validation errors
  - [ ] Request suggestions in user's style
  - [ ] Provide context about spec format

- [ ] Create `cli/src/ai/prompts/enrich.ts`
  - [ ] Build prompt for UX enhancement
  - [ ] Include full spec
  - [ ] Request specific improvements
  - [ ] Focus on accessibility, copy, flow

- [ ] Create `cli/src/ai/prompts/generate.ts`
  - [ ] Build prompt for Stitch prompt enhancement
  - [ ] Include base prompt
  - [ ] Request design best practices
  - [ ] Include accessibility hints
  - [ ] Suggest animations

- [ ] Create `cli/src/ai/prompts/refine.ts`
  - [ ] Build prompt for chat refinement
  - [ ] Include generated files context
  - [ ] Include user request
  - [ ] Request specific file modifications

### Chat Interface
- [ ] Create `cli/src/ai/chat.ts`
  - [ ] Implement `startChatSession(client: AIClient, context: string): ChatSession`
  - [ ] Maintain conversation history
  - [ ] Stream responses to terminal
  - [ ] Handle user interrupts (Ctrl+C)
  - [ ] Provide exit command

### Unit Tests
- [ ] Create `cli/src/ai/providers/anthropic.test.ts`
  - [ ] Test chat method (mock SDK)
  - [ ] Test streaming (mock SDK)
  - [ ] Test error handling

- [ ] Create `cli/src/ai/client.test.ts`
  - [ ] Test retry middleware
  - [ ] Test fallback middleware
  - [ ] Test logging middleware
  - [ ] Test client factory

- [ ] Create `cli/src/ai/prompts/*.test.ts`
  - [ ] Test prompt building for each type
  - [ ] Verify context inclusion
  - [ ] Verify format correctness

### Integration Test
- [ ] Test full AI conversation flow
- [ ] Test retry on network failure
- [ ] Test fallback between providers
- [ ] Test chat session with history

---

## Step 9: Checkpoint System

**Duration:** 1-2 days
**Location:** `cli/src/checkpoint/`

### Checkpoint Store
- [ ] Create `cli/src/checkpoint/store.ts`

#### Checkpoint Schema
```typescript
interface Checkpoint {
  phase: PhaseStatus;
  timestamp: string;
  specHash: string;
  specPath: string;
  generatedFiles: string[];
  chatHistory: Message[];
  decisions: Record<string, unknown>;
  phaseData: Record<string, unknown>;
}
```

#### Core Functions
- [ ] Implement `saveCheckpoint(checkpoint: Checkpoint): Promise<void>`
  - [ ] Write to `.onboardkit/checkpoint.json`
  - [ ] Atomic write (temp file + rename)
  - [ ] Create directory if needed

- [ ] Implement `loadCheckpoint(): Promise<Checkpoint | null>`
  - [ ] Read from `.onboardkit/checkpoint.json`
  - [ ] Parse JSON
  - [ ] Validate schema
  - [ ] Return null if not found or invalid

- [ ] Implement `deleteCheckpoint(): Promise<void>`
  - [ ] Remove `.onboardkit/checkpoint.json`
  - [ ] Handle not found gracefully

- [ ] Implement `computeSpecHash(specPath: string): Promise<string>`
  - [ ] Read spec file
  - [ ] Compute SHA256 hash
  - [ ] Return hex string

### Resume Logic
- [ ] Create `cli/src/checkpoint/resume.ts`

- [ ] Implement `detectCheckpoint(): Promise<ResumeOption>`
  - [ ] Check for existing checkpoint
  - [ ] Compare spec hash
  - [ ] Determine if resume is possible

- [ ] Implement `promptResumeAction(): Promise<'continue' | 'restart' | 'fresh'>`
  - [ ] Use @clack/prompts
  - [ ] Show checkpoint info (phase, timestamp)
  - [ ] Offer three options:
    - Continue from checkpoint
    - Start over (keep spec)
    - Start fresh (delete checkpoint)
  - [ ] Return user selection

- [ ] Implement `resumeFromCheckpoint(checkpoint: Checkpoint): PhaseContext`
  - [ ] Load checkpoint data
  - [ ] Restore phase context
  - [ ] Restore chat history
  - [ ] Restore decisions
  - [ ] Return context for phase execution

### Unit Tests
- [ ] Create `cli/src/checkpoint/store.test.ts`
  - [ ] Test save/load checkpoint
  - [ ] Test atomic write
  - [ ] Test spec hash computation
  - [ ] Test invalid checkpoint handling

- [ ] Create `cli/src/checkpoint/resume.test.ts`
  - [ ] Test checkpoint detection
  - [ ] Test resume prompt
  - [ ] Test resume context building
  - [ ] Test spec hash change detection

### Integration Test
- [ ] Test save checkpoint → restart → load checkpoint
- [ ] Test spec modification detection
- [ ] Test resume workflow from various phases

---

## Step 10: The 7 Phases

**Duration:** 4-5 days
**Location:** `cli/src/phases/`

### Phase Context Type
```typescript
interface PhaseContext {
  config: Config;
  specPath: string;
  outputDir: string;
  checkpoint: Checkpoint;
  aiClient: AIClient;
  verbose: boolean;
}

interface PhaseResult<T> {
  status: 'success' | 'error' | 'skip';
  data?: T;
  error?: Error;
  nextPhase?: string;
}
```

### Phase 1: Auth Check
- [ ] Create `cli/src/phases/auth-check.ts`
  - [ ] Check if credentials exist
  - [ ] If not, run provider selection
  - [ ] Execute OAuth flow
  - [ ] Test connection with API call
  - [ ] Save checkpoint: `auth-done`
  - [ ] Return provider info

### Phase 2: Spec Check
- [ ] Create `cli/src/phases/spec-check.ts`
  - [ ] Look for spec.md in current directory
  - [ ] If not found, offer options:
    - Create from template
    - Build interactively via chat
    - Specify custom path
  - [ ] If building via chat, guide user through questions
  - [ ] Generate spec.md file
  - [ ] Save checkpoint: `spec-ready`
  - [ ] Return spec path

### Phase 3: Spec Repair
- [ ] Create `cli/src/phases/spec-repair.ts`
  - [ ] Parse spec.md with unified/remark
  - [ ] Validate against Zod schema
  - [ ] For each validation error:
    - [ ] Show error to user
    - [ ] Ask AI for fix suggestions
    - [ ] Show suggestions to user
    - [ ] User approves or provides alternative
    - [ ] Write fix to spec.md
  - [ ] Re-validate until clean
  - [ ] Save checkpoint: `spec-valid`
  - [ ] Return validated spec

### Phase 4: AI Enhancement
- [ ] Create `cli/src/phases/spec-enhance.ts`
  - [ ] AI reviews complete valid spec
  - [ ] AI suggests UX improvements:
    - Better copy
    - Missing screens
    - Accessibility hints
    - Flow improvements
  - [ ] Present each suggestion to user
  - [ ] User approves or skips each
  - [ ] Write approved changes to spec.md
  - [ ] Allow skipping entire phase
  - [ ] Save checkpoint: `spec-enhanced`
  - [ ] Return enhanced spec

### Phase 5: Generation
- [ ] Create `cli/src/phases/generation.ts`
  - [ ] Read final spec into typed object
  - [ ] Build screen manifests
  - [ ] Render all Handlebars templates
  - [ ] Generate navigation state machine
  - [ ] Generate theme files
  - [ ] Generate hooks
  - [ ] Generate shared components
  - [ ] Build Stitch MCP prompts
  - [ ] If AI mode, enhance prompts with AI
  - [ ] Save all to in-memory buffer
  - [ ] Save checkpoint: `generated`
  - [ ] Return generated files

### Phase 6: Refinement Chat
- [ ] Create `cli/src/phases/refinement.ts`
  - [ ] Enter interactive chat mode
  - [ ] Load all generated files into AI context
  - [ ] User requests changes via chat
  - [ ] AI modifies relevant files
  - [ ] Show diffs to user
  - [ ] User confirms or reverts
  - [ ] Each change auto-saves checkpoint
  - [ ] User says "done" to exit
  - [ ] Save checkpoint: `refined`
  - [ ] Return final files

### Phase 7: Finalize
- [ ] Create `cli/src/phases/finalize.ts`
  - [ ] Run Prettier on all generated files
  - [ ] Write files to `./onboardkit-output/`
  - [ ] Write Stitch prompts to `stitch-prompts/`
  - [ ] Ask: "Connect to Stitch MCP to generate designs?"
  - [ ] If yes, call Stitch MCP tools for each screen
  - [ ] Print summary of generated files
  - [ ] Print next steps (npx expo start)
  - [ ] Save checkpoint: `complete`
  - [ ] Return completion status

### Phase Orchestrator
- [ ] Create phase execution orchestrator in `onboard.ts`
  - [ ] Check for existing checkpoint
  - [ ] Prompt for resume action
  - [ ] Execute phases in order
  - [ ] Pass context between phases
  - [ ] Handle phase errors
  - [ ] Save checkpoint after each phase
  - [ ] Allow Ctrl+C interruption

### Unit Tests
- [ ] Create test for each phase
  - [ ] Test success path
  - [ ] Test error handling
  - [ ] Test checkpoint saving
  - [ ] Test context passing

### Integration Test
- [ ] Test full 7-phase flow end-to-end
- [ ] Test resume from each phase
- [ ] Test error recovery
- [ ] Test user interruption and resume

---

## Step 11: CLI Commands

**Duration:** 2-3 days
**Location:** `cli/src/commands/`, `cli/src/index.ts`

### Main Entry Point
- [ ] Create `cli/src/index.ts`
  - [ ] Import commander
  - [ ] Define CLI name and version
  - [ ] Register all commands
  - [ ] Add global options (--verbose, --help, --version)
  - [ ] Handle uncaught errors
  - [ ] Parse arguments

### Command: onboard
- [ ] Create `cli/src/commands/onboard.ts`
  - [ ] Main guided walkthrough
  - [ ] Run all 7 phases with checkpoints
  - [ ] Options:
    - `--spec <path>` - Custom spec path
    - `--output <path>` - Custom output directory
    - `--provider <name>` - AI provider
    - `--skip-enhance` - Skip enhancement phase
    - `--verbose` - Detailed logging
  - [ ] Handle resume from checkpoint
  - [ ] Show progress indicators

### Command: init
- [ ] Create `cli/src/commands/init.ts`
  - [ ] Interactive spec.md creation
  - [ ] Use @clack/prompts for questions
  - [ ] Ask about app details:
    - App name
    - Primary/secondary colors
    - Number of onboarding steps
    - Include paywall? (soft/hard/both/none)
    - Login methods
  - [ ] Generate spec.md from template
  - [ ] Save to current directory
  - [ ] Show next steps

### Command: auth
- [ ] Create `cli/src/commands/auth.ts`
  - [ ] Subcommands:
    - `auth` (no args) - Interactive provider selection + OAuth
    - `auth status` - Show configured providers
    - `auth switch <provider>` - Change active provider
    - `auth revoke` - Delete stored credentials
  - [ ] Implement each subcommand
  - [ ] Show connection status
  - [ ] Test connection after auth

### Command: validate
- [ ] Create `cli/src/commands/validate.ts`
  - [ ] Parse spec.md
  - [ ] Validate against schema
  - [ ] Show summary if valid
  - [ ] Show detailed errors if invalid
  - [ ] Exit code 0 (valid) or 1 (invalid)
  - [ ] Options:
    - `--spec <path>` - Custom spec path
    - `--verbose` - Show full spec

### Command: generate
- [ ] Create `cli/src/commands/generate.ts`
  - [ ] Template-only generation (no AI)
  - [ ] Parse and validate spec
  - [ ] Generate all files
  - [ ] Write to output directory
  - [ ] Skip AI phases
  - [ ] Useful for offline use
  - [ ] Options:
    - `--spec <path>` - Custom spec path
    - `--output <path>` - Custom output directory

### Command: chat
- [ ] Create `cli/src/commands/chat.ts`
  - [ ] Open refinement chat on existing output
  - [ ] Load generated files into context
  - [ ] Interactive chat loop
  - [ ] Modify files based on requests
  - [ ] Save changes
  - [ ] Options:
    - `--output <path>` - Output directory path
    - `--provider <name>` - AI provider

### Command: reset
- [ ] Create `cli/src/commands/reset.ts`
  - [ ] Clear all checkpoints
  - [ ] Confirm before deletion
  - [ ] Show what will be deleted
  - [ ] Delete `.onboardkit/checkpoint.json`
  - [ ] Success message

### Command: eject
- [ ] Create `cli/src/commands/eject.ts`
  - [ ] Copy templates to local project
  - [ ] Create `./templates/` directory
  - [ ] Copy all template files
  - [ ] Show message about customization
  - [ ] CLI will use local templates if present

### CLI Help Text
- [ ] Write comprehensive help for each command
- [ ] Include examples for each command
- [ ] Document all options
- [ ] Provide usage patterns

### Unit Tests
- [ ] Test each command's core logic
- [ ] Test option parsing
- [ ] Test error handling
- [ ] Test exit codes

---

## Step 12: Example Specs

**Duration:** 1 day
**Location:** `cli/examples/`

### Finance App Example
- [ ] Create `cli/examples/finance-app.md`
  - [ ] Complete MyFinanceApp example from docs
  - [ ] Include all sections
  - [ ] Use realistic content
  - [ ] Include comments explaining sections

### Fitness App Example
- [ ] Create `cli/examples/fitness-app.md`
  - [ ] Fitness tracking app theme
  - [ ] 3 onboarding steps (track workouts, set goals, join community)
  - [ ] Soft paywall for premium features
  - [ ] Hard paywall for advanced plans
  - [ ] Different color scheme from finance

### SaaS App Example
- [ ] Create `cli/examples/saas-app.md`
  - [ ] Productivity/SaaS app theme
  - [ ] 2 onboarding steps (workspace setup, team collaboration)
  - [ ] Hard paywall only (no soft paywall)
  - [ ] Team/enterprise pricing model
  - [ ] Professional color scheme

### Validation
- [ ] Run `validate` command on each example
- [ ] Ensure all examples parse correctly
- [ ] Generate code from each example
- [ ] Verify generated code compiles

---

## Step 13: Build + Test

**Duration:** 2-3 days

### Build Verification
- [ ] Run `cd cli && pnpm build`
- [ ] Verify build succeeds
- [ ] Check `dist/index.js` has shebang
- [ ] Check bundle size (<2MB target)
- [ ] Verify TypeScript declaration files generated

### Local Testing
- [ ] Run `pnpm link` from `cli/` directory
- [ ] Test `onboardkit --version`
- [ ] Test `onboardkit --help`

#### Test: init Command
- [ ] Navigate to repo root
- [ ] Run `onboardkit init`
- [ ] Verify spec.md created
- [ ] Check content is valid

#### Test: validate Command
- [ ] Run `onboardkit validate spec.md`
- [ ] Verify it passes
- [ ] Shows summary output
- [ ] Test with invalid spec (should fail with errors)

#### Test: generate Command
- [ ] Run `onboardkit generate`
- [ ] Verify `onboardkit-output/` directory created
- [ ] Check all expected files present
- [ ] Count files (should be 20+ files)

#### Test: Generated Code Validity
- [ ] Navigate to `onboardkit-output/`
- [ ] Run `tsc --noEmit` on generated files
- [ ] Fix any TypeScript errors in templates
- [ ] Verify Prettier formatting applied

#### Test: Full onboard Flow
- [ ] Run `onboardkit onboard`
- [ ] Complete OAuth authentication
- [ ] Work through all 7 phases
- [ ] Verify checkpoints working
- [ ] Test resume by interrupting and restarting
- [ ] Verify final output

#### Test: Stitch Prompts
- [ ] Check `stitch-prompts/` directory created
- [ ] Verify prompt files for each screen
- [ ] Review prompt quality manually
- [ ] Ensure prompts contain theme colors
- [ ] Ensure prompts contain app context

### Cross-Platform Testing
- [ ] Test on macOS
  - [ ] OAuth flow works
  - [ ] Keychain storage works
  - [ ] All commands work
  - [ ] File paths correct

- [ ] Test on Linux
  - [ ] OAuth flow works
  - [ ] libsecret storage works (or file fallback)
  - [ ] All commands work
  - [ ] File paths correct

- [ ] Test on Windows
  - [ ] OAuth flow works
  - [ ] Credential Manager works (or file fallback)
  - [ ] All commands work
  - [ ] File paths correct (use path.resolve)

### Example Specs Testing
- [ ] Test with `finance-app.md`
  - [ ] Validate
  - [ ] Generate
  - [ ] Verify output

- [ ] Test with `fitness-app.md`
  - [ ] Validate
  - [ ] Generate
  - [ ] Verify output

- [ ] Test with `saas-app.md`
  - [ ] Validate
  - [ ] Generate
  - [ ] Verify output

### Edge Cases Testing
- [ ] Test with minimal spec (no optional sections)
- [ ] Test with maximal spec (all optional sections)
- [ ] Test with very long onboarding (10+ steps)
- [ ] Test with spec containing special characters
- [ ] Test with invalid colors
- [ ] Test with missing required fields
- [ ] Test with malformed markdown

### Performance Testing
- [ ] Measure startup time (<500ms target)
- [ ] Measure generation time for finance-app
- [ ] Measure build time (<5s target)
- [ ] Check bundle size (<2MB target)

### Test Coverage
- [ ] Run `pnpm test:coverage`
- [ ] Verify >80% coverage for core logic
- [ ] Identify untested areas
- [ ] Add tests for critical paths
- [ ] Review coverage report

---

## Post-Development Tasks

### Documentation
- [ ] Write comprehensive README.md
  - [ ] Add project description
  - [ ] Add installation instructions
  - [ ] Add quick start guide
  - [ ] Add full usage documentation
  - [ ] Add examples section
  - [ ] Add troubleshooting section
  - [ ] Add contributing guide
  - [ ] Add license

- [ ] Create terminal GIF demo
  - [ ] Use vhs or terminalizer
  - [ ] Show full `onboard` workflow
  - [ ] Include in README

- [ ] Document all CLI commands
  - [ ] Usage examples for each
  - [ ] Document all options
  - [ ] Provide real-world scenarios

- [ ] Create architecture diagram
  - [ ] Show 7 phases
  - [ ] Show file structure
  - [ ] Show data flow

### CI/CD Setup
- [ ] Create `.github/workflows/ci.yml`
  - [ ] Run tests on every push
  - [ ] Run tests on pull requests
  - [ ] Check code formatting
  - [ ] Check TypeScript compilation
  - [ ] Upload coverage reports

- [ ] Create `.github/workflows/publish.yml`
  - [ ] Trigger on release creation
  - [ ] Run full test suite
  - [ ] Build production bundle
  - [ ] Publish to npm with OIDC
  - [ ] Include `--provenance` flag

- [ ] Configure Changesets
  - [ ] Install @changesets/cli
  - [ ] Run `changeset init`
  - [ ] Configure changelog format
  - [ ] Set up GitHub bot for automated releases

### npm Package Setup
- [ ] Configure npm organization (if needed)
- [ ] Set up trusted publishing with OIDC
  - [ ] Configure npm token in GitHub secrets
  - [ ] Enable provenance attestation
  - [ ] Configure 2FA requirement

- [ ] Publish v0.1.0 (alpha)
  - [ ] Test publish process
  - [ ] Verify package installs correctly
  - [ ] Test `npx onboardkit`

### Quality Assurance
- [ ] Code review checklist
  - [ ] No `any` types in production code
  - [ ] All functions have JSDoc comments
  - [ ] Error handling is comprehensive
  - [ ] Security best practices followed
  - [ ] Performance is acceptable

- [ ] Security audit
  - [ ] Run `npm audit`
  - [ ] Check for vulnerable dependencies
  - [ ] Review credential storage implementation
  - [ ] Review file path validation
  - [ ] Review template injection prevention

### Launch Preparation
- [ ] Prepare launch announcement
  - [ ] Write blog post about the project
  - [ ] Create Twitter/X announcement thread
  - [ ] Prepare Product Hunt description
  - [ ] Create demo video

- [ ] Set up community channels
  - [ ] Enable GitHub Discussions
  - [ ] Create issue templates
  - [ ] Set up PR template
  - [ ] Create CODE_OF_CONDUCT.md
  - [ ] Create CONTRIBUTING.md

---

## Launch (v1.0)

### Pre-Launch Checklist
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Terminal GIF created
- [ ] Examples validated
- [ ] Cross-platform tested
- [ ] CI/CD working
- [ ] npm package configured

### Launch Day
- [ ] Publish v1.0 to npm
- [ ] Create GitHub release
- [ ] Post on Product Hunt
- [ ] Post on Reddit (r/reactnative, r/expo, r/webdev, r/SideProject)
- [ ] Post on Hacker News (Show HN)
- [ ] Post on Twitter/X
- [ ] Post on Indie Hackers
- [ ] Announce in Expo Discord
- [ ] Announce in React Native Discord

### Post-Launch
- [ ] Monitor GitHub issues
- [ ] Respond to community questions
- [ ] Track metrics (stars, downloads, issues)
- [ ] Gather user feedback
- [ ] Plan v1.1 improvements

---

## Success Metrics Tracking

### 30-Day Goals
- [ ] 200+ GitHub stars
- [ ] 100+ npm weekly downloads
- [ ] 20+ GitHub issues (engagement)
- [ ] 5+ community PRs
- [ ] 3+ example specs contributed

### 90-Day Goals
- [ ] 1,000+ GitHub stars
- [ ] 500+ npm weekly downloads
- [ ] 10+ showcase projects
- [ ] 5+ blog mentions
- [ ] 50+ forks

### Quality Metrics
- [ ] >80% test coverage
- [ ] <5s build time
- [ ] <500ms startup time
- [ ] <2MB bundle size
- [ ] 100% type safety (no `any`)

---

## Troubleshooting Common Issues

### Build Fails
- [ ] Check Node.js version (>= 22)
- [ ] Check all dependencies installed
- [ ] Clear node_modules and reinstall
- [ ] Check tsconfig.json configuration
- [ ] Verify no TypeScript errors

### Tests Fail
- [ ] Run tests individually to isolate failures
- [ ] Check test environment setup
- [ ] Verify mock data is correct
- [ ] Check for race conditions in async tests
- [ ] Review test coverage for gaps

### OAuth Not Working
- [ ] Check redirect URI is whitelisted
- [ ] Verify client ID is correct
- [ ] Check callback server port is available
- [ ] Verify network connectivity
- [ ] Test with manual token entry fallback

### Generated Code Has Errors
- [ ] Check template syntax
- [ ] Verify Handlebars data is correct
- [ ] Run Prettier on templates
- [ ] Test template with sample data
- [ ] Check TypeScript compilation

---

**Total Estimated Time:** 4-5 weeks (solo developer)

**Status:** Ready to begin implementation ✅

**Next Step:** Start with Step 1 - Project Scaffolding
