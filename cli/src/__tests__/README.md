# Test Suite Documentation

## Overview

This directory contains comprehensive tests for the OnboardKit CLI, targeting >80% code coverage and ensuring cross-platform compatibility.

## Directory Structure

```
__tests__/
├── integration/          # End-to-end workflow tests
│   ├── full-workflow.test.ts       # Complete spec → generate pipeline
│   └── spec-pipeline.test.ts       # Spec validation pipeline
│
├── platform/            # Cross-platform compatibility tests
│   ├── paths.test.ts              # Path handling (Windows/Unix)
│   ├── env.test.ts                # Environment variables
│   └── line-endings.test.ts       # CRLF/LF handling
│
├── cli/                 # CLI command tests
│   └── commands.test.ts           # All CLI commands
│
├── performance/         # Performance benchmarks
│   └── benchmarks.test.ts         # NFR validation (P1-P4)
│
├── validation/          # Generated code quality
│   └── generated-code.test.ts     # Code quality checks
│
├── mocks/               # Mock factories
│   ├── oauth.ts                   # OAuth/PKCE mocks
│   ├── ai.ts                      # AI provider mocks
│   ├── fs.ts                      # File system mocks
│   └── prompts.ts                 # CLI prompt mocks
│
└── utils/               # Test utilities
    ├── fixtures.ts                # Test data generators
    └── helpers.ts                 # Test helper functions
```

## Test Categories

### 1. Integration Tests (integration/)

Full end-to-end workflow testing.

**Coverage:**
- Spec parsing → validation → generation pipeline
- Multi-step onboarding flows
- Optional sections (soft/hard paywall)
- Error handling and recovery

**Run:**
```bash
npm run test:integration
```

### 2. Platform Tests (platform/)

Cross-platform compatibility validation.

**Coverage:**
- Path normalization (Windows vs Unix)
- Home directory detection
- Line ending handling (CRLF vs LF)
- Environment variable access

**Run:**
```bash
npm run test:platform
```

### 3. CLI Tests (cli/)

Command-line interface testing.

**Coverage:**
- All CLI commands (init, auth, validate, generate)
- Command options and flags
- Help and version output
- Exit codes

**Run:**
```bash
npm test -- src/__tests__/cli/commands.test.ts
```

### 4. Performance Tests (performance/)

Performance requirement validation.

**Coverage:**
- NFR-P1: CLI startup time <500ms
- NFR-P2: Workflow completion <1 hour
- NFR-P3: Build time <5 seconds
- NFR-P4: Bundle size <2MB

**Run:**
```bash
npm test -- src/__tests__/performance/benchmarks.test.ts
```

### 5. Validation Tests (validation/)

Generated code quality checks.

**Coverage:**
- TypeScript compilation (strict mode)
- React Native imports
- StyleSheet usage
- Navigation types
- Theme consistency
- No hardcoded values

**Run:**
```bash
npm test -- src/__tests__/validation/generated-code.test.ts
```

## Mock Factories

### OAuth Mock (mocks/oauth.ts)

Mock OAuth providers and tokens for testing authentication flows.

```typescript
import { createMockProvider, createMockTokens } from './mocks/oauth.js';

const provider = createMockProvider();
const tokens = createMockTokens();
const expiredTokens = createExpiredTokens();
```

### AI Mock (mocks/ai.ts)

Mock AI providers and responses for testing AI operations.

```typescript
import { createMockAIProvider, createFailingAIProvider } from './mocks/ai.js';

const aiProvider = createMockAIProvider('Custom response');
const failingProvider = createFailingAIProvider('Error message');
```

### File System Mock (mocks/fs.ts)

In-memory file system for testing file operations.

```typescript
import { MockFileSystem, createMockFsPromises } from './mocks/fs.js';

const mockFs = new MockFileSystem();
mockFs.writeFile('/test/file.txt', 'content');
const content = mockFs.readFile('/test/file.txt');
```

### Prompts Mock (mocks/prompts.ts)

Mock CLI prompts for testing interactive commands.

```typescript
import { createMockPrompts, createInitPromptResponses } from './mocks/prompts.js';

const prompts = createMockPrompts(createInitPromptResponses());
```

## Test Utilities

### Fixtures (utils/fixtures.ts)

Test data generators and spec templates.

```typescript
import {
  createMinimalSpec,
  createCompleteSpec,
  createMockSpec,
  createTempDir,
  cleanupTempDir
} from './utils/fixtures.js';

// Generate spec content
const minimalSpec = createMinimalSpec();
const completeSpec = createCompleteSpec();

// Create temporary directories
const tempDir = await createTempDir();
// ... use temp dir
await cleanupTempDir(tempDir);
```

### Helpers (utils/helpers.ts)

Utility functions for test assertions and validation.

```typescript
import {
  validateTypeScriptSyntax,
  hasReactNativeImports,
  usesStyleSheet,
  expectFileExists,
  measureTime
} from './utils/helpers.js';

// Validate code
const syntaxCheck = validateTypeScriptSyntax(code);
expect(syntaxCheck.valid).toBe(true);

// Check imports
expect(hasReactNativeImports(code)).toBe(true);

// Measure performance
const { result, durationMs } = await measureTime(async () => {
  return await parseSpec(content);
});
```

## Writing New Tests

### Template

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTempDir, cleanupTempDir } from '../utils/fixtures.js';

describe('Feature Name', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await createTempDir();
  });

  afterEach(async () => {
    await cleanupTempDir(tempDir);
  });

  describe('Specific Aspect', () => {
    it('should do something specific', async () => {
      // Arrange
      const input = createTestInput();

      // Act
      const result = await performAction(input);

      // Assert
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      const invalidInput = createInvalidInput();

      // Act & Assert
      await expect(performAction(invalidInput)).rejects.toThrow();
    });
  });
});
```

### Best Practices

1. **Use descriptive names**: Test names should clearly describe what is being tested
2. **Follow AAA pattern**: Arrange, Act, Assert
3. **Test happy and error paths**: Cover both success and failure scenarios
4. **Clean up resources**: Use beforeEach/afterEach for setup/teardown
5. **Keep tests isolated**: Each test should be independent
6. **Use type-safe mocks**: Leverage TypeScript for mock type safety
7. **Test edge cases**: Include boundary conditions and special cases
8. **Document complex tests**: Add comments for non-obvious test logic

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage
```bash
npm run test:coverage
```

### Specific Test File
```bash
npm test -- path/to/test.test.ts
```

### Pattern Matching
```bash
npm test -- --grep "spec parsing"
```

### Verbose Output
```bash
npm test -- --reporter=verbose
```

## Coverage Requirements

- **Overall:** >80%
- **Statements:** >80%
- **Branches:** >80%
- **Functions:** >80%
- **Lines:** >80%

## CI/CD

Tests run automatically on:
- Every push to main/develop
- Every pull request
- Multiple platforms (Ubuntu, macOS, Windows)
- Multiple Node.js versions (22, 20)

See `.github/workflows/test.yml` for details.

## Troubleshooting

### Tests Failing

1. Clean install: `rm -rf node_modules && npm install`
2. Clear cache: `npm test -- --clearCache`
3. Run individually: `npm test -- path/to/failing.test.ts`
4. Check logs: `npm test -- --reporter=verbose`

### Coverage Issues

1. Remove coverage dir: `rm -rf coverage`
2. Run with fresh coverage: `npm run test:coverage`
3. Check specific files: `npm test -- --coverage path/to/file.ts`

### Platform Issues

- **macOS:** Check keytar installation
- **Linux:** Install libsecret-1-dev
- **Windows:** Use Git Bash or PowerShell

## Contributing

When adding new features:
1. Write tests first (TDD)
2. Ensure >80% coverage for new code
3. Add integration tests if needed
4. Update this documentation
5. Run full test suite before PR

## References

- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Parent TESTING.md](../TESTING.md)
