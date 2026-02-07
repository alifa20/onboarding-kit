# Output Module Integration Guide

This guide explains how to integrate the output management system into other parts of OnboardKit.

## Quick Start

```typescript
import { ensureOutputDirectory, writeFiles, createLogger } from './lib/output';

const logger = createLogger(true);
const structure = await ensureOutputDirectory('./output');

const files = {
  'screens/Welcome.tsx': code,
};

await writeFiles(files, structure.root);
```

## Integration Points

### 1. Generate Command (Already Integrated)

The `generate` command in `src/commands/generate.ts` fully integrates the output system:

```typescript
// Create output directory
const structure = await ensureOutputDirectory(outputDir, {
  overwrite: options.overwrite,
  dryRun: options.dryRun,
});

// Write files
const writeResult = await writeFiles(files, structure.root);

// Create metadata
const manifest = createOutputManifest(structure.root, metadata);
await saveManifest(manifestPath, manifest);

// Display summary
console.log(formatSummaryForTerminal(summary));
```

### 2. Onboard Command (Future Integration)

When implementing the `onboard` command, use the same pattern:

```typescript
import { ensureOutputDirectory, writeFiles, createLogger } from '../lib/output';

export async function onboardCommand(options: OnboardOptions) {
  const logger = createLogger(options.verbose);

  // Create output directory
  logger.operationStart('Create output directory');
  const structure = await ensureOutputDirectory(options.output || 'onboardkit-output');
  logger.operationComplete('Create output directory');

  // Generate files with AI
  const files = await generateWithAI(spec);

  // Write files
  logger.operationStart('Write files');
  const result = await writeFiles(files, structure.root);
  logger.operationComplete('Write files');

  // Save metadata
  // ... (same as generate command)
}
```

### 3. Template System Integration

The template system should return files in the correct format:

```typescript
// Template renderer output format
interface RenderResult {
  files: Array<{
    path: string;      // Relative path (e.g., 'screens/Welcome.tsx')
    content: string;   // File content
  }>;
  summary: {
    totalFiles: number;
    screens: number;
    components: number;
    themeFiles: number;
    navigationFiles: number;
  };
}

// Convert to output system format
const filesForOutput: Record<string, string> = {};
for (const file of renderResult.files) {
  filesForOutput[file.path] = file.content;
}

await writeFiles(filesForOutput, outputDir);
```

### 4. AI Integration (Future)

When AI enhances or generates code, validate before writing:

```typescript
import { validateOutput, formatValidationErrors } from '../lib/output';

// Generate code with AI
const generatedFiles = await aiProvider.generateCode(spec);

// Validate before writing
const validation = await validateOutput(generatedFiles, {
  skipTypeCheck: false, // Enable full validation
});

if (!validation.success) {
  console.error(formatValidationErrors(validation));
  // Handle validation errors (retry with AI, manual fix, etc.)
}

// Write validated files
await writeFiles(generatedFiles, outputDir);
```

## Best Practices

### 1. Always Use Logger

```typescript
const logger = createLogger(options.verbose);

logger.operationStart('Generate files');
try {
  // ... operation
  logger.operationComplete('Generate files', duration);
} catch (error) {
  logger.operationError('Generate files', error);
  throw error;
}
```

### 2. Handle Errors Gracefully

```typescript
try {
  await ensureOutputDirectory(dir);
} catch (error) {
  if (error instanceof DirectoryExistsError) {
    // Prompt user for overwrite
  } else if (error instanceof DirectoryPermissionError) {
    // Show permission error with fix instructions
  } else {
    // Generic error handling
  }
}
```

### 3. Always Create Metadata

```typescript
// Create metadata for all generated files
const metadata: FileMetadata[] = [];
for (const [path, content] of Object.entries(files)) {
  metadata.push(createFileMetadata(
    join(outputDir, path),
    content,
    outputDir,
    'template-name' // Optional: track which template was used
  ));
}

// Save manifest
const manifest = createOutputManifest(outputDir, metadata);
await saveManifest(join(structure.metadata, 'output-manifest.json'), manifest);
```

### 4. Display User-Friendly Summaries

```typescript
// Create summary
const summary = createGenerationSummary(manifest, true, [], duration);

// Display in terminal
console.log(formatSummaryForTerminal(summary));

// Show file list in verbose mode
if (options.verbose) {
  console.log(formatFileList(metadata, true));
}

// Show success message
console.log(createSuccessMessage(outputDir));
```

### 5. Support Dry Run

```typescript
// All write operations support dry run
await writeFiles(files, outputDir, {
  dryRun: options.dryRun,
});

if (options.dryRun) {
  console.log('Dry run complete - no files written');
  // Show what would have been created
}
```

## Common Patterns

### Pattern 1: Generate → Validate → Write → Summarize

```typescript
async function generateAndWrite(spec: OnboardingSpec, outputDir: string) {
  const logger = createLogger(true);
  const startTime = Date.now();

  // 1. Generate files
  logger.operationStart('Generate files');
  const files = await generateFiles(spec);
  logger.operationComplete('Generate files');

  // 2. Validate
  logger.operationStart('Validate output');
  const validation = await validateOutput(files);
  if (!validation.success) {
    throw new Error('Validation failed');
  }
  logger.operationComplete('Validate output');

  // 3. Create output directory
  const structure = await ensureOutputDirectory(outputDir);

  // 4. Write files
  logger.operationStart('Write files');
  await writeFiles(files, structure.root);
  logger.operationComplete('Write files');

  // 5. Create metadata
  const metadata = createMetadata(files, structure.root);
  const manifest = createOutputManifest(structure.root, metadata);
  await saveManifest(join(structure.metadata, 'output-manifest.json'), manifest);

  // 6. Display summary
  const summary = createGenerationSummary(manifest, true, [], Date.now() - startTime);
  console.log(formatSummaryForTerminal(summary));
}
```

### Pattern 2: Incremental Writing with Progress

```typescript
async function writeWithProgress(files: Record<string, string>, outputDir: string) {
  const logger = createLogger(true);
  const totalFiles = Object.keys(files).length;
  let written = 0;

  for (const [path, content] of Object.entries(files)) {
    const fullPath = join(outputDir, path);
    await writeFileAtomic(fullPath, content);
    written++;

    logger.info(`Progress: ${written}/${totalFiles} files written`);
  }
}
```

### Pattern 3: Conditional Validation

```typescript
async function writeWithOptionalValidation(
  files: Record<string, string>,
  outputDir: string,
  skipValidation: boolean
) {
  if (!skipValidation) {
    const validation = await validateOutput(files, {
      skipTypeCheck: true, // Quick validation only
    });

    if (!validation.success) {
      console.warn('Validation warnings:', formatValidationErrors(validation));
      // Continue anyway, but warn user
    }
  }

  await writeFiles(files, outputDir);
}
```

## Error Handling Examples

### Handle Directory Exists

```typescript
try {
  await ensureOutputDirectory(dir);
} catch (error) {
  if (error instanceof DirectoryExistsError) {
    const overwrite = await confirm({
      message: 'Directory exists. Overwrite?',
    });

    if (overwrite) {
      await ensureOutputDirectory(dir, { overwrite: true });
    }
  }
}
```

### Handle Permission Errors

```typescript
try {
  await validateDirectoryPermissions(dir);
} catch (error) {
  if (error instanceof DirectoryPermissionError) {
    console.error(`No ${error.operation} permission for ${error.path}`);
    console.error('Fix: Run chmod +w ' + error.path);
    process.exit(1);
  }
}
```

### Handle Write Failures

```typescript
const result = await writeFiles(files, outputDir);

if (result.failureCount > 0) {
  console.error(`Failed to write ${result.failureCount} files:`);

  for (const file of result.files) {
    if (!file.success) {
      console.error(`  - ${file.path}: ${file.error}`);
    }
  }

  // Decide: retry, skip, or abort
}
```

## Testing Integration

When testing commands that use the output system:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('Generate Command Integration', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'test-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('should generate files to temp directory', async () => {
    await generateCommand({
      output: tempDir,
      spec: 'test-spec.md',
    });

    // Verify files exist
    // Verify manifest exists
    // Verify summary exists
  });
});
```

## Performance Considerations

1. **Batch Writes:** Use `writeFiles()` instead of multiple `writeFileAtomic()` calls
2. **Skip Validation:** For large codebases, skip TypeScript compilation validation
3. **Parallel Operations:** The system supports concurrent writes safely
4. **Dry Run:** Use for quick previews without I/O overhead

## Troubleshooting

### "Directory already exists" error
- Use `--overwrite` flag
- Or manually delete output directory

### "Permission denied" error
- Check directory permissions: `ls -la <dir>`
- Fix: `chmod +w <dir>`

### Validation fails
- Use `--skip-validation` flag to bypass
- Or review validation errors and fix templates

### Large file warnings
- Adjust `maxSize` parameter in `validateContent()`
- Default is 10MB per file

## Future Enhancements

1. **Streaming Writes:** For very large files
2. **Compression:** Optional gzip compression for output
3. **Incremental Generation:** Only regenerate changed files
4. **Backup:** Create backup before overwrite
5. **Rollback:** Undo failed generation
6. **Watch Mode:** Auto-regenerate on spec changes

## Summary

The output module provides:
- ✅ Atomic file operations
- ✅ Comprehensive metadata tracking
- ✅ Code validation
- ✅ User-friendly summaries
- ✅ Verbose logging
- ✅ Proper error handling
- ✅ Cross-platform support
- ✅ Dry-run mode
- ✅ Overwrite protection

Integrate it consistently across all commands for a reliable user experience.
