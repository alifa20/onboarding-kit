# Workflow System

The workflow system implements the complete 7-phase onboarding generation workflow with checkpoint/resume functionality.

## Overview

The workflow executes these phases sequentially:

1. **Auth Check** - Verify OAuth credentials exist and are valid
2. **Spec Check** - Load and validate the specification file
3. **Repair (AI)** - Use AI to fix validation errors (optional)
4. **Enhancement (AI)** - Improve copy with AI (optional)
5. **Generation** - Render templates to generate screens
6. **Refinement (AI)** - Optional AI chat for tweaks (not implemented in MVP)
7. **Finalize** - Write all files atomically to disk

## Checkpoint System

After each phase, the workflow saves a checkpoint to `.onboardkit/checkpoint.json` in the project directory. This allows:

- **Resuming** from the last successful phase if interrupted
- **Spec validation** - checkpoints are invalidated if the spec file changes
- **Data preservation** - all phase results are saved and available to subsequent phases

### Checkpoint Structure

```typescript
interface Checkpoint {
  phase: WorkflowPhase;           // Current phase (1-7)
  specHash: string;               // SHA-256 hash of spec file
  timestamp: string;              // ISO timestamp
  specPath: string;               // Absolute path to spec file
  outputPath: string;             // Absolute path to output directory
  data: {
    validatedSpec?: OnboardingSpec;
    validationErrors?: ValidationError[];
    repairedSpec?: OnboardingSpec;
    repairResult?: AIRepairResult;
    enhancedSpec?: OnboardingSpec;
    enhancementResult?: AIEnhancementResult;
    generatedFiles?: Record<string, string>;
    metadata?: Record<string, any>;
  };
}
```

## Usage

### CLI Commands

```bash
# Run full workflow with AI features
onboardkit onboard --ai-repair --ai-enhance

# Run without AI (template-only)
onboardkit onboard

# Dry run (preview without writing)
onboardkit onboard --dry-run

# Clear checkpoint and start fresh
onboardkit reset

# Force clear without confirmation
onboardkit reset --force
```

### Programmatic Usage

```typescript
import {
  WorkflowPhase,
  createCheckpoint,
  saveCheckpoint,
  loadCheckpoint,
  executePhase,
  type WorkflowOptions,
} from './lib/workflow';

// Create initial checkpoint
const checkpoint = createCheckpoint(
  WorkflowPhase.AUTH_CHECK,
  specHash,
  '/path/to/spec.md',
  '/path/to/output'
);

// Configure workflow
const options: WorkflowOptions = {
  aiRepair: true,
  aiEnhance: true,
  skipRefinement: true,
  dryRun: false,
  overwrite: false,
};

// Execute phases
for (let phase = 1; phase <= 7; phase++) {
  const result = await executePhase(phase, checkpoint, options);

  if (!result.success) {
    console.error(`Phase ${phase} failed:`, result.error);
    break;
  }

  // Save checkpoint after each phase
  await saveCheckpoint(checkpoint);
}
```

## Phase Details

### Phase 1: Auth Check

Verifies that OAuth credentials exist and are valid. Will prompt user to authenticate if missing.

**Success criteria:**
- At least one provider is authenticated
- Access token is valid or can be refreshed

**Skipped if:** Never skipped

### Phase 2: Spec Check

Loads and validates the specification file against the schema.

**Success criteria:**
- Spec file exists
- Spec file can be parsed
- Spec passes schema validation OR `--ai-repair` is enabled

**Skipped if:** Never skipped

### Phase 3: Repair (AI)

Uses AI to automatically fix validation errors.

**Success criteria:**
- No validation errors OR repairs were successful

**Skipped if:**
- No validation errors exist
- `--ai-repair` not enabled

### Phase 4: Enhancement (AI)

Uses AI to improve headlines, subtext, CTAs, and feature descriptions.

**Success criteria:**
- Enhancement completed successfully

**Skipped if:**
- `--ai-enhance` not enabled

### Phase 5: Generation

Renders Handlebars templates to generate TypeScript/React Native code.

**Success criteria:**
- All templates rendered successfully
- Code formatted with Prettier

**Skipped if:** Never skipped

### Phase 6: Refinement (AI)

Optional interactive AI chat for making tweaks to specific screens.

**Success criteria:**
- N/A (not implemented in MVP)

**Skipped if:**
- Always skipped in MVP
- `--skip-refinement` enabled

### Phase 7: Finalize

Writes all generated files atomically to the output directory.

**Success criteria:**
- Output directory created
- All files written successfully
- Metadata file generated

**Skipped if:** Never skipped

## Error Handling

### Graceful Failures

If a phase fails, the workflow:

1. Stops execution
2. Saves the current checkpoint
3. Shows clear error message
4. Provides recovery guidance

### Resuming After Failure

```bash
# Fix the issue, then run again
onboardkit onboard

# The workflow will prompt to resume from the last checkpoint
# Or start fresh if you decline
```

### Manual Reset

```bash
# Clear checkpoint and start over
onboardkit reset
```

## Progress Tracking

The workflow provides real-time progress feedback:

```
┌  OnboardKit AI Workflow
│
◇  [1/7] Auth Check - Verifying OAuth credentials
│  ✓ Auth Check
│
◇  [2/7] Spec Check - Validating specification
│  ✓ Spec Check
│
◇  [3/7] Repair - Fixing validation errors
│  ○ Repair - No validation errors
│
◇  [4/7] Enhancement - Improving copy with AI
│  ✓ Enhancement - Enhanced 5 fields
│
◇  [5/7] Generation - Generating screens and components
│  ✓ Generation - Generated 15 files
│
◇  [6/7] Refinement - Optional AI refinement
│  ○ Refinement - Skipped (not implemented in MVP)
│
◇  [7/7] Finalize - Writing files to disk
│  ✓ Finalize - Wrote 15 files (45.2 KB)
│
└  ✓ Workflow complete!
```

## Testing

Tests are located in `__tests__/`:

- `checkpoint.test.ts` - Checkpoint save/load/clear
- `phases.test.ts` - Individual phase execution
- `resume.test.ts` - Resume logic
- `progress.test.ts` - Progress tracking
- `integration.test.ts` - Full workflow integration

Run tests:

```bash
npm test src/lib/workflow
```

## Architecture

### Modules

- `types.ts` - TypeScript interfaces and enums
- `checkpoint.ts` - Checkpoint persistence
- `phases.ts` - Phase implementations
- `resume.ts` - Resume decision logic
- `progress.ts` - Progress tracking and display
- `index.ts` - Public API exports

### Dependencies

The workflow integrates with:

- **OAuth system** (Task #2) - For authentication
- **Spec system** (Task #3) - For validation
- **AI operations** (Task #5) - For repair and enhancement
- **Template system** (Task #4) - For code generation
- **Output system** (Task #7) - For file writing

### Design Principles

1. **Atomic operations** - Each phase either completes fully or fails
2. **Immutable checkpoints** - Checkpoints are never modified, only replaced
3. **Data flow** - Each phase can access data from all previous phases
4. **Fail-safe** - Failures are always recoverable
5. **User feedback** - Clear progress and error messages

## Future Enhancements

- Implement Phase 6 (Refinement) with interactive AI chat
- Add parallel phase execution where possible
- Support custom phase ordering
- Add workflow hooks for plugins
- Implement rollback functionality
