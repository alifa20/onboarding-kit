# API Documentation

Documentation for OnboardKit's public APIs and programmatic usage.

## Overview

While OnboardKit is primarily a CLI tool, its core functionality is exposed as importable modules for programmatic use in Node.js scripts or custom build tools.

## Installation for Programmatic Use

```bash
npm install onboardkit
```

## Core Modules

### Spec Parser

Parse and validate markdown specifications.

#### `parseSpec`

Parse a markdown spec file into a typed object.

**Import:**
```typescript
import { parseSpec } from 'onboardkit/lib/spec';
```

**Signature:**
```typescript
function parseSpec(content: string): OnboardingSpec
```

**Parameters:**
- `content` (string) - Raw markdown content

**Returns:**
- `OnboardingSpec` - Parsed and typed specification object

**Throws:**
- `SpecParseError` - If markdown cannot be parsed

**Example:**
```typescript
import { readFileSync } from 'fs';
import { parseSpec } from 'onboardkit/lib/spec';

const content = readFileSync('./spec.md', 'utf-8');
const spec = parseSpec(content);

console.log(spec.projectName);  // "FitTrack Pro"
console.log(spec.theme.primary); // "#F59E0B"
```

---

#### `validateSpec`

Validate a parsed spec against the schema.

**Import:**
```typescript
import { validateSpec } from 'onboardkit/lib/spec';
```

**Signature:**
```typescript
function validateSpec(
  spec: unknown
): ValidationResult<OnboardingSpec>
```

**Parameters:**
- `spec` (unknown) - Spec object to validate

**Returns:**
```typescript
type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: ValidationError[] }
```

**Example:**
```typescript
import { parseSpec, validateSpec } from 'onboardkit/lib/spec';

const content = readFileSync('./spec.md', 'utf-8');
const parsed = parseSpec(content);
const result = validateSpec(parsed);

if (result.success) {
  console.log('Valid spec:', result.data);
} else {
  console.error('Validation errors:');
  result.errors.forEach(err => {
    console.error(`  ${err.path.join('.')}: ${err.message}`);
  });
}
```

---

#### `computeSpecHash`

Compute SHA-256 hash of spec file for change detection.

**Import:**
```typescript
import { computeSpecHash } from 'onboardkit/lib/spec';
```

**Signature:**
```typescript
function computeSpecHash(filePath: string): Promise<string>
```

**Parameters:**
- `filePath` (string) - Path to spec file

**Returns:**
- `Promise<string>` - Hex-encoded SHA-256 hash

**Example:**
```typescript
import { computeSpecHash } from 'onboardkit/lib/spec';

const hash = await computeSpecHash('./spec.md');
console.log(hash); // "abc123..."

// Later, check if spec changed
const newHash = await computeSpecHash('./spec.md');
if (hash !== newHash) {
  console.log('Spec has been modified');
}
```

---

### Template System

Render Handlebars templates to generate code.

#### `renderTemplate`

Render a single template with data.

**Import:**
```typescript
import { renderTemplate } from 'onboardkit/lib/templates';
```

**Signature:**
```typescript
function renderTemplate(
  templateName: string,
  data: Record<string, unknown>
): string
```

**Parameters:**
- `templateName` (string) - Template name (without .hbs extension)
- `data` (object) - Template context data

**Returns:**
- `string` - Rendered template content

**Example:**
```typescript
import { renderTemplate } from 'onboardkit/lib/templates';

const code = renderTemplate('WelcomeScreen', {
  headline: 'Welcome',
  subtext: 'Get started',
  primaryColor: '#6366F1',
});

console.log(code);
// TypeScript code for WelcomeScreen component
```

---

#### `buildTemplateContext`

Build template rendering context from spec.

**Import:**
```typescript
import { buildTemplateContext } from 'onboardkit/lib/templates';
```

**Signature:**
```typescript
function buildTemplateContext(
  spec: OnboardingSpec
): TemplateContext
```

**Parameters:**
- `spec` (OnboardingSpec) - Validated spec object

**Returns:**
- `TemplateContext` - Context object for template rendering

**Example:**
```typescript
import { buildTemplateContext } from 'onboardkit/lib/templates';

const context = buildTemplateContext(spec);

console.log(context.colors);      // Extracted color palette
console.log(context.screens);     // Screen manifests
console.log(context.navigation);  // Navigation structure
```

---

#### `renderAllTemplates`

Render all templates for a spec.

**Import:**
```typescript
import { renderAllTemplates } from 'onboardkit/lib/templates';
```

**Signature:**
```typescript
function renderAllTemplates(
  spec: OnboardingSpec
): Promise<GeneratedFile[]>
```

**Parameters:**
- `spec` (OnboardingSpec) - Validated spec object

**Returns:**
- `Promise<GeneratedFile[]>` - Array of generated files

**Example:**
```typescript
import { renderAllTemplates } from 'onboardkit/lib/templates';

const files = await renderAllTemplates(spec);

files.forEach(file => {
  console.log(`${file.path} (${file.content.length} chars)`);
});
```

---

### OAuth System

Manage AI provider authentication.

#### `getValidAccessToken`

Get a valid access token (auto-refreshes if needed).

**Import:**
```typescript
import { getValidAccessToken } from 'onboardkit/lib/oauth';
```

**Signature:**
```typescript
function getValidAccessToken(
  provider: string
): Promise<string | null>
```

**Parameters:**
- `provider` (string) - Provider name (e.g., 'anthropic')

**Returns:**
- `Promise<string | null>` - Access token or null if not authenticated

**Throws:**
- `OAuthError` - If token refresh fails

**Example:**
```typescript
import { getValidAccessToken } from 'onboardkit/lib/oauth';

const token = await getValidAccessToken('anthropic');

if (token) {
  // Use token for API calls
  console.log('Authenticated');
} else {
  console.log('Not authenticated - run auth flow');
}
```

---

#### `startOAuthFlow`

Start interactive OAuth 2.0 + PKCE flow.

**Import:**
```typescript
import { startOAuthFlow } from 'onboardkit/lib/oauth';
```

**Signature:**
```typescript
function startOAuthFlow(
  provider: string
): Promise<OAuthTokens>
```

**Parameters:**
- `provider` (string) - Provider name

**Returns:**
```typescript
interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}
```

**Example:**
```typescript
import { startOAuthFlow } from 'onboardkit/lib/oauth';

const tokens = await startOAuthFlow('anthropic');

console.log('Access token:', tokens.access_token);
console.log('Expires in:', tokens.expires_in, 'seconds');
```

---

#### `revokeCredentials`

Revoke and delete stored credentials.

**Import:**
```typescript
import { revokeCredentials } from 'onboardkit/lib/oauth';
```

**Signature:**
```typescript
function revokeCredentials(
  provider: string
): Promise<void>
```

**Example:**
```typescript
import { revokeCredentials } from 'onboardkit/lib/oauth';

await revokeCredentials('anthropic');
console.log('Credentials revoked');
```

---

### AI Integration

#### `createAIClient`

Create AI provider client.

**Import:**
```typescript
import { createAIClient } from 'onboardkit/lib/ai';
```

**Signature:**
```typescript
function createAIClient(
  provider: string,
  accessToken: string
): AIClient
```

**Parameters:**
- `provider` (string) - Provider name
- `accessToken` (string) - Valid access token

**Returns:**
```typescript
interface AIClient {
  chat(messages: Message[]): Promise<string>;
  streamChat(messages: Message[]): AsyncIterable<string>;
}
```

**Example:**
```typescript
import { createAIClient } from 'onboardkit/lib/ai';
import { getValidAccessToken } from 'onboardkit/lib/oauth';

const token = await getValidAccessToken('anthropic');
const client = createAIClient('anthropic', token);

const response = await client.chat([
  { role: 'user', content: 'Suggest a better headline for: "Welcome"' }
]);

console.log('AI response:', response);
```

---

#### `validateWithAI`

Validate spec with AI assistance.

**Import:**
```typescript
import { validateWithAI } from 'onboardkit/lib/ai';
```

**Signature:**
```typescript
function validateWithAI(
  spec: unknown,
  client: AIClient
): Promise<AIValidationResult>
```

**Returns:**
```typescript
interface AIValidationResult {
  valid: boolean;
  suggestions: Array<{
    field: string;
    issue: string;
    suggestion: string;
  }>;
}
```

**Example:**
```typescript
import { validateWithAI } from 'onboardkit/lib/ai';

const result = await validateWithAI(spec, client);

if (!result.valid) {
  result.suggestions.forEach(s => {
    console.log(`${s.field}: ${s.issue}`);
    console.log(`Suggestion: ${s.suggestion}`);
  });
}
```

---

#### `enhanceSpec`

Get AI suggestions for spec improvements.

**Import:**
```typescript
import { enhanceSpec } from 'onboardkit/lib/ai';
```

**Signature:**
```typescript
function enhanceSpec(
  spec: OnboardingSpec,
  client: AIClient
): Promise<Enhancement[]>
```

**Returns:**
```typescript
interface Enhancement {
  type: 'copy' | 'ux' | 'accessibility' | 'flow';
  field: string;
  current: string;
  suggested: string;
  reasoning: string;
}
```

**Example:**
```typescript
import { enhanceSpec } from 'onboardkit/lib/ai';

const enhancements = await enhanceSpec(spec, client);

enhancements.forEach(e => {
  console.log(`[${e.type}] ${e.field}`);
  console.log(`Current: ${e.current}`);
  console.log(`Suggested: ${e.suggested}`);
  console.log(`Why: ${e.reasoning}\n`);
});
```

---

### Output Management

#### `writeGeneratedFiles`

Write generated files to disk.

**Import:**
```typescript
import { writeGeneratedFiles } from 'onboardkit/lib/output';
```

**Signature:**
```typescript
function writeGeneratedFiles(
  files: GeneratedFile[],
  outputDir: string,
  options?: WriteOptions
): Promise<void>
```

**Parameters:**
- `files` (GeneratedFile[]) - Array of files to write
- `outputDir` (string) - Output directory path
- `options` (object, optional)
  - `overwrite` (boolean) - Overwrite existing files
  - `dryRun` (boolean) - Preview without writing

**Example:**
```typescript
import { renderAllTemplates } from 'onboardkit/lib/templates';
import { writeGeneratedFiles } from 'onboardkit/lib/output';

const files = await renderAllTemplates(spec);

await writeGeneratedFiles(files, './output', {
  overwrite: true
});

console.log(`Wrote ${files.length} files`);
```

---

#### `validateImports`

Validate generated code has no import errors.

**Import:**
```typescript
import { validateImports } from 'onboardkit/lib/output';
```

**Signature:**
```typescript
function validateImports(
  files: GeneratedFile[]
): ValidationResult<void>
```

**Example:**
```typescript
import { validateImports } from 'onboardkit/lib/output';

const result = validateImports(files);

if (!result.success) {
  console.error('Import errors found:');
  result.errors.forEach(e => console.error(e.message));
}
```

---

## Types

### Core Types

```typescript
import type {
  OnboardingSpec,
  Theme,
  WelcomeScreen,
  OnboardingStep,
  Login,
  NameCapture,
  SoftPaywall,
  HardPaywall,
} from 'onboardkit/types';
```

### Generated File

```typescript
interface GeneratedFile {
  path: string;       // Relative path
  content: string;    // File contents
  language: 'typescript' | 'json';
}
```

### Validation Result

```typescript
type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: ValidationError[] };

interface ValidationError {
  path: string[];
  message: string;
  code: string;
}
```

### Template Context

```typescript
interface TemplateContext {
  projectName: string;
  colors: Record<string, string>;
  typography: Record<string, unknown>;
  spacing: Record<string, number>;
  screens: ScreenManifest[];
  navigation: NavigationManifest;
}
```

---

## Error Handling

All OnboardKit APIs follow consistent error patterns:

### Error Types

```typescript
class SpecParseError extends Error {
  constructor(message: string, line?: number);
}

class SpecValidationError extends Error {
  constructor(message: string, errors: ValidationError[]);
}

class OAuthError extends Error {
  constructor(message: string, code: string);
}

class AIError extends Error {
  constructor(message: string, provider: string);
}

class GenerationError extends Error {
  constructor(message: string, file?: string);
}
```

### Error Handling Pattern

```typescript
try {
  const spec = parseSpec(content);
  const result = validateSpec(spec);

  if (!result.success) {
    throw new SpecValidationError(
      'Validation failed',
      result.errors
    );
  }

  const files = await renderAllTemplates(result.data);
  await writeGeneratedFiles(files, './output');

} catch (error) {
  if (error instanceof SpecValidationError) {
    console.error('Spec validation failed:');
    error.errors.forEach(e => {
      console.error(`  ${e.path.join('.')}: ${e.message}`);
    });
  } else if (error instanceof OAuthError) {
    console.error(`OAuth error: ${error.message}`);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

---

## Complete Example

Full programmatic usage:

```typescript
import { readFileSync } from 'fs';
import {
  parseSpec,
  validateSpec,
  renderAllTemplates,
  writeGeneratedFiles,
  createAIClient,
  enhanceSpec,
  getValidAccessToken,
} from 'onboardkit';

async function generateOnboarding() {
  // 1. Parse spec
  const content = readFileSync('./spec.md', 'utf-8');
  const spec = parseSpec(content);

  // 2. Validate
  const validation = validateSpec(spec);
  if (!validation.success) {
    console.error('Validation errors:');
    validation.errors.forEach(e => {
      console.error(`  ${e.path.join('.')}: ${e.message}`);
    });
    return;
  }

  // 3. Optional: AI enhancement
  const token = await getValidAccessToken('anthropic');
  if (token) {
    const client = createAIClient('anthropic', token);
    const enhancements = await enhanceSpec(validation.data, client);

    console.log(`Found ${enhancements.length} enhancement suggestions`);
    // Apply enhancements...
  }

  // 4. Generate files
  const files = await renderAllTemplates(validation.data);
  console.log(`Generated ${files.length} files`);

  // 5. Write to disk
  await writeGeneratedFiles(files, './output', {
    overwrite: true
  });

  console.log('✓ Generation complete!');
}

generateOnboarding().catch(console.error);
```

---

## See Also

- [CLI Reference](CLI-REFERENCE.md) - Command-line usage
- [Spec Format](SPEC-FORMAT.md) - Spec syntax documentation
- [User Guide](USER-GUIDE.md) - Step-by-step tutorials
