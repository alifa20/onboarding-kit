/**
 * Error handling middleware for commands
 */

import pc from 'picocolors';
import { CLIError } from './base.js';
import { ExitCode, ErrorCode } from './types.js';
import { formatErrorMessage } from './messages.js';
import { autoRecover, guidedRecovery, createRecoveryContext } from './recovery.js';

/**
 * Command context for error handling
 */
export interface CommandContext {
  commandName: string;
  verbose?: boolean;
  output?: string;
  checkpoint?: string;
}

/**
 * Error handler options
 */
export interface ErrorHandlerOptions {
  verbose?: boolean;
  showStack?: boolean;
  attemptRecovery?: boolean;
  exitOnError?: boolean;
}

/**
 * Format error for terminal output
 */
export function formatError(
  error: Error,
  options: ErrorHandlerOptions = {}
): string {
  const lines: string[] = [];

  if (error instanceof CLIError) {
    // Use formatted error message with recovery actions
    lines.push(
      formatErrorMessage(error.code, error.message, error.contextData)
    );

    // Show additional context in verbose mode
    if (options.verbose && error.contextData) {
      lines.push('');
      lines.push(pc.dim('Error Details:'));
      lines.push(pc.dim(JSON.stringify(error.contextData, null, 2)));
    }
  } else {
    // Generic error formatting
    lines.push(pc.red(`✗ ${error.message}`));
  }

  // Show stack trace if requested
  if (options.showStack && error.stack) {
    lines.push('');
    lines.push(pc.dim('Stack Trace:'));
    lines.push(pc.dim(error.stack));
  }

  return lines.join('\n');
}

/**
 * Get exit code from error
 */
export function getExitCode(error: Error): number {
  if (error instanceof CLIError) {
    return error.exitCode;
  }

  // Default exit codes for common error types
  if (error.message.includes('ENOENT') || error.message.includes('not found')) {
    return ExitCode.FILE_SYSTEM_ERROR;
  }

  if (error.message.includes('EACCES') || error.message.includes('permission')) {
    return ExitCode.FILE_SYSTEM_ERROR;
  }

  if (
    error.message.includes('network') ||
    error.message.includes('timeout') ||
    error.message.includes('ECONNREFUSED')
  ) {
    return ExitCode.NETWORK_ERROR;
  }

  return ExitCode.GENERAL_ERROR;
}

/**
 * Handle error with recovery attempt
 */
export async function handleError(
  error: Error,
  context?: CommandContext,
  options: ErrorHandlerOptions = {}
): Promise<void> {
  // Merge options with context
  const effectiveOptions: ErrorHandlerOptions = {
    verbose: context?.verbose || options.verbose,
    showStack: options.showStack,
    attemptRecovery: options.attemptRecovery !== false,
    exitOnError: options.exitOnError !== false,
  };

  // Format and display error
  console.error('\n' + formatError(error, effectiveOptions));

  // Attempt recovery if enabled
  if (effectiveOptions.attemptRecovery && context) {
    const recoveryContext = createRecoveryContext({
      cwd: process.cwd(),
      output: context.output,
      checkpoint: context.checkpoint,
      verbose: effectiveOptions.verbose,
    });

    try {
      // Try auto-recovery first
      const recovered = await autoRecover(error, recoveryContext);

      if (!recovered) {
        // Offer guided recovery
        await guidedRecovery(error, recoveryContext);
      }
    } catch (recoveryError) {
      // Recovery failed, log but don't throw
      if (effectiveOptions.verbose) {
        console.error(
          pc.dim(`Recovery attempt failed: ${(recoveryError as Error).message}`)
        );
      }
    }
  }

  // Exit if requested
  if (effectiveOptions.exitOnError) {
    const exitCode = getExitCode(error);
    process.exit(exitCode);
  }
}

/**
 * Wrap a command function with error handling
 */
export function withErrorHandling<T extends any[], R>(
  commandFn: (...args: T) => Promise<R>,
  context?: Omit<CommandContext, 'verbose'>
): (...args: T) => Promise<R | void> {
  return async (...args: T): Promise<R | void> => {
    try {
      return await commandFn(...args);
    } catch (error) {
      // Extract verbose option from args if it's an object with verbose property
      const lastArg = args[args.length - 1];
      const verbose =
        lastArg &&
        typeof lastArg === 'object' &&
        'verbose' in lastArg &&
        typeof lastArg.verbose === 'boolean'
          ? lastArg.verbose
          : false;

      await handleError(error as Error, context ? { ...context, verbose } : undefined, {
        verbose,
        showStack: verbose,
        attemptRecovery: true,
        exitOnError: true,
      });
    }
  };
}

/**
 * Create error from Node.js system error
 */
export function fromNodeError(error: NodeJS.ErrnoException, path?: string): CLIError {
  const code = error.code;

  switch (code) {
    case 'ENOENT':
      return new CLIError(`File not found: ${path || error.path || 'unknown'}`, {
        code: ErrorCode.FILE_NOT_FOUND,
        exitCode: ExitCode.FILE_SYSTEM_ERROR,
        contextData: { path: path || error.path },
      });

    case 'EACCES':
    case 'EPERM':
      return new CLIError(`Permission denied: ${path || error.path || 'unknown'}`, {
        code: ErrorCode.FILE_ACCESS_DENIED,
        exitCode: ExitCode.FILE_SYSTEM_ERROR,
        contextData: { path: path || error.path },
      });

    case 'EEXIST':
      return new CLIError(
        `File already exists: ${path || error.path || 'unknown'}`,
        {
          code: ErrorCode.FILE_ALREADY_EXISTS,
          exitCode: ExitCode.FILE_SYSTEM_ERROR,
          contextData: { path: path || error.path },
        }
      );

    case 'ENOSPC':
      return new CLIError('No space left on device', {
        code: ErrorCode.NO_SPACE_LEFT,
        exitCode: ExitCode.FILE_SYSTEM_ERROR,
      });

    case 'EMFILE':
    case 'ENFILE':
      return new CLIError('Too many open files', {
        code: ErrorCode.TOO_MANY_OPEN_FILES,
        exitCode: ExitCode.FILE_SYSTEM_ERROR,
      });

    case 'ENOTDIR':
      return new CLIError(`Not a directory: ${path || error.path || 'unknown'}`, {
        code: ErrorCode.FILE_NOT_FOUND,
        exitCode: ExitCode.FILE_SYSTEM_ERROR,
        contextData: { path: path || error.path },
      });

    case 'EISDIR':
      return new CLIError(`Is a directory: ${path || error.path || 'unknown'}`, {
        code: ErrorCode.FILE_NOT_FOUND,
        exitCode: ExitCode.FILE_SYSTEM_ERROR,
        contextData: { path: path || error.path },
      });

    case 'ENOTEMPTY':
      return new CLIError(
        `Directory not empty: ${path || error.path || 'unknown'}`,
        {
          code: ErrorCode.DIRECTORY_NOT_EMPTY,
          exitCode: ExitCode.FILE_SYSTEM_ERROR,
          contextData: { path: path || error.path },
        }
      );

    default:
      return new CLIError(
        error.message || `File system error: ${code || 'unknown'}`,
        {
          code: ErrorCode.UNKNOWN_ERROR,
          exitCode: ExitCode.FILE_SYSTEM_ERROR,
          contextData: {
            errno: error.errno,
            code: error.code,
            syscall: error.syscall,
            path: path || error.path,
          },
        }
      );
  }
}

/**
 * Wrap file system operations with error handling
 */
export async function withFileSystemErrors<T>(
  operation: () => Promise<T>,
  path?: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (isNodeError(error)) {
      throw fromNodeError(error, path);
    }
    throw error;
  }
}

/**
 * Type guard for Node.js errors
 */
function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return (
    error instanceof Error &&
    ('code' in error || 'errno' in error || 'syscall' in error)
  );
}
