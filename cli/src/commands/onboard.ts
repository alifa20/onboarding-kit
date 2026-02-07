/**
 * Onboard command: Full AI-powered workflow with 7 phases
 */

import { join } from 'node:path';
import { existsSync } from 'node:fs';
import * as clack from '@clack/prompts';
import pc from 'picocolors';
import {
  WorkflowPhase,
  createCheckpoint,
  updateCheckpoint,
  saveCheckpoint,
  clearCheckpoint,
  executePhase,
  checkResume,
  validateCheckpointData,
  showResumeInfo,
  ProgressTracker,
  showWorkflowBanner,
  showWorkflowComplete,
  showWorkflowError,
  formatDuration,
  type Checkpoint,
  type WorkflowOptions,
} from '../lib/workflow/index.js';
import { computeSpecHash } from '../lib/spec/hash.js';
import { formatFileSize } from '../lib/output/writer.js';

/**
 * Onboard command options
 */
interface OnboardCommandOptions {
  spec?: string;
  output?: string;
  aiRepair?: boolean;
  aiEnhance?: boolean;
  skipRefinement?: boolean;
  verbose?: boolean;
  dryRun?: boolean;
  overwrite?: boolean;
}

/**
 * Execute the onboard command
 */
export async function onboardCommand(options: OnboardCommandOptions = {}): Promise<void> {
  showWorkflowBanner();

  try {
    // Determine spec file path
    const specPath = options.spec
      ? join(process.cwd(), options.spec)
      : join(process.cwd(), 'spec.md');

    // Check if spec file exists
    if (!existsSync(specPath)) {
      clack.log.error(
        pc.red('✗ ') +
          `Spec file not found: ${pc.dim(specPath)}\n\n` +
          pc.dim('Run ') +
          pc.cyan('onboardkit init') +
          pc.dim(' to create a new spec file.')
      );
      process.exit(1);
    }

    // Determine output path
    const outputPath = options.output
      ? join(process.cwd(), options.output)
      : join(process.cwd(), 'onboardkit-output');

    // Convert options to workflow options
    const workflowOptions: WorkflowOptions = {
      spec: specPath,
      output: outputPath,
      aiRepair: options.aiRepair ?? false,
      aiEnhance: options.aiEnhance ?? false,
      skipRefinement: options.skipRefinement ?? true, // Skip by default for MVP
      verbose: options.verbose ?? false,
      dryRun: options.dryRun ?? false,
      overwrite: options.overwrite ?? false,
    };

    // Check for resume
    const resumeDecision = await checkResume(specPath, workflowOptions);

    let checkpoint: Checkpoint;
    let startPhase: WorkflowPhase;

    if (resumeDecision.shouldResume && resumeDecision.checkpoint) {
      // Resume from checkpoint
      checkpoint = resumeDecision.checkpoint;
      startPhase = resumeDecision.checkpoint.phase as WorkflowPhase;

      if (workflowOptions.verbose) {
        showResumeInfo(checkpoint);
      }

      // Validate checkpoint data
      const validation = validateCheckpointData(checkpoint);
      if (!validation.valid) {
        clack.log.warn(
          pc.yellow('⚠ ') +
            'Checkpoint data is incomplete. Starting fresh...\n' +
            pc.dim(validation.errors.join('\n'))
        );
        await clearCheckpoint(specPath);
        startPhase = 1 as WorkflowPhase;
        const specHash = await computeSpecHash(specPath);
        checkpoint = createCheckpoint(startPhase, specHash, specPath, outputPath);
      }
    } else {
      // Start fresh
      startPhase = 1 as WorkflowPhase;
      const specHash = await computeSpecHash(specPath);
      checkpoint = createCheckpoint(startPhase, specHash, specPath, outputPath);

      // Clear any existing checkpoint
      await clearCheckpoint(specPath);
    }

    // Create progress tracker
    const progress = new ProgressTracker(startPhase);

    // Show workflow info
    if (workflowOptions.verbose) {
      showWorkflowInfo(specPath, outputPath, workflowOptions);
    }

    // Execute phases
    const startTime = Date.now();

    for (let phase = startPhase; phase <= 7; phase++) {
      const currentPhase = phase as WorkflowPhase;

      // Start phase
      progress.startPhase(currentPhase);

      // Execute phase
      const result = await executePhase(currentPhase, checkpoint, workflowOptions);

      if (!result.success) {
        // Phase failed
        progress.failPhase(currentPhase, result.error || 'Unknown error');
        progress.stop();
        showWorkflowError(result.error || 'Phase execution failed');

        // Save checkpoint before exit
        checkpoint = updateCheckpoint(checkpoint, currentPhase, checkpoint.data);
        await saveCheckpoint(checkpoint);

        clack.log.info(
          pc.dim('Checkpoint saved. Run the command again to resume.')
        );
        process.exit(1);
      }

      // Check if phase was skipped
      if (currentPhase === WorkflowPhase.REPAIR) {
        if (!checkpoint.data.validationErrors || checkpoint.data.validationErrors.length === 0) {
          progress.skipPhase(currentPhase, 'No validation errors');
        } else if (!workflowOptions.aiRepair) {
          progress.skipPhase(currentPhase, 'AI repair not enabled');
        } else {
          progress.completePhase(
            currentPhase,
            `Fixed ${checkpoint.data.repairResult?.changes.length || 0} issues`
          );
        }
      } else if (currentPhase === WorkflowPhase.ENHANCEMENT) {
        if (!workflowOptions.aiEnhance) {
          progress.skipPhase(currentPhase, 'AI enhancement not enabled');
        } else {
          progress.completePhase(
            currentPhase,
            `Enhanced ${checkpoint.data.enhancementResult?.enhancements.length || 0} fields`
          );
        }
      } else if (currentPhase === WorkflowPhase.REFINEMENT) {
        progress.skipPhase(currentPhase, 'Skipped (not implemented in MVP)');
      } else if (currentPhase === WorkflowPhase.GENERATION) {
        const fileCount = Object.keys(checkpoint.data.generatedFiles || {}).length;
        progress.completePhase(currentPhase, `Generated ${fileCount} files`);
      } else if (currentPhase === WorkflowPhase.FINALIZE) {
        const fileCount = result.data?.fileCount || 0;
        const totalSize = result.data?.totalSize || 0;
        const sizeStr = formatFileSize(totalSize);
        progress.completePhase(currentPhase, `Wrote ${fileCount} files (${sizeStr})`);
      } else {
        progress.completePhase(currentPhase);
      }

      // Update checkpoint
      checkpoint = updateCheckpoint(checkpoint, currentPhase, checkpoint.data);
      await saveCheckpoint(checkpoint);

      // Add small delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // All phases completed
    progress.stop();

    // Clear checkpoint on success
    await clearCheckpoint(specPath);

    // Show summary
    const duration = Date.now() - startTime;
    showSuccessSummary(checkpoint, duration, workflowOptions);

    showWorkflowComplete();
  } catch (error) {
    clack.log.error(
      pc.red('✗ Fatal error: ') + (error instanceof Error ? error.message : 'Unknown error')
    );

    if (options.verbose && error instanceof Error && error.stack) {
      console.log('\n' + pc.dim(error.stack));
    }

    showWorkflowError('Unexpected error occurred');
    process.exit(1);
  }
}

/**
 * Show workflow configuration info
 */
function showWorkflowInfo(
  specPath: string,
  outputPath: string,
  options: WorkflowOptions
): void {
  const lines: string[] = [];

  lines.push('');
  lines.push(pc.bold('Configuration:'));
  lines.push(pc.dim('─'.repeat(50)));
  lines.push(`  ${pc.cyan('Spec:')} ${specPath}`);
  lines.push(`  ${pc.cyan('Output:')} ${outputPath}`);
  lines.push(`  ${pc.cyan('AI Repair:')} ${options.aiRepair ? pc.green('✓') : pc.dim('✗')}`);
  lines.push(`  ${pc.cyan('AI Enhance:')} ${options.aiEnhance ? pc.green('✓') : pc.dim('✗')}`);
  lines.push(`  ${pc.cyan('Dry Run:')} ${options.dryRun ? pc.yellow('✓') : pc.dim('✗')}`);
  lines.push(pc.dim('─'.repeat(50)));
  lines.push('');

  console.log(lines.join('\n'));
}

/**
 * Show success summary
 */
function showSuccessSummary(
  checkpoint: Checkpoint,
  duration: number,
  options: WorkflowOptions
): void {
  const lines: string[] = [];

  lines.push('');
  lines.push(pc.bold(pc.green('Success! ')) + pc.bold('Your onboarding screens are ready.'));
  lines.push('');
  lines.push(pc.dim('─'.repeat(50)));

  // Show file count
  const fileCount = Object.keys(checkpoint.data.generatedFiles || {}).length;
  lines.push(`  ${pc.cyan('Files Generated:')} ${fileCount}`);

  // Show output location
  lines.push(`  ${pc.cyan('Output Directory:')} ${checkpoint.outputPath}`);

  // Show duration
  lines.push(`  ${pc.cyan('Duration:')} ${formatDuration(duration)}`);

  // Show AI operations
  if (checkpoint.data.repairResult) {
    const changeCount = checkpoint.data.repairResult.changes.length;
    lines.push(`  ${pc.cyan('AI Repairs:')} ${changeCount} issues fixed`);
  }

  if (checkpoint.data.enhancementResult) {
    const enhanceCount = checkpoint.data.enhancementResult.enhancements.length;
    lines.push(`  ${pc.cyan('AI Enhancements:')} ${enhanceCount} improvements made`);
  }

  lines.push(pc.dim('─'.repeat(50)));
  lines.push('');

  // Show next steps
  lines.push(pc.bold('Next Steps:'));
  lines.push('');
  lines.push(`  1. Review generated files in ${pc.cyan(checkpoint.outputPath)}`);
  lines.push(`  2. Copy files to your React Native/Expo project`);
  lines.push(`  3. Install dependencies: ${pc.cyan('npm install @react-navigation/native')}`);
  lines.push(`  4. Import and integrate screens into your app`);
  lines.push('');

  console.log(lines.join('\n'));
}
