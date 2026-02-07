/**
 * Error recovery strategies
 */

import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { CLIError, FileSystemError, WorkflowError } from './base.js';
import { ErrorCode } from './types.js';
import pc from 'picocolors';

/**
 * Recovery strategy interface
 */
export interface RecoveryStrategy {
  canRecover(error: Error): boolean;
  recover(error: Error, context: RecoveryContext): Promise<RecoveryResult>;
}

/**
 * Recovery context
 */
export interface RecoveryContext {
  workingDirectory?: string;
  outputDirectory?: string;
  checkpointDirectory?: string;
  verbose?: boolean;
}

/**
 * Recovery result
 */
export interface RecoveryResult {
  success: boolean;
  message: string;
  actions?: string[];
}

/**
 * Checkpoint-based recovery strategy
 */
export class CheckpointRecovery implements RecoveryStrategy {
  canRecover(error: Error): boolean {
    return error instanceof WorkflowError && error.canRollback;
  }

  async recover(
    error: Error,
    context: RecoveryContext
  ): Promise<RecoveryResult> {
    if (!(error instanceof WorkflowError)) {
      return {
        success: false,
        message: 'Not a workflow error',
      };
    }

    if (!context.checkpointDirectory) {
      return {
        success: false,
        message: 'No checkpoint directory specified',
      };
    }

    try {
      // Check if checkpoint exists
      const checkpointPath = join(
        context.checkpointDirectory,
        `${error.checkpoint || 'latest'}.json`
      );

      try {
        await fs.access(checkpointPath);
      } catch {
        return {
          success: false,
          message: `Checkpoint not found: ${error.checkpoint}`,
          actions: [
            'Start workflow from beginning',
            'Run: onboardkit onboard',
          ],
        };
      }

      return {
        success: true,
        message: `Can resume from checkpoint: ${error.checkpoint}`,
        actions: [
          'Resume workflow from checkpoint',
          'Run: onboardkit onboard --resume',
        ],
      };
    } catch (err) {
      return {
        success: false,
        message: `Failed to access checkpoint: ${(err as Error).message}`,
      };
    }
  }
}

/**
 * File cleanup recovery strategy
 */
export class CleanupRecovery implements RecoveryStrategy {
  canRecover(error: Error): boolean {
    return (
      error instanceof FileSystemError &&
      (error.code === ErrorCode.FILE_ALREADY_EXISTS ||
        error.code === ErrorCode.DIRECTORY_NOT_EMPTY)
    );
  }

  async recover(
    error: Error,
    context: RecoveryContext
  ): Promise<RecoveryResult> {
    if (!(error instanceof FileSystemError)) {
      return {
        success: false,
        message: 'Not a file system error',
      };
    }

    const path = error.path;
    if (!path) {
      return {
        success: false,
        message: 'No path to clean up',
      };
    }

    try {
      // Check if path exists
      try {
        await fs.access(path);
      } catch {
        return {
          success: true,
          message: 'Path does not exist, no cleanup needed',
        };
      }

      // Don't auto-delete, just suggest
      return {
        success: false,
        message: 'Manual cleanup required',
        actions: [
          'Remove existing files',
          `Run: rm -rf ${path}`,
          'Or use --overwrite flag to replace automatically',
        ],
      };
    } catch (err) {
      return {
        success: false,
        message: `Failed to check path: ${(err as Error).message}`,
      };
    }
  }
}

/**
 * Permission recovery strategy
 */
export class PermissionRecovery implements RecoveryStrategy {
  canRecover(error: Error): boolean {
    return (
      error instanceof FileSystemError &&
      error.code === ErrorCode.FILE_ACCESS_DENIED
    );
  }

  async recover(
    error: Error,
    context: RecoveryContext
  ): Promise<RecoveryResult> {
    if (!(error instanceof FileSystemError)) {
      return {
        success: false,
        message: 'Not a file system error',
      };
    }

    const path = error.path;
    if (!path) {
      return {
        success: false,
        message: 'No path specified',
      };
    }

    try {
      // Check file stats
      const stats = await fs.stat(path);

      return {
        success: false,
        message: 'Permission issue detected',
        actions: [
          'Check file permissions',
          `Run: ls -la ${path}`,
          'Fix permissions if needed',
          `Run: chmod u+rw ${path}`,
        ],
      };
    } catch (err) {
      return {
        success: false,
        message: `Failed to check permissions: ${(err as Error).message}`,
      };
    }
  }
}

/**
 * Network recovery strategy
 */
export class NetworkRecovery implements RecoveryStrategy {
  canRecover(error: Error): boolean {
    return error instanceof CLIError && error.canRetry;
  }

  async recover(
    error: Error,
    context: RecoveryContext
  ): Promise<RecoveryResult> {
    if (!(error instanceof CLIError)) {
      return {
        success: false,
        message: 'Not a CLI error',
      };
    }

    // Network errors are handled by retry logic
    return {
      success: true,
      message: 'Network error will be retried automatically',
      actions: ['Wait for automatic retry', 'Check network connection'],
    };
  }
}

/**
 * Recovery manager
 */
export class RecoveryManager {
  private strategies: RecoveryStrategy[];

  constructor() {
    this.strategies = [
      new CheckpointRecovery(),
      new CleanupRecovery(),
      new PermissionRecovery(),
      new NetworkRecovery(),
    ];
  }

  /**
   * Add a custom recovery strategy
   */
  addStrategy(strategy: RecoveryStrategy): void {
    this.strategies.unshift(strategy);
  }

  /**
   * Attempt to recover from an error
   */
  async tryRecover(
    error: Error,
    context: RecoveryContext
  ): Promise<RecoveryResult> {
    for (const strategy of this.strategies) {
      if (strategy.canRecover(error)) {
        const result = await strategy.recover(error, context);
        if (result.success || result.actions) {
          return result;
        }
      }
    }

    return {
      success: false,
      message: 'No recovery strategy available',
    };
  }

  /**
   * Display recovery suggestions
   */
  displayRecoverySuggestions(result: RecoveryResult): void {
    if (result.success) {
      console.log(pc.green(`✓ ${result.message}`));
    } else {
      console.log(pc.yellow(`! ${result.message}`));
    }

    if (result.actions && result.actions.length > 0) {
      console.log(pc.bold('\nRecovery options:'));
      result.actions.forEach((action, index) => {
        console.log(pc.cyan(`  ${index + 1}. ${action}`));
      });
    }
  }
}

/**
 * Auto-recovery for common issues
 */
export async function autoRecover(
  error: Error,
  context: RecoveryContext
): Promise<boolean> {
  const manager = new RecoveryManager();
  const result = await manager.tryRecover(error, context);

  if (context.verbose) {
    manager.displayRecoverySuggestions(result);
  }

  return result.success;
}

/**
 * Guided recovery with user prompts
 */
export async function guidedRecovery(
  error: Error,
  context: RecoveryContext
): Promise<boolean> {
  const manager = new RecoveryManager();
  const result = await manager.tryRecover(error, context);

  manager.displayRecoverySuggestions(result);

  // If recovery actions are available, the user can follow them
  return result.actions !== undefined && result.actions.length > 0;
}

/**
 * Create recovery context from command options
 */
export function createRecoveryContext(options: {
  cwd?: string;
  output?: string;
  checkpoint?: string;
  verbose?: boolean;
}): RecoveryContext {
  return {
    workingDirectory: options.cwd || process.cwd(),
    outputDirectory: options.output,
    checkpointDirectory: options.checkpoint,
    verbose: options.verbose,
  };
}
