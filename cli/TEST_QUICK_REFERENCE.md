# Test Quick Reference

## Run Tests

```bash
# All tests
npm test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch

# Integration tests
npm run test:integration

# Platform tests
npm run test:platform

# CI mode
npm run test:ci

# Specific file
npm test -- path/to/test.test.ts

# Pattern matching
npm test -- --grep "spec parsing"
```

## View Coverage

```bash
# Generate and open
npm run test:coverage
open coverage/index.html

# Text summary only
npm run test:coverage -- --reporter=text
```

## Test Structure

```
src/__tests__/
├── integration/      # End-to-end workflows
├── platform/         # Cross-platform compatibility
├── cli/              # CLI commands
├── performance/      # Performance benchmarks
├── validation/       # Code quality
├── mocks/            # Mock factories
└── utils/            # Test utilities
```

## Import Mocks

```typescript
// OAuth
import { createMockProvider, createMockTokens } from '../mocks/oauth.js';

// AI
import { createMockAIProvider } from '../mocks/ai.js';

// File System
import { MockFileSystem } from '../mocks/fs.js';

// Prompts
import { createMockPrompts } from '../mocks/prompts.js';
```

## Import Utilities

```typescript
// Fixtures
import { createMinimalSpec, createTempDir } from '../utils/fixtures.js';

// Helpers
import { validateTypeScriptSyntax, measureTime } from '../utils/helpers.js';
```

## Test Template

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTempDir, cleanupTempDir } from '../utils/fixtures.js';

describe('Feature', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await createTempDir();
  });

  afterEach(async () => {
    await cleanupTempDir(tempDir);
  });

  it('should do something', async () => {
    // Arrange
    const input = createInput();

    // Act
    const result = await performAction(input);

    // Assert
    expect(result).toBe(expected);
  });
});
```

## Coverage Thresholds

- Statements: 80%
- Branches: 80%
- Functions: 80%
- Lines: 80%

## CI/CD

- Runs on: push to main/develop, PRs
- Platforms: Ubuntu, macOS, Windows
- Node: 22, 20
- Reports: Codecov

## NFR Validation

- NFR-P1: CLI startup <500ms
- NFR-P3: Build time <5s
- NFR-P4: Bundle size <2MB

## Troubleshooting

```bash
# Clean install
rm -rf node_modules && npm install

# Clear cache
npm test -- --clearCache

# Verbose output
npm test -- --reporter=verbose

# Run individually
npm test -- path/to/failing.test.ts
```

## Platform Script

```bash
cd cli
./scripts/test-cross-platform.sh
```

## Documentation

- Full guide: `cli/TESTING.md`
- Test suite: `cli/src/__tests__/README.md`
- Deliverables: `TASK_9_DELIVERABLES.md`
