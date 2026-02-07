/**
 * Resume logic for interrupted workflows
 */

import * as clack from '@clack/prompts';
import pc from 'picocolors';
import { loadCheckpoint, isCheckpointValid, formatCheckpointAge } from './checkpoint.js';
import { computeSpecHash } from '../spec/hash.js';
import type { Checkpoint, WorkflowOptions } from './types.js';

/**
 * Resume decision result
 */
export interface ResumeDecision {
  shouldResume: boolean;
  checkpoint: Checkpoint | null;
  startPhase: number;
}

/**
 * Check if we can resume from a checkpoint
 */
export async function checkResume(
  specPath: string,
  options: WorkflowOptions
): Promise<ResumeDecision> {
  // Load checkpoint
  const checkpoint = await loadCheckpoint(specPath);

  // No checkpoint found
  if (!checkpoint) {
    return {
      shouldResume: false,
      checkpoint: null,
      startPhase: 1,
    };
  }

  // Compute current spec hash
  const currentHash = await computeSpecHash(specPath);

  // Check if checkpoint is still valid (spec hasn't changed)
  if (!isCheckpointValid(checkpoint, currentHash)) {
    clack.log.warn(
      pc.yellow('⚠ ') +
        'Spec file has been modified since last checkpoint. Starting fresh...'
    );
    return {
      shouldResume: false,
      checkpoint: null,
      startPhase: 1,
    };
  }

  // Checkpoint is valid, ask user if they want to resume
  const age = formatCheckpointAge(checkpoint);
  const shouldResume = await promptResume(checkpoint, age);

  if (shouldResume) {
    return {
      shouldResume: true,
      checkpoint,
      startPhase: checkpoint.phase,
    };
  } else {
    return {
      shouldResume: false,
      checkpoint: null,
      startPhase: 1,
    };
  }
}

/**
 * Prompt user to resume from checkpoint
 */
async function promptResume(checkpoint: Checkpoint, age: string): Promise<boolean> {
  const phaseNames = [
    'Auth Check',
    'Spec Check',
    'Repair',
    'Enhancement',
    'Generation',
    'Refinement',
    'Finalize',
  ];

  const phaseName = phaseNames[checkpoint.phase - 1] || `Phase ${checkpoint.phase}`;

  const resume = await clack.confirm({
    message: `Resume from ${pc.cyan(phaseName)} ${pc.dim(`(saved ${age})`)}?`,
    initialValue: true,
  });

  if (clack.isCancel(resume)) {
    return false;
  }

  return resume === true;
}

/**
 * Validate checkpoint data integrity
 */
export function validateCheckpointData(checkpoint: Checkpoint): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check phase-specific data requirements
  switch (checkpoint.phase) {
    case 2: // Spec Check
      if (!checkpoint.data.validatedSpec && !checkpoint.data.validationErrors) {
        errors.push('Missing spec validation data');
      }
      break;

    case 3: // Repair
      if (checkpoint.data.validationErrors && !checkpoint.data.repairedSpec) {
        errors.push('Missing repair data');
      }
      break;

    case 4: // Enhancement
      if (!checkpoint.data.enhancedSpec && checkpoint.data.validatedSpec) {
        // Enhancement is optional, so this is not an error
      }
      break;

    case 5: // Generation
      if (!checkpoint.data.generatedFiles) {
        errors.push('Missing generated files');
      }
      break;

    case 7: // Finalize
      if (!checkpoint.data.generatedFiles) {
        errors.push('Missing files to finalize');
      }
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Show resume info
 */
export function showResumeInfo(checkpoint: Checkpoint): void {
  const lines: string[] = [];

  lines.push('');
  lines.push(pc.bold('Checkpoint Info:'));
  lines.push(pc.dim('─'.repeat(50)));
  lines.push(`  ${pc.cyan('Spec:')} ${checkpoint.specPath}`);
  lines.push(`  ${pc.cyan('Output:')} ${checkpoint.outputPath}`);
  lines.push(`  ${pc.cyan('Saved:')} ${formatCheckpointAge(checkpoint)}`);
  lines.push(`  ${pc.cyan('Phase:')} ${checkpoint.phase}/7`);

  // Show what data we have
  const hasValidated = !!checkpoint.data.validatedSpec;
  const hasRepaired = !!checkpoint.data.repairedSpec;
  const hasEnhanced = !!checkpoint.data.enhancedSpec;
  const hasGenerated = !!checkpoint.data.generatedFiles;

  lines.push('');
  lines.push(pc.dim('Checkpoint Data:'));
  lines.push(
    `  ${hasValidated ? pc.green('✓') : pc.dim('○')} Validated Spec`
  );
  lines.push(
    `  ${hasRepaired ? pc.green('✓') : pc.dim('○')} Repaired Spec`
  );
  lines.push(
    `  ${hasEnhanced ? pc.green('✓') : pc.dim('○')} Enhanced Spec`
  );
  lines.push(
    `  ${hasGenerated ? pc.green('✓') : pc.dim('○')} Generated Files`
  );

  lines.push(pc.dim('─'.repeat(50)));
  lines.push('');

  console.log(lines.join('\n'));
}
