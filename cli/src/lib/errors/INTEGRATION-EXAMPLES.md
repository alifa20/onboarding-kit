# Error Handling Integration Examples

Real-world examples showing how the error handling system works in OnboardKit CLI.

## Example 1: File Not Found Error

### User Action
```bash
onboardkit validate --spec missing.md
```

### What Happens

1. **Command Execution**:
```typescript
// In validate command
const specPath = options.spec || 'spec.md';

if (!existsSync(specPath)) {
  throw new FileSystemError('Spec file not found', specPath, {
    code: ErrorCode.SPEC_NOT_FOUND,
  });
}
```

2. **Error Caught by Middleware**:
```typescript
// withErrorHandling wraps the command
try {
  await validateCommand(options);
} catch (error) {
  await handleError(error, context);
}
```

3. **Error Formatted**:
```typescript
// formatError creates user-friendly output
const formatted = formatErrorMessage(
  ErrorCode.SPEC_NOT_FOUND,
  'Spec file not found: missing.md',
  { path: '/full/path/to/missing.md' }
);
```

4. **Recovery Attempted**:
```typescript
// RecoveryManager tries strategies
const result = await manager.tryRecover(error, context);
// CleanupRecovery checks if file can be created
```

### User Sees
```
✗ Spec file not found: missing.md

  path: /Users/user/project/missing.md

How to fix:
  1. Create a new spec file
     onboardkit init
  2. Specify a spec file path
     onboardkit validate --spec path/to/spec.md

Process exits with code 5 (FILE_SYSTEM_ERROR)
```

---

## Example 2: Network Timeout with Retry

### User Action
```bash
onboardkit onboard
```

### What Happens

1. **AI Provider Call**:
```typescript
// In AI provider
const response = await withRetry(
  async () => fetch(apiUrl, options),
  {
    strategy: {
      maxRetries: 3,
      initialDelayMs: 1000,
    },
  }
);
```

2. **First Attempt Fails**:
```typescript
// Network timeout occurs
throw new NetworkError('Request timed out', {
  url: apiUrl,
  statusCode: 408,
});
```

3. **Retry Detection**:
```typescript
// isRetryableError checks the error
if (error instanceof NetworkError) {
  return true; // Retryable
}
```

4. **Exponential Backoff**:
```typescript
// Attempt 1: Wait 1s
// Attempt 2: Wait 2s
// Attempt 3: Wait 4s
const delay = calculateRetryDelay(attemptNumber);
await sleep(delay);
```

5. **Success on Retry**:
```typescript
// Third attempt succeeds
callbacks?.onSuccess?.();
return result;
```

### User Sees
```
⠋ Generating content with AI...
Operation failed (attempt 1): Request timed out
Retrying in 1s...

⠋ Generating content with AI...
Operation failed (attempt 2): Request timed out
Retrying in 2s...

⠋ Generating content with AI...
✓ Content generated successfully
```

---

## Example 3: Rate Limit with Retry-After

### User Action
```bash
onboardkit onboard --ai-enhance
```

### What Happens

1. **API Call**:
```typescript
const response = await withRetryProgress(
  async () => callAIProvider(),
  {
    operation: 'Enhancing content',
  }
);
```

2. **Rate Limited**:
```typescript
// Provider returns 429
throw new NetworkError('Rate limit exceeded', {
  statusCode: 429,
  retryAfter: 60, // 60 seconds
});
```

3. **Smart Retry**:
```typescript
// Respects Retry-After header
if (error instanceof NetworkError && error.retryAfter) {
  delay = error.retryAfter * 1000; // 60000ms
}
await sleep(delay);
```

### User Sees
```
⠋ Enhancing content...
Enhancing content failed (attempt 1): Rate limit exceeded
Retrying in 60s...

⠋ Enhancing content...
✓ Content enhanced successfully
```

---

## Example 4: Validation Error with Context

### User Action
```bash
onboardkit validate
```

### What Happens

1. **Spec Validation**:
```typescript
const result = validateSpec(parsed);

if (!result.success) {
  throw new ValidationError('Spec validation failed', {
    code: ErrorCode.SPEC_VALIDATION_ERROR,
    contextData: {
      errorCount: result.errors.length,
      errors: result.errors,
    },
  });
}
```

2. **Error Formatted**:
```typescript
// formatError includes context
console.error(formatError(error, { verbose: options.verbose }));
```

### User Sees (Normal Mode)
```
✗ Spec validation failed

  errorCount: 3

How to fix:
  1. Review validation errors above
  2. Run validation to see all issues
     onboardkit validate --verbose
```

### User Sees (Verbose Mode)
```
✗ Spec validation failed

  errorCount: 3

Error Details:
{
  "errorCount": 3,
  "errors": [
    {
      "path": ["theme", "primary"],
      "message": "Invalid hex color"
    },
    {
      "path": ["onboardingSteps", "0", "headline"],
      "message": "Field required"
    },
    {
      "path": ["login", "methods"],
      "message": "Must include at least one method"
    }
  ]
}

How to fix:
  1. Review validation errors above
  2. Run validation to see all issues
     onboardkit validate --verbose
```

---

## Example 5: Workflow Phase Failure with Checkpoint

### User Action
```bash
onboardkit onboard
```

### What Happens

1. **Phase Execution**:
```typescript
try {
  await executePhase('enhance', spec, options);
} catch (error) {
  throw new WorkflowError('Enhancement phase failed', {
    phase: 'enhance',
    checkpoint: 'checkpoint-4-enhancement',
    metadata: {
      canRetry: true,
      canRollback: true,
    },
  });
}
```

2. **Recovery Strategy**:
```typescript
// CheckpointRecovery detects workflow error
const recovery = new CheckpointRecovery();
if (recovery.canRecover(error)) {
  const result = await recovery.recover(error, context);
  // Suggests resuming from checkpoint
}
```

### User Sees
```
✗ Enhancement phase failed

  phase: enhance
  checkpoint: checkpoint-4-enhancement

How to fix:
  1. Resume from last checkpoint
     onboardkit onboard --resume
  2. Reset and start over
     onboardkit reset
```

---

## Example 6: Permission Error with Recovery

### User Action
```bash
onboardkit generate --output /protected/folder
```

### What Happens

1. **Directory Creation Fails**:
```typescript
try {
  await fs.mkdir(outputDir, { recursive: true });
} catch (error) {
  throw fromNodeError(error, outputDir);
  // Converts EACCES to FILE_ACCESS_DENIED
}
```

2. **Permission Recovery**:
```typescript
// PermissionRecovery strategy
const recovery = new PermissionRecovery();
const result = await recovery.recover(error, context);
```

### User Sees
```
✗ Permission denied: /protected/folder

  path: /protected/folder

How to fix:
  1. Check file permissions
     ls -la /protected/folder
  2. Fix permissions if needed
     chmod u+rw /protected/folder
```

---

## Example 7: File Conflict with Cleanup

### User Action
```bash
onboardkit generate --output existing-folder
```

### What Happens

1. **Directory Already Exists**:
```typescript
const outputExists = await fs.access(outputDir)
  .then(() => true)
  .catch(() => false);

if (outputExists && !options.overwrite) {
  throw new FileSystemError('Output directory exists', outputDir, {
    code: ErrorCode.FILE_ALREADY_EXISTS,
  });
}
```

2. **Cleanup Recovery**:
```typescript
// CleanupRecovery suggests options
const recovery = new CleanupRecovery();
const result = await recovery.recover(error, context);
```

### User Sees
```
✗ File or directory already exists: existing-folder

  path: /Users/user/project/existing-folder

How to fix:
  1. Use --overwrite flag to replace existing files
  2. Choose a different output directory
     onboardkit generate --output <different-path>
```

---

## Example 8: Authentication Token Expired

### User Action
```bash
onboardkit onboard
```

### What Happens

1. **Token Check**:
```typescript
const status = await getCredentialStatus(provider);

if (status.isExpired) {
  throw new AuthenticationError('Token expired', provider.name, {
    code: ErrorCode.AUTH_TOKEN_EXPIRED,
  });
}
```

2. **Error with Recovery**:
```typescript
// formatErrorMessage includes auth-specific guidance
const message = formatErrorMessage(
  ErrorCode.AUTH_TOKEN_EXPIRED,
  `Authentication token expired for ${provider}`,
  { provider }
);
```

### User Sees
```
✗ Authentication token expired

  provider: anthropic

How to fix:
  1. Re-authenticate with your provider
     onboardkit auth
  2. Check authentication status
     onboardkit auth status
```

---

## Example 9: Verbose Mode with Stack Trace

### User Action
```bash
onboardkit generate --verbose
```

### What Happens

1. **Error Occurs**:
```typescript
// Template rendering fails
throw new GenerationError('Failed to render template', {
  contextData: {
    template: 'WelcomeScreen.tsx',
    reason: 'Missing variable: projectName',
  },
});
```

2. **Verbose Formatting**:
```typescript
const formatted = formatError(error, {
  verbose: true,
  showStack: true,
});
```

### User Sees
```
✗ Failed to render template

  template: WelcomeScreen.tsx
  reason: Missing variable: projectName

Error Details:
{
  "template": "WelcomeScreen.tsx",
  "reason": "Missing variable: projectName"
}

Stack Trace:
GenerationError: Failed to render template
    at renderTemplate (file:///cli/src/lib/templates/renderer.ts:45:11)
    at async generateCommand (file:///cli/src/commands/generate.ts:120:24)
    at async Command.<anonymous> (file:///cli/src/index.ts:75:5)

How to fix:
  1. Check spec file for invalid values
  2. Use verbose mode for details
     onboardkit generate --verbose
```

---

## Example 10: Unhandled Error

### User Action
```bash
onboardkit generate
```

### What Happens

1. **Unexpected Error**:
```typescript
// Something throws an unexpected error
throw new Error('Unexpected: Cannot read property x of undefined');
```

2. **Global Handler**:
```typescript
// initializeErrorHandling sets up global handlers
process.on('uncaughtException', (error: Error) => {
  console.error('\nUncaught Exception:');
  console.error(error);
  process.exit(ExitCode.INTERNAL_ERROR);
});
```

### User Sees
```
Uncaught Exception:
Error: Unexpected: Cannot read property x of undefined
    at Object.<anonymous> (...)
    ...

Process exits with code 1 (INTERNAL_ERROR)
```

---

## Testing Error Scenarios

### Test File Not Found
```bash
onboardkit validate --spec nonexistent.md
```

### Test Permission Error
```bash
# Create protected directory
sudo mkdir /protected
sudo chmod 000 /protected

onboardkit generate --output /protected/folder
```

### Test Validation Error
```bash
# Create invalid spec
echo "# Invalid" > test-spec.md

onboardkit validate --spec test-spec.md
```

### Test Network Retry (Mock)
```typescript
// In tests
vi.spyOn(fetch, 'default')
  .mockRejectedValueOnce(new Error('Network timeout'))
  .mockRejectedValueOnce(new Error('Network timeout'))
  .mockResolvedValue({ ok: true, json: async () => ({}) });

await withRetry(() => fetch(url));
// Succeeds after 2 retries
```

---

## Exit Code Reference

Test exit codes:

```bash
# Success
onboardkit init && echo "Exit code: $?"
# Output: Exit code: 0

# File not found
onboardkit validate --spec missing.md || echo "Exit code: $?"
# Output: Exit code: 5

# Validation error
onboardkit validate --spec invalid.md || echo "Exit code: $?"
# Output: Exit code: 6

# Network error (with mock)
# Exit code: 4

# Authentication error
onboardkit onboard # (without auth)
# Exit code: 3
```

---

## Best Practices from Examples

1. **Always use specific error classes**
   ```typescript
   throw new FileSystemError(...); // Good
   throw new Error('File error');   // Bad
   ```

2. **Include context data**
   ```typescript
   throw new NetworkError('Failed', {
     url: apiUrl,
     statusCode: response.status,
   });
   ```

3. **Wrap file operations**
   ```typescript
   await withFileSystemErrors(
     async () => fs.readFile(path),
     path
   );
   ```

4. **Use retry for network operations**
   ```typescript
   await withRetryProgress(
     async () => apiCall(),
     { operation: 'Fetching data' }
   );
   ```

5. **Provide recovery actions**
   ```typescript
   throw new CLIError('Error', {
     code: ErrorCode.SOMETHING,
     recoveryActions: [
       { description: 'Try this', command: 'onboardkit fix' }
     ],
   });
   ```
