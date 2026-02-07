/**
 * Base error classes for OnboardKit CLI
 */

import { ErrorCode, ExitCode, ErrorSeverity, ErrorMetadata, RecoveryAction } from './types.js';

/**
 * Base CLI error class
 */
export class CLIError extends Error {
  public readonly code: ErrorCode;
  public readonly exitCode: ExitCode;
  public readonly severity: ErrorSeverity;
  public readonly category: string;
  public readonly recoveryActions: RecoveryAction[];
  public readonly canRetry: boolean;
  public readonly canRollback: boolean;
  public readonly contextData?: Record<string, unknown>;

  constructor(
    message: string,
    metadata: Partial<ErrorMetadata> & { code: ErrorCode }
  ) {
    super(message);
    this.name = 'CLIError';
    this.code = metadata.code;
    this.exitCode = metadata.exitCode ?? ExitCode.GENERAL_ERROR;
    this.severity = metadata.severity ?? ErrorSeverity.MEDIUM;
    this.category = metadata.category ?? 'general';
    this.recoveryActions = metadata.recoveryActions ?? [];
    this.canRetry = metadata.canRetry ?? false;
    this.canRollback = metadata.canRollback ?? false;
    this.contextData = metadata.contextData;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Validation error (spec validation failures)
 */
export class ValidationError extends CLIError {
  constructor(
    message: string,
    metadata?: Partial<ErrorMetadata>
  ) {
    super(message, {
      code: ErrorCode.SPEC_VALIDATION_ERROR,
      exitCode: ExitCode.VALIDATION_ERROR,
      category: 'validation',
      severity: ErrorSeverity.HIGH,
      canRetry: false,
      ...metadata,
    });
    this.name = 'ValidationError';
  }
}

/**
 * Generation error (code generation failures)
 */
export class GenerationError extends CLIError {
  constructor(
    message: string,
    metadata?: Partial<ErrorMetadata>
  ) {
    super(message, {
      code: ErrorCode.GENERATION_FAILED,
      exitCode: ExitCode.GENERATION_ERROR,
      category: 'generation',
      severity: ErrorSeverity.HIGH,
      canRetry: true,
      ...metadata,
    });
    this.name = 'GenerationError';
  }
}

/**
 * File system error (file/directory operations)
 */
export class FileSystemError extends CLIError {
  public readonly path?: string;

  constructor(
    message: string,
    path?: string,
    metadata?: Partial<ErrorMetadata>
  ) {
    super(message, {
      code: ErrorCode.FILE_NOT_FOUND,
      exitCode: ExitCode.FILE_SYSTEM_ERROR,
      category: 'filesystem',
      severity: ErrorSeverity.HIGH,
      canRetry: false,
      contextData: { path },
      ...metadata,
    });
    this.name = 'FileSystemError';
    this.path = path;
  }
}

/**
 * Network error (API calls, connectivity issues)
 */
export class NetworkError extends CLIError {
  public readonly url?: string;
  public readonly statusCode?: number;
  public readonly retryAfter?: number;

  constructor(
    message: string,
    options?: {
      url?: string;
      statusCode?: number;
      retryAfter?: number;
      metadata?: Partial<ErrorMetadata>;
    }
  ) {
    super(message, {
      code: ErrorCode.NETWORK_CONNECTION_FAILED,
      exitCode: ExitCode.NETWORK_ERROR,
      category: 'network',
      severity: ErrorSeverity.MEDIUM,
      canRetry: true,
      contextData: {
        url: options?.url,
        statusCode: options?.statusCode,
      },
      ...options?.metadata,
    });
    this.name = 'NetworkError';
    this.url = options?.url;
    this.statusCode = options?.statusCode;
    this.retryAfter = options?.retryAfter;
  }
}

/**
 * Authentication error (OAuth, token issues)
 */
export class AuthenticationError extends CLIError {
  public readonly provider?: string;

  constructor(
    message: string,
    provider?: string,
    metadata?: Partial<ErrorMetadata>
  ) {
    super(message, {
      code: ErrorCode.AUTH_TOKEN_INVALID,
      exitCode: ExitCode.AUTHENTICATION_ERROR,
      category: 'authentication',
      severity: ErrorSeverity.HIGH,
      canRetry: false,
      contextData: { provider },
      ...metadata,
    });
    this.name = 'AuthenticationError';
    this.provider = provider;
  }
}

/**
 * Workflow error (multi-phase workflow failures)
 */
export class WorkflowError extends CLIError {
  public readonly phase?: string;
  public readonly checkpoint?: string;

  constructor(
    message: string,
    options?: {
      phase?: string;
      checkpoint?: string;
      metadata?: Partial<ErrorMetadata>;
    }
  ) {
    super(message, {
      code: ErrorCode.WORKFLOW_PHASE_FAILED,
      exitCode: ExitCode.WORKFLOW_ERROR,
      category: 'workflow',
      severity: ErrorSeverity.HIGH,
      canRetry: true,
      canRollback: true,
      contextData: {
        phase: options?.phase,
        checkpoint: options?.checkpoint,
      },
      ...options?.metadata,
    });
    this.name = 'WorkflowError';
    this.phase = options?.phase;
    this.checkpoint = options?.checkpoint;
  }
}
