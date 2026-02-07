# Template System

The OnboardKit template system generates production-ready TypeScript/React Native code from validated onboarding specifications.

## Architecture

### Components

1. **Helpers** (`helpers.ts`)
   - Handlebars helper functions for code generation
   - String case transformations (camelCase, PascalCase, kebabCase)
   - Conditional logic (eq, includes)
   - Array operations (join, isLast)

2. **Context Builder** (`context-builder.ts`)
   - Transforms validated spec into Handlebars context
   - Computes derived properties (hasGoogle, totalSteps, etc.)
   - Generates screen names for navigation

3. **Renderer** (`renderer.ts`)
   - Main template rendering engine
   - Loads Handlebars templates
   - Formats output with Prettier
   - Returns GeneratedFile[] with paths and content

### Template Files

Located in `handlebars/`:

**Theme Templates** (`theme/`):
- `colors.hbs` - Color palette constants
- `typography.hbs` - Font styles and variants
- `spacing.hbs` - Spacing scale and border radius
- `index.hbs` - Theme exports

**Component Templates** (`components/`):
- `Button.hbs` - Button component with variants
- `Input.hbs` - Text input with label and error states
- `Card.hbs` - Card container component

**Screen Templates** (`screens/`):
- `welcome.hbs` - Welcome screen with CTA and skip
- `login.hbs` - Login screen with email/social auth
- `signup.hbs` - Name capture/signup screen

**Navigation Templates** (`navigation/`):
- `stack.hbs` - React Navigation stack setup
- `types.hbs` - TypeScript navigation types

## Usage

```typescript
import { renderTemplates } from './lib/templates';
import type { OnboardingSpec } from './lib/spec/schema';

const spec: OnboardingSpec = { /* validated spec */ };
const result = await renderTemplates(spec);

// result.files contains all generated files
for (const file of result.files) {
  console.log(file.path, file.content);
}

// result.summary contains counts
console.log(`Generated ${result.summary.totalFiles} files`);
```

## Generated Code Requirements

All generated code must:
- Compile with TypeScript strict mode
- Be React Native/Expo compatible
- Use StyleSheet.create (no external CSS)
- Include proper imports and type definitions
- Be formatted with Prettier
- Have no runtime errors

## Testing

Run tests with:
```bash
npm test src/lib/templates/__tests__
```

Coverage targets:
- Context builder: >90%
- Helpers: >90%
- Renderer: >80%
