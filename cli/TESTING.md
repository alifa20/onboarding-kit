# OnboardKit Testing Guide

This document outlines the comprehensive testing strategy for OnboardKit CLI.

## Test Coverage Goals

- **Target:** >80% coverage across all modules
- **Current Status:** Run `npm run test:coverage` to check
- **Requirements:** Meet NFR-M1, M2, M3, M4 standards

## Test Structure

```
src/__tests__/
├── integration/          # End-to-end workflow tests
│   ├── full-workflow.test.ts
│   └── spec-pipeline.test.ts
├── platform/            # Cross-platform compatibility
│   ├── paths.test.ts
│   ├── env.test.ts
│   └── line-endings.test.ts
├── cli/                 # CLI command tests
│   └── commands.test.ts
├── performance/         # Performance benchmarks
│   └── benchmarks.test.ts
├── validation/          # Generated code quality
│   └── generated-code.test.ts
├── mocks/               # Mock factories
│   ├── oauth.ts
│   ├── ai.ts
│   ├── fs.ts
│   └── prompts.ts
└── utils/               # Test utilities
    ├── fixtures.ts
    └── helpers.ts
```

## Running Tests

### All Tests
```bash
npm test
```

### With Coverage
```bash
npm run test:coverage
```

### Integration Tests Only
```bash
npm run test:integration
```

### Platform Tests Only
```bash
npm run test:platform
```

### Performance Tests Only
```bash
npm test -- src/__tests__/performance/benchmarks.test.ts
```

### Watch Mode
```bash
npm run test:watch
```

### CI Mode
```bash
npm run test:ci
```

## Cross-Platform Testing

### Local Testing
```bash
cd cli
./scripts/test-cross-platform.sh
```

### Supported Platforms
- **macOS:** Latest (tested on GitHub Actions)
- **Linux:** Ubuntu Latest (tested on GitHub Actions)
- **Windows:** Latest (tested on GitHub Actions)

### Supported Node.js Versions
- Node.js 22 (primary)
- Node.js 20 (LTS)

## Test Categories

### 1. Unit Tests

Located alongside source files or in `__tests__` directories.

**Coverage:**
- `src/lib/spec/` - Spec parsing and validation
- `src/lib/oauth/` - OAuth and PKCE implementation
- `src/lib/templates/` - Template rendering
- `src/lib/output/` - File output management
- `src/lib/ai/` - AI operations

**Example:**
```bash
npm test -- src/lib/spec/__tests__/parser.test.ts
```

### 2. Integration Tests

Full workflow tests from spec to generated code.

**Test Cases:**
- ✅ Parse → Validate → Generate pipeline
- ✅ Multi-step onboarding workflows
- ✅ Optional sections (soft/hard paywall)
- ✅ Error handling and recovery

**Example:**
```bash
npm run test:integration
```

### 3. Platform Compatibility Tests

Ensure cross-platform compatibility.

**Test Cases:**
- ✅ Path handling (Windows vs Unix)
- ✅ Line endings (CRLF vs LF)
- ✅ Environment variables (HOME vs USERPROFILE)
- ✅ File permissions

**Example:**
```bash
npm run test:platform
```

### 4. Performance Tests

Validate performance requirements (NFRs).

**Test Cases:**
- ✅ CLI startup time <500ms (NFR-P1)
- ✅ Build time <5 seconds (NFR-P3)
- ✅ Bundle size <2MB (NFR-P4)
- ✅ Parsing performance
- ✅ Memory usage

**Example:**
```bash
npm test -- src/__tests__/performance/benchmarks.test.ts
```

### 5. Generated Code Validation

Ensure generated code meets quality standards.

**Test Cases:**
- ✅ TypeScript compilation (strict mode)
- ✅ React Native imports validation
- ✅ StyleSheet usage (no inline styles)
- ✅ Navigation types correctness
- ✅ Theme consistency
- ✅ No hardcoded values

**Example:**
```bash
npm test -- src/__tests__/validation/generated-code.test.ts
```

## Mock Factories

### OAuth Mock
```typescript
import { createMockProvider, createMockTokens } from '../mocks/oauth.js';

const provider = createMockProvider();
const tokens = createMockTokens();
```

### AI Mock
```typescript
import { createMockAIProvider } from '../mocks/ai.js';

const aiProvider = createMockAIProvider('Mock AI response');
```

### File System Mock
```typescript
import { MockFileSystem, createMockFsPromises } from '../mocks/fs.js';

const mockFs = new MockFileSystem();
const fsPromises = createMockFsPromises(mockFs);
```

### Prompts Mock
```typescript
import { createMockPrompts, createInitPromptResponses } from '../mocks/prompts.js';

const prompts = createMockPrompts(createInitPromptResponses());
```

## Test Utilities

### Fixtures
```typescript
import { createMinimalSpec, createCompleteSpec, createMockSpec } from '../utils/fixtures.js';

const minimalSpec = createMinimalSpec();
const completeSpec = createCompleteSpec();
const mockSpec = createMockSpec();
```

### Temporary Directories
```typescript
import { createTempDir, cleanupTempDir } from '../utils/fixtures.js';

const tempDir = await createTempDir();
// ... run tests
await cleanupTempDir(tempDir);
```

### Validation Helpers
```typescript
import { validateTypeScriptSyntax, hasReactNativeImports } from '../utils/helpers.js';

const syntaxCheck = validateTypeScriptSyntax(code);
const hasRNImports = hasReactNativeImports(code);
```

## CI/CD Integration

### GitHub Actions

The project uses GitHub Actions for continuous testing.

**Workflow:** `.github/workflows/test.yml`

**Matrix:**
- OS: Ubuntu, macOS, Windows
- Node: 22, 20

**Steps:**
1. Checkout code
2. Setup Node.js
3. Install dependencies
4. Run linter
5. Run type check
6. Run unit tests
7. Run integration tests
8. Run platform tests
9. Run coverage tests
10. Upload coverage
11. Build
12. Check bundle size
13. Test CLI commands

### Coverage Reports

Coverage reports are uploaded to Codecov on successful test runs.

**View Coverage:**
- Locally: `open cli/coverage/index.html`
- CI: Check Codecov dashboard

## Writing New Tests

### Best Practices

1. **Use descriptive test names**
   ```typescript
   it('should parse minimal spec with all required fields', async () => {
     // test code
   });
   ```

2. **Group related tests with describe()**
   ```typescript
   describe('Spec Parsing', () => {
     describe('Valid Specs', () => {
       it('should parse minimal spec', () => {});
       it('should parse complete spec', () => {});
     });

     describe('Invalid Specs', () => {
       it('should reject invalid platform', () => {});
     });
   });
   ```

3. **Clean up after tests**
   ```typescript
   let tempDir: string;

   beforeEach(async () => {
     tempDir = await createTempDir();
   });

   afterEach(async () => {
     await cleanupTempDir(tempDir);
   });
   ```

4. **Use type-safe mocks**
   ```typescript
   const mockProvider = createMockProvider();
   expect(mockProvider.id).toBe('test-provider');
   ```

5. **Test both happy and error paths**
   ```typescript
   it('should handle valid spec', () => {
     // happy path
   });

   it('should handle invalid spec gracefully', () => {
     // error path
   });
   ```

## Performance Requirements

### NFR-P1: CLI Startup Time
- **Target:** <500ms
- **Test:** `npm test -- src/__tests__/performance/benchmarks.test.ts`
- **Measured:** Module load time

### NFR-P2: Workflow Completion
- **Target:** <1 hour for full workflow
- **Test:** Integration tests with real specs
- **Note:** Depends on AI provider response time

### NFR-P3: Build Time
- **Target:** <5 seconds
- **Test:** CI workflow measures build time
- **Command:** `npm run build`

### NFR-P4: Bundle Size
- **Target:** <2MB
- **Test:** CI workflow checks dist/index.js size
- **Command:** `ls -lh dist/index.js`

## Troubleshooting

### Tests Failing Locally

1. **Clean install dependencies**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Clear test cache**
   ```bash
   npm test -- --clearCache
   ```

3. **Run tests individually**
   ```bash
   npm test -- src/lib/spec/__tests__/parser.test.ts
   ```

### Platform-Specific Issues

**macOS:**
- Ensure keytar is properly installed
- Check Xcode command line tools

**Linux:**
- Install libsecret development files
- `sudo apt-get install libsecret-1-dev`

**Windows:**
- Use PowerShell or Git Bash
- Ensure node-gyp prerequisites installed

### Coverage Not Updating

1. **Remove coverage directory**
   ```bash
   rm -rf coverage
   ```

2. **Run coverage with reporter**
   ```bash
   npm run test:coverage -- --reporter=verbose
   ```

## Continuous Improvement

### Adding New Tests

1. Create test file in appropriate directory
2. Follow naming convention: `*.test.ts`
3. Use existing mocks and utilities
4. Add to relevant npm script if needed
5. Document in this file

### Coverage Gaps

Check coverage report and add tests for:
- Uncovered lines
- Edge cases
- Error conditions
- Platform-specific code

### Performance Monitoring

Track performance over time:
- Run benchmarks regularly
- Compare with previous versions
- Optimize if degradation detected

## References

- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Node.js Testing Guide](https://nodejs.org/en/docs/guides/testing/)
