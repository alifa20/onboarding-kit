# Architecture Documentation

Technical architecture and design decisions for OnboardKit.

## System Overview

OnboardKit is a Node.js CLI tool that transforms markdown specifications into production-ready React Native/Expo code through a combination of template rendering and AI enhancement.

```
┌─────────────┐
│   Markdown  │
│   Spec      │
└──────┬──────┘
       │
       ▼
┌─────────────┐       ┌──────────────┐
│   Parser    │──────▶│  Validator   │
│  (unified)  │       │    (Zod)     │
└──────┬──────┘       └──────┬───────┘
       │                     │
       │              ┌──────▼───────┐
       │              │  AI Provider │
       │              │  (Optional)  │
       │              └──────┬───────┘
       │                     │
       ▼                     ▼
┌─────────────────────────────────┐
│      Template Engine            │
│       (Handlebars)              │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│     Code Generator              │
│  (TypeScript + Prettier)        │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│   File Writer (Atomic)          │
└──────────────┬──────────────────┘
               │
               ▼
       Generated Code
```

## Core Modules

### 1. Spec System (`lib/spec/`)

**Purpose:** Parse and validate markdown specifications.

**Components:**

```
lib/spec/
├── parser.ts          # Markdown → AST → Object
├── validator.ts       # Zod schema validation
├── schema.ts          # Type definitions
├── hash.ts            # Spec change detection
└── index.ts           # Public API
```

**Flow:**

```typescript
Markdown File
    ↓ (unified + remark-parse)
Abstract Syntax Tree (AST)
    ↓ (walk + extract sections)
Raw JavaScript Object
    ↓ (Zod validation)
Typed OnboardingSpec
```

**Key Decisions:**

- **unified + remark** for robust markdown parsing
- **Zod** for runtime validation with TypeScript inference
- **SHA-256 hash** for change detection (checkpoint system)

**Example:**

```typescript
// Input: spec.md
# MyApp

## Theme
- Primary: #6366F1

// Parser output (intermediate)
{
  projectName: "MyApp",
  theme: { primary: "#6366F1" }
}

// Validator output (final)
OnboardingSpec {
  projectName: string,
  theme: Theme { primary: string }  // Fully typed
}
```

---

### 2. Template System (`lib/templates/`)

**Purpose:** Render Handlebars templates to generate TypeScript code.

**Components:**

```
lib/templates/
├── renderer.ts         # Template compilation & rendering
├── helpers.ts          # Handlebars custom helpers
├── context-builder.ts  # Spec → Template context
└── index.ts            # Public API
```

**Template Flow:**

```
OnboardingSpec
    ↓ (buildTemplateContext)
Template Context
    {
      colors: { primary, secondary, ... },
      screens: [ {...}, {...} ],
      navigation: { ... }
    }
    ↓ (Handlebars.compile)
Rendered Code (String)
    ↓ (Prettier.format)
Formatted TypeScript
```

**Custom Helpers:**

```handlebars
{{pascalCase projectName}}  → PascalCase
{{camelCase fieldName}}     → camelCase
{{kebabCase screenName}}    → kebab-case
{{eq value "expected"}}     → boolean
{{includes array value}}    → boolean
```

**Template Structure:**

```
templates/expo/
├── screens/
│   ├── WelcomeScreen.tsx.hbs
│   ├── OnboardingStep.tsx.hbs
│   ├── LoginScreen.tsx.hbs
│   └── NameCaptureScreen.tsx.hbs
├── navigation/
│   ├── stack.tsx.hbs
│   └── types.ts.hbs
├── theme/
│   ├── colors.ts.hbs
│   ├── typography.ts.hbs
│   └── spacing.ts.hbs
└── components/
    ├── Button.tsx.hbs
    ├── Input.tsx.hbs
    └── Card.tsx.hbs
```

**Key Decisions:**

- **Handlebars** - Simple, logic-less templates
- **TSX templates** - Generate TypeScript directly (not JSX)
- **Prettier post-processing** - Ensures consistent formatting
- **Context builder** - Centralizes data transformation

---

### 3. OAuth System (`lib/oauth/`)

**Purpose:** Secure authentication with AI providers using OAuth 2.0 + PKCE.

**Components:**

```
lib/oauth/
├── flow.ts              # OAuth flow orchestration
├── pkce.ts              # PKCE implementation
├── callback-server.ts   # Localhost callback server
├── token-manager.ts     # Token lifecycle management
├── storage.ts           # Secure credential storage
├── providers.ts         # Provider configurations
└── types.ts             # OAuth types
```

**OAuth Flow:**

```
1. Generate code_verifier (random 43-128 chars)
2. Generate code_challenge (SHA256 + BASE64-URL)
3. Build authorization URL with challenge
4. Open browser to provider's auth page
5. Start localhost callback server (port 3000)
6. User authorizes in browser
7. Provider redirects to localhost:3000
8. Callback server receives authorization code
9. Exchange code + verifier for tokens
10. Store tokens securely
11. Shutdown callback server
```

**PKCE Implementation (RFC 7636):**

```typescript
// Code Verifier: 43-128 unreserved characters
const verifier = base64url(randomBytes(32));

// Code Challenge: BASE64-URL(SHA256(verifier))
const challenge = base64url(sha256(verifier));

// Authorization URL
const authUrl = buildUrl({
  client_id,
  redirect_uri: 'http://localhost:3000/callback',
  code_challenge: challenge,
  code_challenge_method: 'S256',
  response_type: 'code',
  scope: 'openid profile',
});

// Token exchange
POST /oauth/token
{
  code: authorizationCode,
  code_verifier: verifier,
  client_id,
  redirect_uri,
  grant_type: 'authorization_code'
}
```

**Credential Storage:**

```
Priority 1: OS Native Keychain
  ├── macOS: Keychain
  ├── Linux: Secret Service (libsecret)
  └── Windows: Credential Manager

Priority 2: Encrypted File Fallback
  └── ~/.onboardkit/credentials.json
      (AES-256-GCM encrypted)
```

**Token Management:**

```typescript
interface StoredTokens {
  access_token: string;
  refresh_token?: string;
  expires_at: number;  // Unix timestamp
}

// Auto-refresh logic
async function getValidAccessToken() {
  const tokens = await loadTokens();

  if (isExpired(tokens, bufferSeconds: 300)) {
    return await refreshToken(tokens.refresh_token);
  }

  return tokens.access_token;
}
```

**Key Decisions:**

- **PKCE** - More secure than client secrets for CLI apps
- **Localhost callback** - Standard OAuth flow for desktop apps
- **Keyring-first** - OS-native security when available
- **5-minute expiry buffer** - Proactive refresh before expiration
- **2-minute timeout** - Callback server auto-shutdown

---

### 4. AI Integration (`lib/ai/`)

**Purpose:** Communicate with AI providers for validation, enhancement, and chat.

**Components:**

```
lib/ai/
├── providers/
│   ├── factory.ts       # Provider factory
│   ├── anthropic.ts     # Claude client
│   └── types.ts         # Provider interface
├── operations/
│   ├── validate.ts      # Spec validation
│   ├── repair.ts        # Fix validation errors
│   └── enhance.ts       # UX enhancement
├── prompts/
│   └── index.ts         # Prompt templates
├── parser.ts            # Parse AI responses
├── context.ts           # Conversation context
└── errors.ts            # Error types
```

**Provider Abstraction:**

```typescript
interface AIProvider {
  name: string;
  chat(messages: Message[]): Promise<string>;
  streamChat(messages: Message[]): AsyncIterable<string>;
}

// Factory pattern
function createAIClient(provider: string, token: string): AIProvider {
  switch (provider) {
    case 'anthropic':
      return new AnthropicProvider(token);
    case 'google':
      return new GoogleProvider(token);
    // ...
  }
}
```

**AI Operations:**

```typescript
// 1. Validation
validateWithAI(spec, client) → AIValidationResult

// 2. Repair
repairSpec(spec, errors, client) → Enhancement[]

// 3. Enhancement
enhanceSpec(spec, client) → Enhancement[]
```

**Prompt Structure:**

```typescript
const systemPrompt = `
You are an expert UX designer specializing in mobile onboarding.
Review specs and suggest improvements for:
- Copy quality
- User flow
- Accessibility
- Design best practices
`;

const userPrompt = `
Here is an onboarding spec:
${JSON.stringify(spec)}

Suggest improvements. Format as JSON:
[
  {
    "type": "copy",
    "field": "welcome.headline",
    "current": "...",
    "suggested": "...",
    "reasoning": "..."
  }
]
`;
```

**Key Decisions:**

- **Provider abstraction** - Easy to add new providers
- **Structured JSON output** - Reliable parsing
- **Retry logic** - Handle transient failures
- **Streaming support** - Real-time chat UX

---

### 5. Output System (`lib/output/`)

**Purpose:** Write generated files to disk safely and efficiently.

**Components:**

```
lib/output/
├── writer.ts        # File writing
├── structure.ts     # Directory structure
├── metadata.ts      # Generation metadata
├── validator.ts     # Output validation
├── logger.ts        # Progress logging
└── summary.ts       # Generation summary
```

**File Writing Strategy:**

```typescript
// Atomic write pattern
async function atomicWrite(path: string, content: string) {
  const tempPath = `${path}.tmp`;

  // 1. Write to temp file
  await writeFile(tempPath, content);

  // 2. Atomic rename
  await rename(tempPath, path);

  // 3. Set permissions
  await chmod(path, 0o644);
}
```

**Directory Structure Generation:**

```typescript
const structure = {
  screens: [],
  navigation: [],
  theme: [],
  components: [],
};

// Create structure
await createDirectoryStructure(outputDir, structure);

// Output:
// outputDir/
// ├── screens/
// ├── navigation/
// ├── theme/
// └── components/
```

**Key Decisions:**

- **Atomic writes** - Prevent partial file corruption
- **Directory pre-creation** - Avoid race conditions
- **Progress logging** - User feedback during generation
- **Metadata file** - Track generation parameters

---

### 6. Workflow System (`lib/workflow/`)

**Purpose:** Orchestrate 7-phase onboarding workflow with checkpoints.

**Components:**

```
lib/workflow/
├── checkpoint.ts    # Checkpoint management
├── progress.ts      # Phase progress tracking
└── types.ts         # Workflow types
```

**Checkpoint System:**

```typescript
interface Checkpoint {
  phase: number;           // 1-7
  timestamp: string;       // ISO 8601
  specHash: string;        // SHA-256
  specPath: string;        // ./spec.md
  decisions: Record<string, unknown>;
  chatHistory: Message[];
  phaseData: Record<string, unknown>;
}

// Save after each phase
await saveCheckpoint({
  phase: 4,
  timestamp: new Date().toISOString(),
  specHash: await computeSpecHash('./spec.md'),
  ...
});

// Resume logic
const checkpoint = await loadCheckpoint();

if (checkpoint && specHashMatches(checkpoint)) {
  // Resume from saved phase
  resumeFromPhase(checkpoint.phase);
} else {
  // Spec changed, restart
  startFromPhase1();
}
```

**The 7 Phases:**

```typescript
enum Phase {
  AuthCheck = 1,      // Verify authentication
  SpecCheck = 2,      // Validate spec
  SpecRepair = 3,     // Fix validation errors
  AIEnhancement = 4,  // Suggest improvements
  Generation = 5,     // Generate code
  Refinement = 6,     // Interactive chat
  Finalize = 7,       // Write files
}

// Execute phases
for (const phase of phases) {
  const result = await executePhase(phase, context);

  if (result.error) {
    await saveCheckpoint({ phase, error: result.error });
    throw result.error;
  }

  await saveCheckpoint({ phase, data: result.data });
}
```

**Key Decisions:**

- **Checkpoint after each phase** - Maximize resume capability
- **Spec hash validation** - Detect external modifications
- **Chat history preservation** - Maintain AI context
- **Graceful interruption** - Save state on Ctrl+C

---

## Data Flow

### Complete Generation Flow

```
1. User Input
   ├── spec.md (markdown file)
   └── CLI commands

2. Parsing Phase
   ├── Read spec.md
   ├── Parse markdown (unified)
   ├── Extract sections
   └── Build JS object

3. Validation Phase
   ├── Load Zod schemas
   ├── Validate object
   ├── Return errors or typed spec
   └── (Optional) AI validation

4. Enhancement Phase (Optional)
   ├── Send spec to AI
   ├── Get enhancement suggestions
   ├── User approval
   └── Update spec

5. Template Phase
   ├── Build template context
   ├── Load Handlebars templates
   ├── Render each template
   ├── Format with Prettier
   └── Collect generated files

6. Output Phase
   ├── Create directory structure
   ├── Write files atomically
   ├── Set permissions
   ├── Generate metadata
   └── Show summary

7. Integration
   ├── User copies files to project
   ├── Installs dependencies
   ├── Adds navigation
   └── Tests app
```

### AI-Enhanced Flow

```
User → Spec → Parser → Validator
                           ↓ (validation errors)
                       AI Repair
                           ↓ (suggestions)
                    User Approval
                           ↓
                   Enhanced Spec → AI Enhancement
                                       ↓
                                 User Approval
                                       ↓
                             Template Rendering
                                       ↓
                               Generated Code
                                       ↓
                           (Optional) Chat Refinement
                                       ↓
                                  Final Output
```

---

## Key Design Decisions

### Why Markdown?

**Pros:**
- Git-friendly (text-based, diff-able)
- Human-readable
- Easy to write
- No special editor needed
- Version control works well

**Cons:**
- Less structured than JSON/YAML
- Parsing complexity

**Decision:** Readability and git-friendliness outweigh parsing complexity.

---

### Why Handlebars?

**Alternatives Considered:**
- JSX templates (too complex)
- String templates (no logic)
- AST manipulation (too low-level)
- Code generation libraries (too opinionated)

**Decision:** Handlebars provides the right balance of simplicity and power for generating TypeScript code.

---

### Why OAuth vs API Keys?

**API Keys:**
- ✅ Simpler to implement
- ❌ User must pay for API access
- ❌ Security risk (easily leaked)
- ❌ Manual setup

**OAuth:**
- ✅ Leverage existing subscriptions (zero cost)
- ✅ More secure (no secrets in CLI)
- ✅ Better UX (browser auth)
- ❌ More complex to implement

**Decision:** OAuth's zero-cost and security benefits justify the complexity.

---

### Why Checkpoint System?

**Problem:** Long-running AI workflows can be interrupted.

**Solution:** Save state after each phase.

**Benefits:**
- Resume after crashes
- Resume after user interruption (Ctrl+C)
- Resume after network failures
- Detect spec modifications

**Trade-off:** Extra I/O, but worth it for reliability.

---

### Why TypeScript Output?

**Alternatives:**
- JavaScript (less type safety)
- Flow (less popular)
- ReasonML (too different)

**Decision:** TypeScript is the standard in React Native ecosystem. Strict mode ensures quality.

---

## Performance Considerations

### Parsing Performance

- **unified** uses streaming parser (handles large specs)
- **Zod** validation is fast (compiled at runtime)
- **Caching** - Spec hash prevents re-parsing unchanged specs

### Template Rendering

- **Handlebars compilation** - Templates compiled once, reused
- **Prettier** - Only format final output (not intermediate)
- **Parallel rendering** - Independent templates render concurrently

### File I/O

- **Atomic writes** - Prevents corruption but doubles I/O
- **Async operations** - Non-blocking file writes
- **Batch writes** - Write all files in one pass

### Memory Usage

- **Streaming** - Large specs processed in chunks
- **Garbage collection** - Templates dereferenced after use
- **Spec size limit** - Practical limit ~1MB (hundreds of screens)

---

## Extensibility

### Adding New Screen Templates

```typescript
// 1. Create template
templates/expo/screens/NewScreen.tsx.hbs

// 2. Update schema
export const NewScreenSchema = z.object({
  headline: z.string(),
  // ...
});

// 3. Update parser
if (sectionName === 'New Screen') {
  spec.newScreen = parseNewScreenSection(section);
}

// 4. Update renderer
if (spec.newScreen) {
  files.push(renderTemplate('NewScreen', spec.newScreen));
}
```

### Adding New AI Provider

```typescript
// 1. Implement provider
class NewProvider implements AIProvider {
  async chat(messages: Message[]): Promise<string> {
    // Implementation
  }
}

// 2. Register provider
const PROVIDERS = {
  anthropic: AnthropicProvider,
  google: GoogleProvider,
  new: NewProvider,  // Add here
};

// 3. Add OAuth config
const NEW_PROVIDER_CONFIG = {
  authUrl: '...',
  tokenUrl: '...',
  // ...
};
```

### Adding Custom Handlebars Helpers

```typescript
// Register helper
Handlebars.registerHelper('customHelper', (value: string) => {
  return value.toUpperCase();
});

// Use in template
{{customHelper headline}}
```

---

## Testing Strategy

### Unit Tests

```
lib/spec/__tests__/         # Parser tests
lib/oauth/__tests__/        # OAuth tests
lib/templates/__tests__/    # Template tests
lib/ai/__tests__/           # AI tests
```

### Integration Tests

```
src/__tests__/integration/
├── full-generation.test.ts
├── oauth-flow.test.ts
└── checkpoint-resume.test.ts
```

### Test Coverage Goals

- Core logic: >80%
- OAuth system: >90% (security-critical)
- Parser: >85%
- Templates: >70% (visual output)

---

## Security Considerations

### Credential Storage

- OS keychain preferred
- Fallback uses AES-256-GCM
- Key derived from machine ID (not stored)
- File permissions: 600 (owner read/write only)

### OAuth Security

- PKCE prevents authorization code interception
- State parameter prevents CSRF
- 2-minute timeout limits exposure window
- No client secrets (public client)

### Input Validation

- Zod validates all user input
- Hex color regex prevents injection
- File paths validated (no .. traversal)
- Template data sanitized

### Dependency Security

- Regular `npm audit`
- Minimal dependencies
- Pinned versions for security-critical packages

---

## Deployment

### Build Process

```bash
# TypeScript compilation + bundling
tsup src/index.ts --format esm

# Output:
dist/index.js          # Bundled code
dist/index.d.ts        # Type definitions
dist/index.js.map      # Source maps
```

### npm Package

```json
{
  "bin": {
    "onboardkit": "./dist/index.js"
  },
  "files": [
    "dist",
    "templates"
  ],
  "engines": {
    "node": ">=22"
  }
}
```

### CI/CD

```yaml
# GitHub Actions
- Run tests
- Build production bundle
- Publish to npm (with provenance)
- Create GitHub release
```

---

## Monitoring & Debugging

### Logging Levels

```typescript
enum LogLevel {
  Silent = 0,   // No output
  Normal = 1,   // Progress messages
  Verbose = 2,  // Detailed logs
  Debug = 3,    // Internal debugging
}
```

### Debug Mode

```bash
# Enable verbose logging
onboardkit generate --verbose

# Environment variable
DEBUG=onboardkit:* onboardkit generate
```

### Error Reporting

```typescript
// Structured errors
class OnboardKitError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, unknown>
  ) {
    super(message);
  }
}

// Usage
throw new OnboardKitError(
  'Validation failed',
  'VALIDATION_ERROR',
  { errors: validationErrors }
);
```

---

## Future Architecture Improvements

### Planned Enhancements

1. **Plugin System** - Allow community plugins
2. **Template Registry** - npm packages for templates
3. **Language Server Protocol** - IDE support for spec.md
4. **Web UI** - Browser-based spec editor
5. **Template Versioning** - Semantic versioning for templates

### Scalability Considerations

- **Large specs** - Streaming parser handles 10,000+ line specs
- **Many screens** - Parallel rendering scales linearly
- **Multiple providers** - Factory pattern adds new providers easily

---

## See Also

- [Contributing Guide](../CONTRIBUTING.md) - Development guidelines
- [API Documentation](API.md) - Public API reference
- [User Guide](USER-GUIDE.md) - End-user documentation
