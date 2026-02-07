# Test Architecture

## Overview

Visual guide to the OnboardKit CLI test architecture.

## Test Pyramid

```
                    ┌─────────────────┐
                    │   Performance   │
                    │   Benchmarks    │  ← NFR Validation
                    └─────────────────┘
                  ┌───────────────────────┐
                  │   Integration Tests   │  ← End-to-end workflows
                  │   Full pipelines      │
                  └───────────────────────┘
              ┌─────────────────────────────┐
              │   Platform Tests            │  ← Cross-platform
              │   Compatibility validation  │
              └─────────────────────────────┘
          ┌───────────────────────────────────┐
          │   Unit Tests                      │  ← Fast, isolated
          │   Existing lib/ tests             │
          └───────────────────────────────────┘
```

## Test Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Test Execution                       │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
     ┌────────────┐  ┌────────────┐  ┌────────────┐
     │   Local    │  │    CI/CD   │  │  Manual    │
     │   Dev      │  │   GitHub   │  │  Testing   │
     │            │  │   Actions  │  │            │
     └────────────┘  └────────────┘  └────────────┘
              │               │               │
              └───────────────┼───────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
     ┌────────────┐  ┌────────────┐  ┌────────────┐
     │ Integration│  │  Platform  │  │Performance │
     │   Tests    │  │   Tests    │  │  Tests     │
     └────────────┘  └────────────┘  └────────────┘
              │               │               │
              └───────────────┼───────────────┘
                              │
                              ▼
                     ┌────────────────┐
                     │  Test Results  │
                     │   & Coverage   │
                     └────────────────┘
```

## Mock System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Test Code                             │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
     ┌────────────┐  ┌────────────┐  ┌────────────┐
     │   OAuth    │  │     AI     │  │    File    │
     │   Mocks    │  │   Mocks    │  │   System   │
     │            │  │            │  │   Mocks    │
     └────────────┘  └────────────┘  └────────────┘
          │                │                │
          │                │                │
          ▼                ▼                ▼
     ┌────────────┐  ┌────────────┐  ┌────────────┐
     │ Provider   │  │ Streaming  │  │ In-Memory  │
     │ Tokens     │  │ Responses  │  │ Storage    │
     │ PKCE       │  │ Errors     │  │ Operations │
     └────────────┘  └────────────┘  └────────────┘
```

## Test Data Flow

```
┌─────────────┐
│   Fixture   │ ← Test data generators
│  Generators │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Test Spec  │ ← Minimal/Complete/Mock specs
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Parser    │ ← Parse markdown
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Validator  │ ← Validate against schema
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Context   │ ← Build template context
│   Builder   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Template   │ ← Render templates
│  Renderer   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Generated  │ ← Validate output
│    Code     │
└─────────────┘
```

## CI/CD Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                      GitHub Actions                          │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
     ┌────────────┐  ┌────────────┐  ┌────────────┐
     │   Ubuntu   │  │   macOS    │  │  Windows   │
     │   Latest   │  │   Latest   │  │   Latest   │
     └────────────┘  └────────────┘  └────────────┘
              │               │               │
              │    Node 22    │    Node 20    │
              └───────────────┼───────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
     ┌────────────┐  ┌────────────┐  ┌────────────┐
     │   Lint     │  │  TypeCheck │  │   Build    │
     └────────────┘  └────────────┘  └────────────┘
              │               │               │
              └───────────────┼───────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
     ┌────────────┐  ┌────────────┐  ┌────────────┐
     │   Tests    │  │  Coverage  │  │  Bundle    │
     │   Suite    │  │   Report   │  │   Size     │
     └────────────┘  └────────────┘  └────────────┘
              │               │               │
              └───────────────┼───────────────┘
                              │
                              ▼
                     ┌────────────────┐
                     │   Codecov      │
                     │   Upload       │
                     └────────────────┘
```

## Test Organization

```
cli/src/__tests__/
│
├── integration/           ← End-to-end workflows
│   ├── full-workflow.test.ts
│   └── spec-pipeline.test.ts
│
├── platform/             ← Cross-platform compatibility
│   ├── paths.test.ts
│   ├── env.test.ts
│   └── line-endings.test.ts
│
├── cli/                  ← CLI command validation
│   └── commands.test.ts
│
├── performance/          ← Performance benchmarks
│   └── benchmarks.test.ts
│
├── validation/           ← Generated code quality
│   └── generated-code.test.ts
│
├── mocks/                ← Mock factories
│   ├── oauth.ts          → Provider, Tokens, PKCE
│   ├── ai.ts             → Providers, Responses
│   ├── fs.ts             → In-memory file system
│   └── prompts.ts        → CLI interactions
│
└── utils/                ← Test utilities
    ├── fixtures.ts       → Test data generators
    └── helpers.ts        → Validation & assertions
```

## Coverage Flow

```
┌─────────────┐
│ Source Code │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   vitest    │ ← Test runner with v8 coverage
└──────┬──────┘
       │
       ├─────────┐
       │         │
       ▼         ▼
┌──────────┐  ┌──────────┐
│  Unit    │  │Integration│
│  Tests   │  │  Tests   │
└────┬─────┘  └────┬─────┘
     │             │
     └──────┬──────┘
            │
            ▼
    ┌───────────────┐
    │   Coverage    │
    │   Analysis    │
    └───────┬───────┘
            │
    ┌───────┴────────┐
    │                │
    ▼                ▼
┌─────────┐    ┌─────────┐
│ Console │    │  HTML   │
│ Report  │    │ Report  │
└─────────┘    └─────────┘
                    │
                    ▼
              ┌──────────┐
              │ Codecov  │
              │ Upload   │
              └──────────┘
```

## Platform Test Matrix

```
                  macOS          Linux         Windows
                    │              │               │
                    ├──────────────┼───────────────┤
                    │              │               │
    Path Handling   ├─ /foo/bar    ├─ /foo/bar     ├─ C:\foo\bar
                    │              │               │
    Home Dir        ├─ $HOME       ├─ $HOME        ├─ %USERPROFILE%
                    │              │               │
    Line Endings    ├─ LF          ├─ LF           ├─ CRLF
                    │              │               │
    Temp Dir        ├─ /tmp        ├─ /tmp         ├─ %TEMP%
                    │              │               │
    Credentials     ├─ Keychain    ├─ Secret       ├─ Credential
                    │              │  Service      │  Manager
                    │              │               │
```

## Mock Injection Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                       Production Code                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Interface/Type  │ ← Define contract
                    └──────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
    ┌──────────────────┐          ┌──────────────────┐
    │  Real            │          │  Mock            │
    │  Implementation  │          │  Implementation  │
    └──────────────────┘          └──────────────────┘
              │                               │
              │ Production                    │ Testing
              ▼                               ▼
    ┌──────────────────┐          ┌──────────────────┐
    │  External API    │          │  Test Data       │
    │  File System     │          │  In-Memory       │
    │  OAuth Provider  │          │  Mock Server     │
    └──────────────────┘          └──────────────────┘
```

## Test Execution Order

```
1. Setup
   └─ beforeEach() hooks
      ├─ Create temp directories
      ├─ Initialize mocks
      └─ Prepare fixtures

2. Test Execution
   └─ Individual test cases
      ├─ Arrange (setup)
      ├─ Act (execute)
      └─ Assert (verify)

3. Cleanup
   └─ afterEach() hooks
      ├─ Remove temp directories
      ├─ Reset mocks
      └─ Clear state

4. Reporting
   └─ Test results
      ├─ Pass/Fail status
      ├─ Coverage metrics
      └─ Performance data
```

## Coverage Calculation

```
                    Lines Executed
Coverage % = ──────────────────────── × 100
                    Total Lines

Example:
    80 lines executed
    ─────────────────── × 100 = 80%
    100 total lines

Thresholds:
├─ Statements: >80% ✅
├─ Branches:   >80% ✅
├─ Functions:  >80% ✅
└─ Lines:      >80% ✅
```

## Performance Testing Flow

```
┌─────────────┐
│  Start      │
│  Timer      │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Execute    │
│  Function   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Stop       │
│  Timer      │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Calculate  │
│  Duration   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Compare    │
│  vs Target  │
└──────┬──────┘
       │
   ┌───┴───┐
   │       │
   ▼       ▼
┌─────┐ ┌─────┐
│Pass │ │Fail │
└─────┘ └─────┘
```

## Integration Test Layers

```
Layer 1: Spec Creation
         └─ Generate test spec (minimal/complete)

Layer 2: Parsing
         └─ parseMarkdown(spec)

Layer 3: Validation
         └─ validateSpec(parsed)

Layer 4: Context Building
         └─ buildContext(spec)

Layer 5: Template Rendering
         └─ renderTemplate(template, context)

Layer 6: Code Validation
         └─ validateTypeScript(generated)

Layer 7: Output Verification
         └─ Check file structure & content
```

## Test Dependencies

```
vitest ─────────┬─── Test Runner
                │
@vitest/coverage-v8 ─── Coverage Provider
                │
                ├─── Mocks ───┬─── oauth.ts
                │             ├─── ai.ts
                │             ├─── fs.ts
                │             └─── prompts.ts
                │
                └─── Utils ───┬─── fixtures.ts
                              └─── helpers.ts
```

## Quick Reference Commands

```
┌──────────────────────────────────────────────────────────┐
│  npm test                   Run all tests                │
│  npm run test:coverage      Run with coverage            │
│  npm run test:watch         Watch mode                   │
│  npm run test:integration   Integration tests only       │
│  npm run test:platform      Platform tests only          │
│  npm run test:ci            CI mode with coverage        │
└──────────────────────────────────────────────────────────┘
```

## Documentation Links

- [Testing Guide](./TESTING.md)
- [Quick Reference](./TEST_QUICK_REFERENCE.md)
- [Coverage Matrix](./TEST_COVERAGE_MATRIX.md)
- [Task Deliverables](../TASK_9_DELIVERABLES.md)
- [Verification](../TASK_9_VERIFICATION.md)

---

**Visual Legend:**
- `┌─┐` Box borders
- `│` Vertical connection
- `├─┤` T-junction
- `└─┘` Bottom junction
- `▼` Flow direction
- `←` Reference/note
- `✅` Verified/complete
