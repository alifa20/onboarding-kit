# Spec Module Architecture

## Overview

The spec module is the foundation of OnboardKit's code generation pipeline. It takes markdown specifications and transforms them into validated, typed data structures ready for template rendering.

## Data Flow

```
┌─────────────────┐
│   spec.md       │  User writes markdown specification
│  (Markdown)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  parser.ts      │  Parse markdown → structured data
│  (unified +     │
│   remark)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  validator.ts   │  Validate against Zod schemas
│  (Zod)          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  OnboardingSpec │  Fully typed, validated spec
│  (TypeScript)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  generator      │  Code generation (Task #4)
│  (Handlebars)   │
└─────────────────┘

         ┌──────────────────┐
         │   hash.ts        │  Parallel: Track changes
         │  (SHA-256)       │
         └──────────────────┘
```

## Module Components

### 1. Schema (`schema.ts`)

**Purpose**: Define the contract for valid onboarding specifications.

**Key Exports**:
- `OnboardingSpecSchema`: Root Zod schema
- `OnboardingSpec`: TypeScript type (inferred from schema)
- Component schemas: Config, Theme, WelcomeScreen, etc.
- Validation types: ValidationResult, ValidationError

**Design Decisions**:
- Zod for runtime validation + compile-time types
- Regex validation for hex colors
- Enum validation for fixed options
- Optional sections via `.optional()`
- Minimum length/count requirements

**Example**:
```typescript
export const ThemeSchema = z.object({
  primary: z.string().regex(hexColorRegex, 'Must be a valid hex color'),
  secondary: z.string().regex(hexColorRegex, 'Must be a valid hex color'),
  // ... other fields
  borderRadius: z.number().min(0),
});
```

### 2. Parser (`parser.ts`)

**Purpose**: Convert markdown to structured JavaScript objects.

**Pipeline**:
1. Parse markdown to AST with `unified` + `remark-parse`
2. Walk AST tree to identify sections (H1, H2, H3)
3. Extract list items and convert to key-value pairs
4. Handle special cases (arrays, nested lists, multiple steps)
5. Return structured object

**Key Features**:
- Section detection via heading depth
- Automatic camelCase conversion
- Type coercion (strings → numbers)
- Array parsing (inline and nested)
- Multi-step support (dynamic count)

**Example Input**:
```markdown
## Theme
- Primary: #6366F1
- Border Radius: 12
```

**Example Output**:
```javascript
{
  theme: {
    primary: "#6366F1",
    borderRadius: 12  // Note: number, not string
  }
}
```

### 3. Validator (`validator.ts`)

**Purpose**: Ensure parsed data conforms to schema and provide helpful errors.

**Functions**:
- `validateSpec()`: Main validation function
- `formatZodErrors()`: Convert Zod errors to user-friendly messages
- `formatValidationErrors()`: Terminal-formatted error display
- `getSpecFeatures()`: Extract feature flags from spec

**Error Enhancement**:
Zod errors are terse and developer-focused. We enhance them:

**Before** (raw Zod):
```
Invalid type. Expected string, received undefined at path theme.primary
```

**After** (enhanced):
```
❌ theme.primary
   This field cannot be empty. Please provide a value.
```

**Design Decisions**:
- Result type pattern (success/failure)
- Path-based error location
- Actionable guidance ("how to fix")
- Color-coded terminal output

### 4. Hash (`hash.ts`)

**Purpose**: Detect spec modifications for checkpoint/cache invalidation.

**Use Cases**:
1. Resume workflows (detect if spec changed since checkpoint)
2. Cache invalidation (regenerate only if spec changed)
3. Audit trail (track when spec was last modified)

**Storage Format** (`.onboardkit/spec-hash.json`):
```json
{
  "specPath": "/path/to/spec.md",
  "hash": "a3f5b...",
  "timestamp": "2026-02-07T10:30:00.000Z"
}
```

**API**:
- `computeSpecHash()`: Hash file content
- `saveSpecHash()`: Store hash + metadata
- `loadSpecHash()`: Retrieve saved hash
- `hasSpecChanged()`: Boolean change detection
- `detectSpecModification()`: Full change details

## Integration Points

### CLI Commands

**init.ts**:
```typescript
import { generateSpecTemplate } from './lib/spec';

const content = generateSpecTemplate(userInput);
await writeFile('spec.md', content);
```

**validate.ts**:
```typescript
import { parseMarkdown, validateSpec, formatValidationErrors } from './lib/spec';

const content = await readFile('spec.md', 'utf-8');
const parsed = await parseMarkdown(content);
const result = validateSpec(parsed);

if (!result.success) {
  console.log(formatValidationErrors(result.errors));
  process.exit(1);
}
```

**generate.ts** (Task #4):
```typescript
import { parseMarkdown, validateSpec } from './lib/spec';
import { computeSpecHash, saveSpecHash } from './lib/spec';

const parsed = await parseMarkdown(content);
const result = validateSpec(parsed);

if (result.success) {
  const hash = await computeSpecHash(specPath);
  await saveSpecHash(specPath, hash);

  // Pass result.data to generator
  await generateCode(result.data);
}
```

## Error Handling Strategy

### Parse Errors

**Source**: Invalid markdown structure
**Handling**: Try-catch in command, show file path and error
**Example**: "Could not parse spec.md: Unexpected token at line 42"

### Validation Errors

**Source**: Data doesn't match schema
**Handling**: Collect all errors, format with paths, show actionable fixes
**Example**:
```
❌ theme.primary
   Invalid color format. Please use a valid hex color (e.g., #FF5733 or #F57).

❌ onboardingSteps
   This list must have at least 1 item(s). Please add more items.
```

### Hash Errors

**Source**: File system issues
**Handling**: Graceful degradation (skip hash if it fails)
**Example**: Hash save fails → log warning, continue generation

## Testing Strategy

### Unit Tests

**Parser** (`parser.test.ts`):
- Parse basic spec
- Parse arrays (inline and nested)
- Parse multiple steps
- Convert keys to camelCase
- Coerce types correctly

**Validator** (`validator.test.ts`):
- Validate complete spec
- Detect missing fields
- Validate hex colors (3 and 6 digit)
- Handle optional sections
- Format errors correctly

**Hash** (`hash.test.ts`):
- Compute consistent hashes
- Save/load metadata
- Detect changes
- Handle missing files

### Integration Tests

**End-to-End** (`test-examples.js`):
- Parse all example specs
- Validate all examples
- Ensure no errors
- Verify feature detection

## Performance Characteristics

### Parsing

- **Time**: ~1-5ms for typical spec (100-500 lines)
- **Memory**: ~1MB peak for AST
- **Bottleneck**: File I/O, not parsing

### Validation

- **Time**: <1ms for Zod validation
- **Memory**: Minimal (schemas are lightweight)
- **Bottleneck**: None, extremely fast

### Hashing

- **Time**: ~1-2ms for SHA-256 of spec file
- **Memory**: Minimal (streams through crypto)
- **Bottleneck**: File I/O

## Extension Points

### Adding New Sections

1. Define schema in `schema.ts`:
```typescript
export const NewSectionSchema = z.object({
  field: z.string(),
});
```

2. Add to composite schema:
```typescript
export const OnboardingSpecSchema = z.object({
  // ... existing fields
  newSection: NewSectionSchema.optional(),
});
```

3. Update parser to extract section:
```typescript
if (currentSection === 'new section') {
  result.newSection = data;
}
```

### Custom Validation Rules

Add custom refinements to schemas:
```typescript
export const ThemeSchema = z.object({
  primary: z.string().regex(hexColorRegex),
  secondary: z.string().regex(hexColorRegex),
}).refine(
  (data) => data.primary !== data.secondary,
  { message: "Primary and secondary colors must be different" }
);
```

### Alternative Formats

Parser is pluggable. To support YAML/JSON:

```typescript
// yaml-parser.ts
export async function parseYAML(content: string): Promise<unknown> {
  return yaml.load(content);
}

// validator.ts validates any unknown object
const result = validateSpec(yamlData);
```

## Best Practices

### For Spec Authors

1. **Use valid hex colors**: `#RGB` or `#RRGGBB`
2. **Match section names exactly**: Case-insensitive, but be consistent
3. **Use arrays for lists**: `[a, b, c]` or nested bullet lists
4. **Include all required sections**: Use examples as templates
5. **Test with validate command**: `onboardkit validate` before generate

### For Maintainers

1. **Keep schemas strict**: Better to reject invalid data early
2. **Enhance error messages**: Every error should tell user how to fix
3. **Test edge cases**: Empty arrays, special characters, long strings
4. **Document schema changes**: Update examples when schema changes
5. **Version compatibility**: Support older specs with defaults

## Future Enhancements

### Planned (Post-MVP)

1. **Schema versioning**: Support multiple spec versions
2. **Migration tools**: Auto-upgrade old specs to new format
3. **Visual editor**: GUI for spec creation
4. **Linting**: Style guide enforcement
5. **Auto-completion**: IDE support for spec authoring

### Possible (Community Requests)

1. **Custom sections**: Plugin system for extensions
2. **Conditional logic**: If/else in specs
3. **Variables/macros**: Reuse values across spec
4. **Import/composition**: Combine multiple spec files
5. **Multi-language**: i18n support in specs

---

**Version**: 1.0.0
**Last Updated**: 2026-02-07
**Status**: Production Ready
