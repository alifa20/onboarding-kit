/**
 * Reset command: Clear workflow checkpoints
 */

import { join } from 'node:path';
import * as clack from '@clack/prompts';
import pc from 'picocolors';
import { clearCheckpoint, hasCheckpoint } from '../lib/workflow/index.js';

/**
 * Reset command options
 */
interface ResetCommandOptions {
  spec?: string;
  force?: boolean;
}

/**
 * Execute the reset command
 */
export async function resetCommand(options: ResetCommandOptions = {}): Promise<void> {
  clack.intro(pc.bgRed(pc.white(' Reset Workflow ')));

  try {
    // Determine spec file path
    const specPath = options.spec
      ? join(process.cwd(), options.spec)
      : join(process.cwd(), 'spec.md');

    // Check if checkpoint exists
    if (!hasCheckpoint(specPath)) {
      clack.log.warn('No checkpoint found for this spec file.');
      clack.outro(pc.yellow('Nothing to reset'));
      return;
    }

    // Confirm if not forced
    if (!options.force) {
      const confirm = await clack.confirm({
        message: 'Are you sure you want to clear the workflow checkpoint?',
        initialValue: false,
      });

      if (clack.isCancel(confirm) || !confirm) {
        clack.cancel('Operation cancelled');
        process.exit(0);
      }
    }

    // Clear checkpoint
    const spinner = clack.spinner();
    spinner.start('Clearing checkpoint...');

    await clearCheckpoint(specPath);

    spinner.stop('Checkpoint cleared');

    clack.log.success('Workflow checkpoint has been removed.');
    clack.log.info('Next run of "onboardkit onboard" will start from the beginning.');

    clack.outro(pc.green('Reset complete'));
  } catch (error) {
    clack.log.error(
      pc.red('Error: ') + (error instanceof Error ? error.message : 'Unknown error')
    );
    clack.outro(pc.red('Reset failed'));
    process.exit(1);
  }
}
