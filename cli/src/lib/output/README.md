# Output Management System

This module provides comprehensive output management for generated code in OnboardKit.

## Features

- **Atomic File Writing**: Files are written atomically using temp files and rename operations
- **Directory Structure Management**: Standard directory structure creation and validation
- **Metadata Tracking**: SHA-256 checksums, file sizes, and generation timestamps
- **Validation**: TypeScript syntax checking and compilation validation
- **Logging**: Verbose logging for debugging and operation tracking
- **Summaries**: Generation summaries with statistics

## Modules

### structure.ts
Defines the standard output directory structure:
```
onboardkit-output/
├── screens/          # Generated screen components
├── theme/            # Theme files (colors, typography, spacing)
├── components/       # Reusable UI components
├── navigation/       # Navigation configuration
├── .onboardkit/      # Metadata and manifests
│   ├── output-manifest.json
│   └── generation-summary.json
└── index.ts          # Root export file
```

### manager.ts
Output directory management:
- `createOutputDirectory()` - Create standard directory structure
- `ensureOutputDirectory()` - Create and validate directory
- `validateDirectoryPermissions()` - Check read/write permissions
- `directoryExists()` - Check if directory exists

### writer.ts
Atomic file writing:
- `writeFileAtomic()` - Write single file atomically
- `writeFiles()` - Batch write multiple files
- `formatFileSize()` - Format bytes to human-readable size
- `validateContent()` - Validate file content before writing

### metadata.ts
File metadata tracking:
- `createFileMetadata()` - Create metadata for a file
- `createOutputManifest()` - Generate output manifest
- `saveManifest()` - Save manifest to disk
- `computeChecksum()` - Calculate SHA-256 checksum
- `groupFilesByType()` - Group files by type
- `calculateManifestStats()` - Calculate statistics

### validator.ts
Code validation:
- `validateTypeScriptSyntax()` - Basic syntax checking
- `validateTypeScriptCompilation()` - Full TypeScript compilation
- `validateOutput()` - Validate all generated files
- `formatValidationErrors()` - Format errors for display

### summary.ts
Generation summaries:
- `createGenerationSummary()` - Create summary from manifest
- `saveSummary()` - Save summary to disk
- `formatSummaryForTerminal()` - Format for terminal display
- `formatFileList()` - Format file list
- `createSuccessMessage()` - Create success message with next steps

### logger.ts
Verbose logging:
- `OutputLogger` class - Main logger
- `createLogger()` - Create logger instance
- `formatDuration()` - Format duration strings

## Usage Example

```typescript
import {
  ensureOutputDirectory,
  writeFiles,
  createFileMetadata,
  createOutputManifest,
  saveManifest,
  createGenerationSummary,
  saveSummary,
  formatSummaryForTerminal,
  createLogger,
} from './lib/output';

// Initialize logger
const logger = createLogger(true); // verbose mode

// Create output directory
const structure = await ensureOutputDirectory('./my-output', {
  overwrite: true,
});

// Generate files
const files = {
  'screens/WelcomeScreen.tsx': welcomeCode,
  'theme/colors.ts': colorsCode,
  'components/Button.tsx': buttonCode,
};

// Write files atomically
logger.operationStart('Write files');
const writeResult = await writeFiles(files, structure.root);
logger.operationComplete('Write files');

// Create metadata
const metadata = [];
for (const [path, content] of Object.entries(files)) {
  const absolutePath = join(structure.root, path);
  metadata.push(createFileMetadata(absolutePath, content, structure.root));
}

// Save manifest
const manifest = createOutputManifest(structure.root, metadata);
await saveManifest(join(structure.metadata, 'output-manifest.json'), manifest);

// Create and display summary
const summary = createGenerationSummary(manifest, true, [], 5000);
console.log(formatSummaryForTerminal(summary));
```

## Error Handling

The module provides specific error types:

- `DirectoryExistsError` - Directory already exists
- `DirectoryPermissionError` - No read/write permission
- `ValidationError` - Code validation errors

## Testing

Run tests:
```bash
npm run test -- src/lib/output/__tests__/
```

Test coverage:
```bash
npm run test:coverage -- src/lib/output/
```

## Configuration

### File Permissions
- Directories: `0o755` (rwxr-xr-x)
- Files: `0o644` (rw-r--r--)

### Validation Options
```typescript
interface ValidationOptions {
  skipTypeCheck?: boolean;    // Skip TypeScript compilation
  skipSyntaxCheck?: boolean;  // Skip syntax validation
  timeout?: number;           // Compilation timeout (default: 30000ms)
}
```

### Write Options
```typescript
interface WriteOptions {
  dryRun?: boolean;          // Preview without writing
  mode?: number;             // File permissions (default: 0o644)
  encoding?: BufferEncoding; // Encoding (default: 'utf-8')
}
```

## Standards

- All file paths are absolute
- Files written atomically (temp → rename)
- SHA-256 checksums for integrity
- ISO 8601 timestamps
- Proper error propagation
- >80% test coverage
