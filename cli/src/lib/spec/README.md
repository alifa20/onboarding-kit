# Spec Module

This module handles markdown specification parsing, validation, and hash tracking for OnboardKit.

## Components

### Schema (`schema.ts`)

Defines Zod schemas and TypeScript types for the onboarding specification:

- **Config**: Platform, navigation, and styling configuration
- **Theme**: Colors, typography, and spacing
- **Screens**: Welcome, onboarding steps, paywalls, login, name capture
- **Validation**: Error types and result wrappers

### Parser (`parser.ts`)

Parses markdown files into structured data:

- Uses `unified` + `remark-parse` for markdown AST processing
- Extracts frontmatter (YAML)
- Converts markdown sections to structured objects
- Handles arrays, nested lists, and key-value pairs
- Converts keys to camelCase for consistency

### Validator (`validator.ts`)

Validates parsed data against schemas:

- Uses Zod for schema validation
- Generates actionable error messages
- Formats errors for terminal display
- Provides spec feature detection

### Hash (`hash.ts`)

Manages spec content hashing for change detection:

- SHA-256 hash computation
- Persistent hash storage in `.onboardkit/spec-hash.json`
- Change detection between spec versions
- Metadata tracking (timestamp, path)

## Usage

### Parse and Validate

```typescript
import { parseMarkdown, validateSpec } from './lib/spec';

const content = await readFile('spec.md', 'utf-8');
const parsed = await parseMarkdown(content);
const result = validateSpec(parsed);

if (result.success) {
  console.log('Valid spec:', result.data);
} else {
  console.error('Validation errors:', result.errors);
}
```

### Hash Tracking

```typescript
import { computeSpecHash, saveSpecHash, hasSpecChanged } from './lib/spec';

// Compute and save hash
const hash = await computeSpecHash('spec.md');
await saveSpecHash('spec.md', hash);

// Check for changes later
const changed = await hasSpecChanged('spec.md');
if (changed) {
  console.log('Spec has been modified!');
}
```

## Spec Format

OnboardKit uses markdown with a specific structure:

```markdown
# ProjectName

## Config
- Platform: expo
- Navigation: react-navigation
- Styling: stylesheet

## Theme
- Primary: #6366F1
- Secondary: #8B5CF6
- ...

## Welcome Screen
- Headline: Welcome!
- Subtext: Get started
- ...

## Onboarding Steps

### Step 1
- Title: First Step
- Headline: ...
- ...

## Login
- Methods: [email, google, apple]
- ...

## Name Capture
- Headline: ...
- Fields: [first_name, last_name]
- ...

<!-- Optional sections -->
## Soft Paywall
...

## Hard Paywall
...
```

## Validation Rules

- **Required sections**: Config, Theme, Welcome, Onboarding Steps (min 1), Login, Name Capture
- **Optional sections**: Soft Paywall, Hard Paywall
- **Color format**: Hex colors (#RGB or #RRGGBB)
- **Platform**: Must be 'expo'
- **Navigation**: Must be 'react-navigation'
- **Styling**: Must be 'stylesheet'

## Testing

Run tests with:

```bash
npm test src/lib/spec
```

See `__tests__/` directory for test cases covering:
- Markdown parsing
- Schema validation
- Hash computation and tracking
