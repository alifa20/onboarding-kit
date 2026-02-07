# Contributing to OnboardKit

Thank you for your interest in contributing to OnboardKit! This guide will help you get started.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Assume good intentions
- Respect differing viewpoints and experiences

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates.

**Good bug reports include:**
- Clear, descriptive title
- Steps to reproduce the issue
- Expected vs actual behavior
- Your environment (OS, Node.js version, OnboardKit version)
- Relevant logs (use `--verbose` flag)
- Minimal reproduction case if possible

**Template:**
```markdown
**Description:**
Brief description of the issue

**Steps to Reproduce:**
1. Run `onboardkit init`
2. Edit spec.md to include...
3. Run `onboardkit generate`
4. See error

**Expected Behavior:**
What you expected to happen

**Actual Behavior:**
What actually happened

**Environment:**
- OS: macOS 14.2
- Node.js: v22.0.0
- OnboardKit: 1.0.0

**Logs:**
```bash
$ onboardkit generate --verbose
[paste verbose output]
```
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues.

**Good enhancement suggestions include:**
- Clear use case and motivation
- Detailed description of proposed functionality
- Examples of how it would work
- Potential implementation approach (optional)
- Consideration of edge cases

### Contributing Code

#### Development Setup

1. **Fork and clone the repository**

```bash
git clone https://github.com/YOUR-USERNAME/onboarding-kit.git
cd onboarding-kit/cli
```

2. **Install dependencies**

```bash
npm install
```

3. **Build the project**

```bash
npm run build
```

4. **Run tests**

```bash
npm test
```

5. **Link for local testing**

```bash
npm link
onboardkit --version
```

#### Development Workflow

1. **Create a feature branch**

```bash
git checkout -b feature/your-feature-name
```

2. **Make your changes**

Follow the code style guidelines below.

3. **Add tests**

All new functionality should include tests:
- Unit tests for logic
- Integration tests for commands
- Update existing tests if behavior changes

4. **Run tests and type checking**

```bash
npm test
npm run typecheck
npm run lint
```

5. **Commit your changes**

Follow conventional commits format:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Test additions or updates
- `chore:` - Maintenance tasks

**Examples:**
```
feat(templates): add soft paywall screen template

Add template for soft paywall with feature list,
pricing, and skip option.

Closes #123
```

```
fix(oauth): handle callback server timeout correctly

Ensure callback server shuts down after 2-minute timeout
even if no response received.
```

6. **Push and create a pull request**

```bash
git push origin feature/your-feature-name
```

Then open a pull request on GitHub.

## Code Style Guidelines

### TypeScript

- **Strict mode enabled** - No `any` types in production code
- **Explicit return types** - For all public functions
- **JSDoc comments** - For all exported functions and types
- **Prefer functional patterns** - Avoid classes where possible
- **Use Zod for validation** - Runtime schema validation

**Example:**
```typescript
/**
 * Parses a markdown spec file into a typed spec object
 *
 * @param content - Raw markdown content
 * @returns Parsed spec object or validation errors
 */
export function parseSpec(content: string): ValidationResult<OnboardingSpec> {
  // Implementation
}
```

### File Organization

```
src/
├── lib/                   # Core library code
│   ├── oauth/            # OAuth authentication
│   ├── spec/             # Spec parsing and validation
│   ├── templates/        # Template rendering
│   ├── ai/               # AI integration
│   └── output/           # File writing
├── commands/             # CLI commands
└── index.ts              # Main entry point
```

### Naming Conventions

- **Files:** kebab-case (`oauth-flow.ts`)
- **Functions:** camelCase (`parseMarkdown`)
- **Types/Interfaces:** PascalCase (`OnboardingSpec`)
- **Constants:** UPPER_SNAKE_CASE (`DEFAULT_COLORS`)
- **Private functions:** prefix with `_` (`_internalHelper`)

### Testing

- **Test files:** Co-located with source (`parser.ts` → `parser.test.ts`)
- **Test names:** Descriptive (`it('should parse valid spec successfully')`)
- **Coverage:** Aim for >80% for new code
- **Mocks:** Use sparingly, prefer real implementations when possible

**Example:**
```typescript
import { describe, it, expect } from 'vitest';
import { parseSpec } from './parser';

describe('parseSpec', () => {
  it('should parse valid spec successfully', () => {
    const content = `# MyApp\n\n## Config\n- Platform: expo`;
    const result = parseSpec(content);

    expect(result.success).toBe(true);
    expect(result.data?.projectName).toBe('MyApp');
  });

  it('should return errors for invalid spec', () => {
    const content = `# MyApp`; // Missing required sections
    const result = parseSpec(content);

    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(1);
  });
});
```

### Error Handling

- **Use Result types** - Return `{ success: true, data }` or `{ success: false, errors }`
- **Descriptive error messages** - Include actionable guidance
- **Error classes** - Extend base error classes for custom errors
- **Graceful degradation** - Fallback to safe defaults when possible

**Example:**
```typescript
export class SpecValidationError extends Error {
  constructor(
    message: string,
    public readonly errors: ValidationError[]
  ) {
    super(message);
    this.name = 'SpecValidationError';
  }
}
```

## Pull Request Process

1. **Ensure tests pass**
   - All existing tests must pass
   - New tests for new functionality
   - Coverage should not decrease

2. **Update documentation**
   - README.md if user-facing changes
   - JSDoc comments for code
   - CHANGELOG.md entry (unreleased section)

3. **Keep PRs focused**
   - One feature or fix per PR
   - Split large changes into multiple PRs
   - Rebase on latest main before submitting

4. **PR description should include:**
   - What changed and why
   - How to test the changes
   - Screenshots/terminal output if applicable
   - Related issues (fixes #123)

5. **Review process**
   - PRs require at least one approval
   - Address review feedback promptly
   - Maintain respectful discussion

6. **After approval**
   - Squash commits if many small ones
   - Maintain clean git history
   - PR will be merged by maintainer

## Project Structure

### Key Files

```
cli/
├── src/
│   ├── index.ts              # CLI entry point
│   ├── commands/             # All CLI commands
│   ├── lib/
│   │   ├── oauth/            # OAuth 2.0 + PKCE implementation
│   │   ├── spec/             # Markdown parser and validator
│   │   ├── templates/        # Handlebars template engine
│   │   ├── ai/               # AI provider integration
│   │   ├── output/           # File generation and writing
│   │   └── workflow/         # Checkpoint/resume system
│   └── types/                # Shared TypeScript types
├── templates/                # Handlebars templates (future)
├── examples/                 # Example spec files
├── tests/                    # Integration tests
└── package.json
```

### Core Modules

**OAuth System (`lib/oauth/`)**
- PKCE implementation
- Callback server
- Token management
- Secure credential storage

**Spec System (`lib/spec/`)**
- Markdown parsing (unified + remark)
- Zod schema validation
- Spec hash computation
- Error formatting

**Template System (`lib/templates/`)**
- Handlebars rendering
- Custom helpers
- Context building
- Prettier formatting

**AI System (`lib/ai/`)**
- Provider abstraction
- Anthropic Claude client
- Prompt management
- Error handling and retries

## Adding a New Feature

### Example: Adding a New Screen Template

1. **Define the schema** (`lib/spec/schema.ts`)

```typescript
export const MyScreenSchema = z.object({
  headline: z.string().min(1),
  subtext: z.string().min(1),
  // ... more fields
});
```

2. **Update the parser** (`lib/spec/parser.ts`)

```typescript
// Add parsing logic for new section
if (sectionName === 'My Screen') {
  spec.myScreen = parseMyScreenSection(section);
}
```

3. **Create the template** (`templates/expo/screens/MyScreen.tsx.hbs`)

```handlebars
import React from 'react';
import { View, Text } from 'react-native';

export const MyScreen: React.FC = () => {
  return (
    <View>
      <Text>{{headline}}</Text>
      <Text>{{subtext}}</Text>
    </View>
  );
};
```

4. **Update template renderer** (`lib/templates/renderer.ts`)

```typescript
// Add new screen to rendering pipeline
if (spec.myScreen) {
  files.push({
    path: 'screens/MyScreen.tsx',
    content: renderTemplate('MyScreen', spec.myScreen)
  });
}
```

5. **Add tests**

```typescript
describe('MyScreen template', () => {
  it('should render MyScreen correctly', () => {
    const result = renderTemplate('MyScreen', {
      headline: 'Test',
      subtext: 'Test subtext'
    });
    expect(result).toContain('Test');
  });
});
```

6. **Update documentation**
   - Add to SPEC-FORMAT.md
   - Add example to examples/
   - Update README.md if needed

## Release Process

Only maintainers can create releases:

1. Update CHANGELOG.md with release notes
2. Bump version in package.json
3. Create git tag: `git tag v1.x.x`
4. Push: `git push origin main --tags`
5. GitHub Actions will publish to npm automatically
6. Create GitHub release with notes

## Getting Help

- **Questions:** Open a GitHub Discussion
- **Bugs:** Open a GitHub Issue
- **Security:** Email security concerns privately (see SECURITY.md)
- **Chat:** Join discussions in GitHub

## Recognition

Contributors are recognized in:
- GitHub contributors page
- Release notes for significant contributions
- Special thanks in README for major features

Thank you for contributing to OnboardKit!
