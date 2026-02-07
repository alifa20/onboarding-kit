/**
 * Error handling system for OnboardKit CLI
 */

// Export error types
export {
  ErrorCode,
  ExitCode,
  ErrorSeverity,
  RecoveryAction,
  ErrorMetadata,
} from './types.js';

// Export error classes
export {
  CLIError,
  ValidationError,
  GenerationError,
  FileSystemError,
  NetworkError,
  AuthenticationError,
  WorkflowError,
} from './base.js';

// Export error messages
export {
  getErrorMessage,
  formatRecoveryActions,
  formatErrorMessage,
} from './messages.js';

// Export retry logic
export {
  RetryStrategy,
  RetryCallback,
  DEFAULT_RETRY_STRATEGY,
  isRetryableError,
  calculateRetryDelay,
  addJitter,
  sleep,
  withRetry,
  withRetryProgress,
  retryBatch,
} from './retry.js';

// Export recovery strategies
export {
  RecoveryStrategy,
  RecoveryContext,
  RecoveryResult,
  CheckpointRecovery,
  CleanupRecovery,
  PermissionRecovery,
  NetworkRecovery,
  RecoveryManager,
  autoRecover,
  guidedRecovery,
  createRecoveryContext,
} from './recovery.js';

// Export middleware
export {
  CommandContext,
  ErrorHandlerOptions,
  formatError,
  getExitCode,
  handleError,
  withErrorHandling,
  fromNodeError,
  withFileSystemErrors,
} from './middleware.js';

// Export help system
export {
  getHelp,
  displayHelp,
  formatCommandUsage,
  displayCommandUsage,
} from './help.js';

/**
 * Initialize error handling system
 */
export function initializeErrorHandling(): void {
  // Set up global unhandled rejection handler
  process.on('unhandledRejection', (reason: unknown) => {
    console.error('\nUnhandled Promise Rejection:');
    console.error(reason);
    process.exit(ExitCode.INTERNAL_ERROR);
  });

  // Set up global uncaught exception handler
  process.on('uncaughtException', (error: Error) => {
    console.error('\nUncaught Exception:');
    console.error(error);
    process.exit(ExitCode.INTERNAL_ERROR);
  });
}
