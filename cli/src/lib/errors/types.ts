/**
 * Error type definitions for OnboardKit CLI
 */

/**
 * Standard exit codes following Unix conventions
 */
export enum ExitCode {
  SUCCESS = 0,
  GENERAL_ERROR = 1,
  MISUSE = 2,
  AUTHENTICATION_ERROR = 3,
  NETWORK_ERROR = 4,
  FILE_SYSTEM_ERROR = 5,
  VALIDATION_ERROR = 6,
  GENERATION_ERROR = 7,
  WORKFLOW_ERROR = 8,
}

/**
 * Error code categories
 */
export enum ErrorCode {
  // File system errors
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_ACCESS_DENIED = 'FILE_ACCESS_DENIED',
  FILE_ALREADY_EXISTS = 'FILE_ALREADY_EXISTS',
  DIRECTORY_NOT_EMPTY = 'DIRECTORY_NOT_EMPTY',
  NO_SPACE_LEFT = 'NO_SPACE_LEFT',
  TOO_MANY_OPEN_FILES = 'TOO_MANY_OPEN_FILES',

  // Spec validation errors
  SPEC_NOT_FOUND = 'SPEC_NOT_FOUND',
  SPEC_PARSE_ERROR = 'SPEC_PARSE_ERROR',
  SPEC_VALIDATION_ERROR = 'SPEC_VALIDATION_ERROR',
  SPEC_INVALID_FORMAT = 'SPEC_INVALID_FORMAT',

  // Authentication errors
  AUTH_NOT_CONFIGURED = 'AUTH_NOT_CONFIGURED',
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID = 'AUTH_TOKEN_INVALID',
  AUTH_PROVIDER_UNAVAILABLE = 'AUTH_PROVIDER_UNAVAILABLE',
  AUTH_OAUTH_FAILED = 'AUTH_OAUTH_FAILED',

  // Network errors
  NETWORK_CONNECTION_FAILED = 'NETWORK_CONNECTION_FAILED',
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  NETWORK_DNS_FAILED = 'NETWORK_DNS_FAILED',
  NETWORK_SSL_ERROR = 'NETWORK_SSL_ERROR',
  NETWORK_RATE_LIMIT = 'NETWORK_RATE_LIMIT',
  NETWORK_PROXY_ERROR = 'NETWORK_PROXY_ERROR',

  // AI/Generation errors
  AI_PROVIDER_ERROR = 'AI_PROVIDER_ERROR',
  AI_RESPONSE_INVALID = 'AI_RESPONSE_INVALID',
  AI_CONTEXT_TOO_LARGE = 'AI_CONTEXT_TOO_LARGE',
  GENERATION_FAILED = 'GENERATION_FAILED',
  TEMPLATE_ERROR = 'TEMPLATE_ERROR',

  // Workflow errors
  WORKFLOW_CHECKPOINT_MISSING = 'WORKFLOW_CHECKPOINT_MISSING',
  WORKFLOW_PHASE_FAILED = 'WORKFLOW_PHASE_FAILED',
  WORKFLOW_STATE_INVALID = 'WORKFLOW_STATE_INVALID',

  // Generic errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  USER_CANCELLED = 'USER_CANCELLED',
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Recovery action types
 */
export interface RecoveryAction {
  description: string;
  command?: string;
  automatic?: boolean;
}

/**
 * Error metadata
 */
export interface ErrorMetadata {
  code: ErrorCode;
  exitCode: ExitCode;
  severity: ErrorSeverity;
  category: string;
  recoveryActions: RecoveryAction[];
  canRetry: boolean;
  canRollback: boolean;
  contextData?: Record<string, unknown>;
}
