# OnboardKit Workflow Examples

This document shows real-world examples of using the OnboardKit workflow system.

## Example 1: Basic Workflow (Template-Only)

Generate onboarding screens without AI enhancements.

```bash
# Step 1: Create a spec file
onboardkit init

# Step 2: Edit spec.md with your content
# (Add project name, onboarding steps, theme, etc.)

# Step 3: Generate screens
onboardkit onboard

# Output:
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
│  ○ Enhancement - AI enhancement not enabled
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

## Example 2: AI-Enhanced Workflow

Let AI improve your copy and fix validation errors.

```bash
# Authenticate first (one-time setup)
onboardkit auth

# Generate with AI features
onboardkit onboard --ai-repair --ai-enhance

# Output:
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
│  ✓ Finalize - Wrote 15 files (47.8 KB)
│
└  ✓ Workflow complete!

Success! Your onboarding screens are ready.

────────────────────────────────────────────────
  Files Generated: 15
  Output Directory: onboardkit-output
  Duration: 45s
  AI Enhancements: 5 improvements made
────────────────────────────────────────────────
```

## Example 3: Handling Invalid Specs

When your spec has errors, use AI to fix them automatically.

```bash
# Your spec.md has validation errors
onboardkit onboard

# Output:
┌  OnboardKit AI Workflow
│
◇  [1/7] Auth Check - Verifying OAuth credentials
│  ✓ Auth Check
│
◇  [2/7] Spec Check - Validating specification
│  ✗ Spec Check - Spec validation failed:
│
│  Validation Errors:
│    • theme.primary: Invalid color format
│    • onboardingSteps[0].headline: Required field missing
│
│  Use --ai-repair to fix automatically.
│
└  ✗ Workflow failed

# Fix with AI
onboardkit onboard --ai-repair

# Output:
┌  OnboardKit AI Workflow
│
◇  Resume from Spec Check (saved 30 seconds ago)?
│  Yes
│
⚡ Resuming from phase 2 (saved 30 seconds ago)
│
◇  [2/7] Spec Check - Validating specification
│  ✓ Spec Check
│
◇  [3/7] Repair - Fixing validation errors
│  ✓ Repair - Fixed 2 issues
│
◇  [4/7] Enhancement - Improving copy with AI
│  ○ Enhancement - AI enhancement not enabled
│
◇  [5/7] Generation - Generating screens and components
│  ✓ Generation - Generated 15 files
│
...
```

## Example 4: Resuming After Interruption

If the workflow is interrupted, it automatically resumes.

```bash
# Start workflow
onboardkit onboard --ai-enhance

# (Workflow interrupted at Phase 4 - press Ctrl+C)
^C

# Later, run again
onboardkit onboard --ai-enhance

# Output:
┌  OnboardKit AI Workflow
│
◇  Resume from Enhancement (saved 5 minutes ago)?
│  Yes
│
⚡ Resuming from phase 4 (saved 5 minutes ago)
│
Checkpoint Info:
────────────────────────────────────────────────
  Spec: /path/to/spec.md
  Output: /path/to/onboardkit-output
  Saved: 5 minutes ago
  Phase: 4/7

Checkpoint Data:
  ✓ Validated Spec
  ○ Repaired Spec
  ○ Enhanced Spec
  ○ Generated Files
────────────────────────────────────────────────

◇  [4/7] Enhancement - Improving copy with AI
│  ✓ Enhancement - Enhanced 5 fields
│
◇  [5/7] Generation - Generating screens and components
│  ✓ Generation - Generated 15 files
│
...
```

## Example 5: Spec Changed - Start Fresh

If you modify the spec after creating a checkpoint, the workflow starts fresh.

```bash
# Run workflow
onboardkit onboard

# (Workflow completes successfully)

# Edit spec.md
vim spec.md

# Run again
onboardkit onboard

# Output:
┌  OnboardKit AI Workflow
│
⚠ Spec file has been modified since last checkpoint. Starting fresh...
│
◇  [1/7] Auth Check - Verifying OAuth credentials
│  ✓ Auth Check
│
...
```

## Example 6: Dry Run Preview

Preview what will be generated without writing files.

```bash
onboardkit onboard --dry-run

# Output:
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
│  ○ Enhancement - AI enhancement not enabled
│
◇  [5/7] Generation - Generating screens and components
│  ✓ Generation - Generated 15 files
│
◇  [6/7] Refinement - Optional AI refinement
│  ○ Refinement - Skipped (not implemented in MVP)
│
◇  [7/7] Finalize - Writing files to disk
│  ✓ Finalize - Wrote 15 files (45.2 KB) [DRY RUN]
│
└  ✓ Workflow complete!

Note: This was a dry run. No files were actually written.
Run without --dry-run to generate files.
```

## Example 7: Custom Output Directory

Generate files to a custom location.

```bash
onboardkit onboard --output ./src/onboarding

# Output:
Success! Your onboarding screens are ready.

────────────────────────────────────────────────
  Files Generated: 15
  Output Directory: ./src/onboarding
  Duration: 3s
────────────────────────────────────────────────

Next Steps:

  1. Review generated files in ./src/onboarding
  2. Copy files to your React Native/Expo project
  3. Install dependencies: npm install @react-navigation/native
  4. Import and integrate screens into your app
```

## Example 8: Manual Checkpoint Reset

Clear the checkpoint and start fresh.

```bash
# Clear checkpoint
onboardkit reset

# Output:
┌  Reset Workflow
│
◇  Are you sure you want to clear the workflow checkpoint?
│  Yes
│
◇  Clearing checkpoint...
│  ✓ Checkpoint cleared
│
│  Workflow checkpoint has been removed.
│  Next run of "onboardkit onboard" will start from the beginning.
│
└  Reset complete
```

## Example 9: Force Reset (No Confirmation)

```bash
onboardkit reset --force

# Output:
┌  Reset Workflow
│
◇  Clearing checkpoint...
│  ✓ Checkpoint cleared
│
└  Reset complete
```

## Example 10: Verbose Mode

See detailed information during execution.

```bash
onboardkit onboard --verbose --ai-enhance

# Output:
┌  OnboardKit AI Workflow
│
Configuration:
────────────────────────────────────────────────
  Spec: /path/to/spec.md
  Output: /path/to/onboardkit-output
  AI Repair: ✗
  AI Enhance: ✓
  Dry Run: ✗
────────────────────────────────────────────────

◇  [1/7] Auth Check - Verifying OAuth credentials
│  Checking stored providers...
│  Found: Anthropic
│  Validating access token...
│  ✓ Auth Check
│
◇  [2/7] Spec Check - Validating specification
│  Reading spec file...
│  Parsing markdown...
│  Validating against schema...
│  ✓ Spec Check
│
...
```

## Example 11: Multiple Specs

Work with multiple spec files.

```bash
# Generate from custom spec
onboardkit onboard --spec ./specs/fitness-app.md --output ./fitness-output

# Generate from another spec
onboardkit onboard --spec ./specs/recipe-app.md --output ./recipe-output

# Each spec has its own checkpoint
# Resuming works independently for each
```

## Example 12: Complete CI/CD Pipeline

Integrate into your build process.

```bash
#!/bin/bash
# ci-build.sh

set -e

echo "Step 1: Validate spec"
onboardkit validate --spec ./spec.md --verbose

echo "Step 2: Generate screens"
onboardkit onboard \
  --spec ./spec.md \
  --output ./app/onboarding \
  --overwrite

echo "Step 3: Run tests on generated code"
npm test -- app/onboarding

echo "✓ Build complete"
```

## Troubleshooting

### Authentication Errors

```bash
# If auth fails
onboardkit auth status

# Re-authenticate
onboardkit auth login

# Revoke and start fresh
onboardkit auth revoke
onboardkit auth login
```

### Spec Validation Errors

```bash
# See detailed validation errors
onboardkit validate --spec spec.md --verbose

# Let AI fix them
onboardkit onboard --ai-repair
```

### Checkpoint Issues

```bash
# If checkpoint is corrupted
onboardkit reset --force

# Start fresh
onboardkit onboard
```

### File Permission Errors

```bash
# Ensure output directory is writable
chmod -R u+w ./onboardkit-output

# Or use a different directory
onboardkit onboard --output ~/my-output
```

## Best Practices

### 1. Version Control

```bash
# Add checkpoint to .gitignore
echo ".onboardkit/" >> .gitignore

# Commit your spec file
git add spec.md
git commit -m "Update onboarding spec"
```

### 2. Iterative Development

```bash
# Start simple (no AI)
onboardkit onboard

# Review and iterate
vim spec.md
onboardkit reset
onboardkit onboard

# Add AI when ready
onboardkit onboard --ai-enhance
```

### 3. Production Workflow

```bash
# 1. Authenticate (one-time)
onboardkit auth

# 2. Create spec
onboardkit init

# 3. Generate with AI
onboardkit onboard --ai-repair --ai-enhance

# 4. Review output
cd onboardkit-output
ls -la

# 5. Copy to project
cp -r onboardkit-output/* ../my-app/src/onboarding/

# 6. Commit
git add .
git commit -m "Add AI-generated onboarding screens"
```

## Additional Resources

- [Workflow System Documentation](./src/lib/workflow/README.md)
- [PRD](../_bmad-output/planning-artifacts/prd.md)
- [Implementation Checklist](../_bmad-output/planning-artifacts/implementation-checklist.md)
