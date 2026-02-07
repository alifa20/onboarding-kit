# Error Handling Migration Guide

Guide for migrating existing error handling to the new comprehensive error system.

## Quick Start

### 1. Wrap Commands

**Before:**
```typescript
program
  .command('mycommand')
  .action(async (options) => {
    await myCommand(options);
  });
```

**After:**
```typescript
import { withErrorHandling } from './lib/errors';

program
  .command('mycommand')
  .action(withErrorHandling(myCommand, { commandName: 'mycommand' }));
```

### 2. Replace Generic Errors

**Before:**
```typescript
if (!existsSync(path)) {
  console.error('File not found');
  process.exit(1);
}
```

**After:**
```typescript
import { FileSystemError, ErrorCode } from './lib/errors';

if (!existsSync(path)) {
  throw new FileSystemError('File not found', path, {
    code: ErrorCode.FILE_NOT_FOUND,
  });
}
```

### 3. Add Retry Logic

**Before:**
```typescript
try {
  const response = await fetch(url);
  return await response.json();
} catch (error) {
  console.error('API call failed');
  throw error;
}
```

**After:**
```typescript
import { withRetryProgress } from './lib/errors';

const data = await withRetryProgress(
  async () => {
    const response = await fetch(url);
    return await response.json();
  },
  {
    operation: 'Fetching data',
  }
);
```

## Detailed Migration Patterns

### Pattern 1: File Operations

**Old Code:**
```typescript
try {
  const content = await fs.readFile(path, 'utf-8');
  return content;
} catch (error) {
  if (error.code === 'ENOENT') {
    console.error('File not found:', path);
  } else if (error.code === 'EACCES') {
    console.error('Permission denied:', path);
  }
  process.exit(1);
}
```

**New Code:**
```typescript
import { withFileSystemErrors } from './lib/errors';

const content = await withFileSystemErrors(
  async () => fs.readFile(path, 'utf-8'),
  path
);
return content;
```

Benefits:
- ✅ Automatic error code conversion
- ✅ User-friendly error messages
- ✅ Recovery actions suggested
- ✅ Proper exit codes

### Pattern 2: Validation Errors

**Old Code:**
```typescript
const result = validateSpec(spec);

if (!result.success) {
  console.error('Validation failed:');
  result.errors.forEach(err => {
    console.error(`  - ${err.path}: ${err.message}`);
  });
  process.exit(1);
}
```

**New Code:**
```typescript
import { ValidationError, ErrorCode } from './lib/errors';

const result = validateSpec(spec);

if (!result.success) {
  // Display errors in your preferred format
  console.error('Validation failed:');
  result.errors.forEach(err => {
    console.error(`  - ${err.path}: ${err.message}`);
  });

  // Then throw structured error
  throw new ValidationError('Spec validation failed', {
    code: ErrorCode.SPEC_VALIDATION_ERROR,
    contextData: {
      errorCount: result.errors.length,
      errors: result.errors,
    },
  });
}
```

Benefits:
- ✅ Structured error data
- ✅ Proper exit codes
- ✅ Recovery suggestions
- ✅ Context preservation

### Pattern 3: Network Operations

**Old Code:**
```typescript
let retries = 0;
const maxRetries = 3;

while (retries < maxRetries) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    retries++;
    if (retries >= maxRetries) {
      console.error('API call failed after retries');
      throw error;
    }
    await sleep(1000 * retries);
  }
}
```

**New Code:**
```typescript
import { withRetry, NetworkError } from './lib/errors';

const data = await withRetry(
  async () => {
    const response = await fetch(url);

    if (!response.ok) {
      throw new NetworkError('API call failed', {
        url,
        statusCode: response.status,
      });
    }

    return await response.json();
  },
  {
    strategy: { maxRetries: 3 },
    callbacks: {
      onRetry: (attempt, delay) => {
        console.log(`Retrying (${attempt}/3) in ${delay}ms...`);
      },
    },
  }
);
```

Benefits:
- ✅ Exponential backoff
- ✅ Rate limit handling
- ✅ Progress indication
- ✅ Configurable strategy

### Pattern 4: Authentication Errors

**Old Code:**
```typescript
const token = await getToken();

if (!token) {
  console.error('Not authenticated');
  console.error('Run: onboardkit auth');
  process.exit(1);
}

if (isTokenExpired(token)) {
  console.error('Token expired');
  console.error('Run: onboardkit auth');
  process.exit(1);
}
```

**New Code:**
```typescript
import { AuthenticationError, ErrorCode } from './lib/errors';

const token = await getToken();

if (!token) {
  throw new AuthenticationError('Not authenticated', provider, {
    code: ErrorCode.AUTH_NOT_CONFIGURED,
  });
}

if (isTokenExpired(token)) {
  throw new AuthenticationError('Token expired', provider, {
    code: ErrorCode.AUTH_TOKEN_EXPIRED,
  });
}
```

Benefits:
- ✅ Consistent error format
- ✅ Automatic recovery actions
- ✅ Provider tracking
- ✅ Proper categorization

### Pattern 5: Workflow Errors

**Old Code:**
```typescript
try {
  await executePhase1();
  await executePhase2();
  await executePhase3();
} catch (error) {
  console.error('Workflow failed:', error.message);
  console.error('You may need to start over');
  process.exit(1);
}
```

**New Code:**
```typescript
import { WorkflowError, ErrorCode } from './lib/errors';

try {
  await executePhase('phase1');
  await saveCheckpoint('phase1-complete');

  await executePhase('phase2');
  await saveCheckpoint('phase2-complete');

  await executePhase('phase3');
  await saveCheckpoint('phase3-complete');
} catch (error) {
  const currentPhase = getCurrentPhase();
  const checkpoint = getLastCheckpoint();

  throw new WorkflowError('Workflow phase failed', {
    phase: currentPhase,
    checkpoint,
    metadata: {
      code: ErrorCode.WORKFLOW_PHASE_FAILED,
      canRetry: true,
      canRollback: true,
    },
  });
}
```

Benefits:
- ✅ Checkpoint tracking
- ✅ Resume capability
- ✅ Rollback support
- ✅ Phase identification

### Pattern 6: Generation Errors

**Old Code:**
```typescript
try {
  const code = await generateCode(template, data);
  return code;
} catch (error) {
  console.error('Code generation failed:', error.message);
  console.error('Check your spec file');
  process.exit(1);
}
```

**New Code:**
```typescript
import { GenerationError, ErrorCode } from './lib/errors';

try {
  const code = await generateCode(template, data);
  return code;
} catch (error) {
  throw new GenerationError('Code generation failed', {
    code: ErrorCode.GENERATION_FAILED,
    contextData: {
      template: template.name,
      error: error.message,
    },
  });
}
```

Benefits:
- ✅ Clear categorization
- ✅ Template tracking
- ✅ Recovery guidance
- ✅ Retryable by default

## Migration Checklist

### Command-Level

- [ ] Wrap command actions with `withErrorHandling()`
- [ ] Remove manual `process.exit()` calls
- [ ] Remove manual error logging
- [ ] Add verbose option support
- [ ] Test error scenarios

### Module-Level

- [ ] Replace generic `Error` with specific error classes
- [ ] Add context data to errors
- [ ] Wrap file operations with `withFileSystemErrors()`
- [ ] Add retry logic for network operations
- [ ] Add recovery actions where applicable

### Testing

- [ ] Add error tests for each module
- [ ] Test retry logic
- [ ] Test recovery strategies
- [ ] Test verbose mode
- [ ] Test exit codes

## Common Pitfalls

### ❌ Don't: Mix error handling styles

```typescript
// Bad - mixed styles
throw new FileSystemError('Error', path);
console.error('Also logging to console');
process.exit(1);
```

### ✅ Do: Use one approach

```typescript
// Good - throw and let middleware handle
throw new FileSystemError('Error', path, {
  code: ErrorCode.FILE_NOT_FOUND,
});
```

### ❌ Don't: Catch errors without re-throwing

```typescript
// Bad - swallows error
try {
  await operation();
} catch (error) {
  console.error('Error occurred');
  // Error is lost!
}
```

### ✅ Do: Transform or re-throw

```typescript
// Good - transform and throw
try {
  await operation();
} catch (error) {
  throw new CLIError('Operation failed', {
    code: ErrorCode.INTERNAL_ERROR,
    contextData: { originalError: error.message },
  });
}
```

### ❌ Don't: Ignore error types

```typescript
// Bad - all errors treated the same
if (error) {
  console.error('Error:', error.message);
}
```

### ✅ Do: Use type-specific handling

```typescript
// Good - type-specific handling
if (error instanceof AuthenticationError) {
  // User action required
  throw error;
} else if (error instanceof NetworkError) {
  // Retry automatically
  await withRetry(() => operation());
}
```

## Migration Example: Full Command

**Before:**
```typescript
export async function myCommand(options: Options): Promise<void> {
  console.log('Starting...');

  const specPath = options.spec || 'spec.md';

  if (!existsSync(specPath)) {
    console.error('Spec file not found');
    process.exit(1);
  }

  let content;
  try {
    content = await fs.readFile(specPath, 'utf-8');
  } catch (error) {
    console.error('Failed to read file:', error.message);
    process.exit(1);
  }

  let parsed;
  try {
    parsed = parseSpec(content);
  } catch (error) {
    console.error('Failed to parse spec:', error.message);
    process.exit(1);
  }

  const result = validateSpec(parsed);
  if (!result.success) {
    console.error('Validation failed');
    result.errors.forEach(e => console.error(`  ${e.message}`));
    process.exit(1);
  }

  let generated;
  let retries = 0;
  while (retries < 3) {
    try {
      generated = await generateWithAI(parsed);
      break;
    } catch (error) {
      retries++;
      if (retries >= 3) {
        console.error('AI generation failed after retries');
        process.exit(1);
      }
      await sleep(1000 * retries);
    }
  }

  try {
    await fs.writeFile(options.output, generated);
  } catch (error) {
    console.error('Failed to write output:', error.message);
    process.exit(1);
  }

  console.log('Success!');
}
```

**After:**
```typescript
import {
  FileSystemError,
  ValidationError,
  ErrorCode,
  withFileSystemErrors,
  withRetryProgress,
} from '../lib/errors';

export async function myCommand(options: Options): Promise<void> {
  console.log('Starting...');

  const specPath = options.spec || 'spec.md';

  // Check file existence
  if (!existsSync(specPath)) {
    throw new FileSystemError('Spec file not found', specPath, {
      code: ErrorCode.SPEC_NOT_FOUND,
    });
  }

  // Read file with error handling
  const content = await withFileSystemErrors(
    async () => fs.readFile(specPath, 'utf-8'),
    specPath
  );

  // Parse spec (errors are already structured)
  const parsed = parseSpec(content);

  // Validate with structured error
  const result = validateSpec(parsed);
  if (!result.success) {
    console.error('Validation failed');
    result.errors.forEach(e => console.error(`  ${e.message}`));

    throw new ValidationError('Validation failed', {
      code: ErrorCode.SPEC_VALIDATION_ERROR,
      contextData: { errorCount: result.errors.length },
    });
  }

  // Generate with automatic retry
  const generated = await withRetryProgress(
    async () => generateWithAI(parsed),
    {
      operation: 'Generating with AI',
      strategy: { maxRetries: 3 },
    }
  );

  // Write output with error handling
  await withFileSystemErrors(
    async () => fs.writeFile(options.output, generated),
    options.output
  );

  console.log('Success!');
}
```

**In index.ts:**
```typescript
import { withErrorHandling } from './lib/errors';

program
  .command('mycommand')
  .action(withErrorHandling(myCommand, { commandName: 'mycommand' }));
```

Benefits:
- ✅ 50% less error handling code
- ✅ Consistent error messages
- ✅ Automatic retry
- ✅ Recovery suggestions
- ✅ Proper exit codes
- ✅ Verbose mode support
- ✅ Better user experience

## Testing Migration

### Before Migration
```typescript
// Manual testing
$ node cli.js mycommand --spec missing.md
Error: File not found
$ echo $?
1
```

### After Migration
```typescript
// Structured errors with recovery
$ node cli.js mycommand --spec missing.md

✗ Spec file not found: missing.md

  path: /full/path/to/missing.md

How to fix:
  1. Check that the file path is correct
  2. Create one
     onboardkit init

$ echo $?
5  # Proper FILE_SYSTEM_ERROR exit code
```

## Gradual Migration Strategy

1. **Week 1**: Add error system, wrap main commands
2. **Week 2**: Migrate file operations
3. **Week 3**: Migrate network operations
4. **Week 4**: Add retry logic
5. **Week 5**: Add recovery strategies
6. **Week 6**: Testing and refinement

## Support

For questions or issues:
1. Check examples in `INTEGRATION-EXAMPLES.md`
2. Review API docs in `README.md`
3. Look at test files for usage patterns
4. Check error catalog in `messages.ts`
