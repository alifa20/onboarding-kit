# Error Handling System

Comprehensive error handling system for OnboardKit CLI with recovery strategies, retry logic, and actionable error messages.

## Architecture

### Error Hierarchy

```
Error (JavaScript)
└── CLIError (base)
    ├── ValidationError (spec validation)
    ├── GenerationError (code generation)
    ├── FileSystemError (file operations)
    ├── NetworkError (API calls)
    ├── AuthenticationError (OAuth)
    └── WorkflowError (workflow execution)
```

### Key Features

1. **Structured Error Codes**: Unique identifiers for each error type
2. **Exit Codes**: Standard Unix exit codes for different error categories
3. **Recovery Actions**: Actionable guidance for users
4. **Retry Logic**: Automatic retry with exponential backoff
5. **Context Data**: Additional information for debugging
6. **Verbose Mode**: Detailed error output with stack traces

## Usage

### Basic Error Throwing

```typescript
import { FileSystemError, ErrorCode } from '../lib/errors';

// Throw a specific error
throw new FileSystemError('File not found', '/path/to/file', {
  code: ErrorCode.FILE_NOT_FOUND,
});
```

### Command Error Handling

Commands are automatically wrapped with error handling middleware:

```typescript
import { withErrorHandling } from '../lib/errors';

// In index.ts
program
  .command('validate')
  .action(withErrorHandling(validateCommand, { commandName: 'validate' }));
```

### File System Operations

Wrap file system operations to convert Node.js errors to CLI errors:

```typescript
import { withFileSystemErrors } from '../lib/errors';

// Automatic error conversion
const content = await withFileSystemErrors(
  async () => readFile(path, 'utf-8'),
  path
);
```

### Retry Logic

Use retry logic for transient failures:

```typescript
import { withRetry, withRetryProgress } from '../lib/errors';

// Basic retry
const result = await withRetry(async () => {
  return await apiCall();
});

// Retry with progress indication
const result = await withRetryProgress(
  async () => apiCall(),
  {
    operation: 'Fetching data',
    strategy: { maxRetries: 5 },
  }
);
```

### Custom Recovery Strategies

Implement custom recovery strategies:

```typescript
import { RecoveryStrategy, RecoveryManager } from '../lib/errors';

const customStrategy: RecoveryStrategy = {
  canRecover: (error: Error) => error.message.includes('custom'),
  recover: async (error, context) => ({
    success: true,
    message: 'Custom recovery applied',
    actions: ['Run custom command'],
  }),
};

const manager = new RecoveryManager();
manager.addStrategy(customStrategy);
```

## Error Codes

### File System Errors
- `FILE_NOT_FOUND`: File or directory not found
- `FILE_ACCESS_DENIED`: Permission denied
- `FILE_ALREADY_EXISTS`: File or directory already exists
- `DIRECTORY_NOT_EMPTY`: Directory contains files
- `NO_SPACE_LEFT`: Disk space exhausted
- `TOO_MANY_OPEN_FILES`: File descriptor limit reached

### Spec Validation Errors
- `SPEC_NOT_FOUND`: Spec file not found
- `SPEC_PARSE_ERROR`: Failed to parse spec file
- `SPEC_VALIDATION_ERROR`: Spec validation failed
- `SPEC_INVALID_FORMAT`: Invalid spec format

### Authentication Errors
- `AUTH_NOT_CONFIGURED`: No authentication configured
- `AUTH_TOKEN_EXPIRED`: Token has expired
- `AUTH_TOKEN_INVALID`: Invalid token
- `AUTH_PROVIDER_UNAVAILABLE`: Provider is unavailable
- `AUTH_OAUTH_FAILED`: OAuth flow failed

### Network Errors
- `NETWORK_CONNECTION_FAILED`: Connection failed
- `NETWORK_TIMEOUT`: Request timed out
- `NETWORK_DNS_FAILED`: DNS resolution failed
- `NETWORK_SSL_ERROR`: SSL/TLS error
- `NETWORK_RATE_LIMIT`: Rate limit exceeded
- `NETWORK_PROXY_ERROR`: Proxy error

### AI/Generation Errors
- `AI_PROVIDER_ERROR`: AI provider error
- `AI_RESPONSE_INVALID`: Invalid AI response
- `AI_CONTEXT_TOO_LARGE`: Context too large
- `GENERATION_FAILED`: Code generation failed
- `TEMPLATE_ERROR`: Template rendering error

### Workflow Errors
- `WORKFLOW_CHECKPOINT_MISSING`: Checkpoint not found
- `WORKFLOW_PHASE_FAILED`: Phase failed
- `WORKFLOW_STATE_INVALID`: Invalid workflow state

## Exit Codes

Following Unix conventions:

- `0`: Success
- `1`: General error
- `2`: Misuse of command
- `3`: Authentication error
- `4`: Network error
- `5`: File system error
- `6`: Validation error
- `7`: Generation error
- `8`: Workflow error

## Recovery Strategies

### Checkpoint Recovery

Automatically suggests resuming from last checkpoint:

```typescript
const error = new WorkflowError('Phase failed', {
  phase: 'validation',
  checkpoint: 'checkpoint-123',
});
```

### Cleanup Recovery

Suggests cleanup for file conflicts:

```typescript
const error = new FileSystemError('Directory exists', '/path', {
  code: ErrorCode.FILE_ALREADY_EXISTS,
});
```

### Network Recovery

Automatic retry for network errors:

```typescript
const error = new NetworkError('Connection failed', {
  url: 'https://api.example.com',
  statusCode: 503,
});
```

## Retry Configuration

Default retry strategy:

```typescript
{
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 8000,
  backoffMultiplier: 2,
  retryableErrors: [
    ErrorCode.NETWORK_CONNECTION_FAILED,
    ErrorCode.NETWORK_TIMEOUT,
    ErrorCode.NETWORK_RATE_LIMIT,
    ErrorCode.AI_PROVIDER_ERROR,
    ErrorCode.AI_RESPONSE_INVALID,
  ]
}
```

Customize retry behavior:

```typescript
await withRetry(operation, {
  strategy: {
    maxRetries: 5,
    initialDelayMs: 2000,
    backoffMultiplier: 3,
  },
});
```

## Verbose Mode

Enable verbose mode for detailed error output:

```bash
onboardkit validate --verbose
onboardkit generate --verbose
```

In verbose mode:
- Full stack traces
- Context data (sanitized)
- File paths and permissions
- Timing information

## Error Messages

All errors include:
1. **Clear description**: What went wrong
2. **Context**: Relevant details (path, status code, etc.)
3. **Recovery actions**: How to fix it
4. **Related commands**: Helpful commands to run

Example error output:

```
✗ File not found: /path/to/spec.md

  path: /path/to/spec.md

How to fix:
  1. Check that the file path is correct
  2. Create one
     onboardkit init

Learn more: https://docs.onboardkit.com/errors/file-not-found
```

## Integration with Existing Modules

### AI Module Integration

The error system integrates with existing AI error types:

```typescript
import { AIError, AIRateLimitError } from '../lib/ai/types';

// These are automatically retryable
if (error instanceof AIRateLimitError) {
  // withRetry will handle this automatically
}
```

### OAuth Module Integration

OAuth errors are mapped to authentication errors:

```typescript
import { OAuthError } from '../lib/oauth';
import { AuthenticationError } from '../lib/errors';

try {
  await oauthFlow();
} catch (error) {
  if (error instanceof OAuthError) {
    throw new AuthenticationError(error.message, 'anthropic', {
      code: ErrorCode.AUTH_OAUTH_FAILED,
    });
  }
}
```

## Testing

Comprehensive test coverage:

```bash
# Run all error tests
npm test src/lib/errors/__tests__

# Run specific test suite
npm test src/lib/errors/__tests__/base.test.ts
npm test src/lib/errors/__tests__/retry.test.ts
npm test src/lib/errors/__tests__/recovery.test.ts
npm test src/lib/errors/__tests__/middleware.test.ts
```

## Best Practices

1. **Use specific error types**: Choose the most specific error class
2. **Include context**: Add relevant data to contextData
3. **Provide recovery actions**: Help users fix the problem
4. **Use error codes**: Makes errors identifiable and testable
5. **Handle gracefully**: Don't crash on unexpected errors
6. **Log appropriately**: stderr for errors, stdout for output
7. **Test error paths**: Write tests for error scenarios

## Examples

### Example 1: File Operation with Recovery

```typescript
import { withFileSystemErrors, FileSystemError, ErrorCode } from '../lib/errors';

try {
  await withFileSystemErrors(
    async () => fs.writeFile(path, content),
    path
  );
} catch (error) {
  if (error instanceof FileSystemError && error.code === ErrorCode.FILE_ALREADY_EXISTS) {
    // Handle file exists error
    const overwrite = await confirmOverwrite();
    if (overwrite) {
      await fs.writeFile(path, content);
    }
  } else {
    throw error;
  }
}
```

### Example 2: Network Operation with Retry

```typescript
import { withRetryProgress } from '../lib/errors';

const data = await withRetryProgress(
  async () => fetchFromAPI(),
  {
    operation: 'Fetching data from API',
    strategy: { maxRetries: 5, initialDelayMs: 2000 },
  }
);
```

### Example 3: Workflow with Checkpoint

```typescript
import { WorkflowError, ErrorCode } from '../lib/errors';

try {
  await executePhase('validation');
} catch (error) {
  throw new WorkflowError('Validation phase failed', {
    phase: 'validation',
    checkpoint: 'checkpoint-validation',
    metadata: {
      code: ErrorCode.WORKFLOW_PHASE_FAILED,
      canRetry: true,
      canRollback: true,
    },
  });
}
```

## API Reference

See individual module documentation:
- [Error Types](./types.ts)
- [Base Errors](./base.ts)
- [Error Messages](./messages.ts)
- [Retry Logic](./retry.ts)
- [Recovery Strategies](./recovery.ts)
- [Middleware](./middleware.ts)
- [Help System](./help.ts)
