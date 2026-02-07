/**
 * Error messages and recovery guidance
 */

import { ErrorCode, RecoveryAction } from './types.js';
import pc from 'picocolors';

/**
 * Error message definition
 */
interface ErrorMessage {
  message: string;
  guidance: RecoveryAction[];
  learnMore?: string;
}

/**
 * Error message catalog
 */
export const ERROR_MESSAGES: Record<ErrorCode, ErrorMessage> = {
  // File system errors
  [ErrorCode.FILE_NOT_FOUND]: {
    message: 'File not found',
    guidance: [
      {
        description: 'Check that the file path is correct',
      },
      {
        description: 'If looking for a spec file, create one',
        command: 'onboardkit init',
      },
    ],
  },

  [ErrorCode.FILE_ACCESS_DENIED]: {
    message: 'Permission denied',
    guidance: [
      {
        description: 'Check file permissions',
        command: 'ls -la <file>',
      },
      {
        description: 'Try running with appropriate permissions',
      },
    ],
  },

  [ErrorCode.FILE_ALREADY_EXISTS]: {
    message: 'File or directory already exists',
    guidance: [
      {
        description: 'Use --overwrite flag to replace existing files',
      },
      {
        description: 'Choose a different output directory',
        command: 'onboardkit generate --output <different-path>',
      },
    ],
  },

  [ErrorCode.DIRECTORY_NOT_EMPTY]: {
    message: 'Directory is not empty',
    guidance: [
      {
        description: 'Use --overwrite flag to replace existing content',
      },
      {
        description: 'Remove the directory first',
        command: 'rm -rf <directory>',
      },
    ],
  },

  [ErrorCode.NO_SPACE_LEFT]: {
    message: 'No space left on device',
    guidance: [
      {
        description: 'Free up disk space',
      },
      {
        description: 'Choose a different output location',
      },
    ],
  },

  [ErrorCode.TOO_MANY_OPEN_FILES]: {
    message: 'Too many open files',
    guidance: [
      {
        description: 'Close other applications',
      },
      {
        description: 'Increase system file descriptor limit',
        command: 'ulimit -n 4096',
      },
    ],
  },

  // Spec validation errors
  [ErrorCode.SPEC_NOT_FOUND]: {
    message: 'Spec file not found',
    guidance: [
      {
        description: 'Create a new spec file',
        command: 'onboardkit init',
      },
      {
        description: 'Specify a spec file path',
        command: 'onboardkit validate --spec path/to/spec.md',
      },
    ],
  },

  [ErrorCode.SPEC_PARSE_ERROR]: {
    message: 'Failed to parse spec file',
    guidance: [
      {
        description: 'Check that the spec file is valid Markdown',
      },
      {
        description: 'Use verbose mode for detailed errors',
        command: 'onboardkit validate --verbose',
      },
    ],
  },

  [ErrorCode.SPEC_VALIDATION_ERROR]: {
    message: 'Spec validation failed',
    guidance: [
      {
        description: 'Review validation errors above',
      },
      {
        description: 'Run validation to see all issues',
        command: 'onboardkit validate --verbose',
      },
    ],
  },

  [ErrorCode.SPEC_INVALID_FORMAT]: {
    message: 'Spec file has invalid format',
    guidance: [
      {
        description: 'Check the spec format requirements',
      },
      {
        description: 'Compare with template',
        command: 'onboardkit init',
      },
    ],
  },

  // Authentication errors
  [ErrorCode.AUTH_NOT_CONFIGURED]: {
    message: 'Authentication not configured',
    guidance: [
      {
        description: 'Authenticate with an AI provider',
        command: 'onboardkit auth',
      },
    ],
  },

  [ErrorCode.AUTH_TOKEN_EXPIRED]: {
    message: 'Authentication token expired',
    guidance: [
      {
        description: 'Re-authenticate with your provider',
        command: 'onboardkit auth',
      },
      {
        description: 'Check authentication status',
        command: 'onboardkit auth status',
      },
    ],
  },

  [ErrorCode.AUTH_TOKEN_INVALID]: {
    message: 'Authentication token is invalid',
    guidance: [
      {
        description: 'Revoke and re-authenticate',
        command: 'onboardkit auth revoke && onboardkit auth',
      },
    ],
  },

  [ErrorCode.AUTH_PROVIDER_UNAVAILABLE]: {
    message: 'AI provider is unavailable',
    guidance: [
      {
        description: 'Check your internet connection',
      },
      {
        description: 'Try again in a few moments',
      },
      {
        description: 'Check provider status page',
      },
    ],
  },

  [ErrorCode.AUTH_OAUTH_FAILED]: {
    message: 'OAuth authentication failed',
    guidance: [
      {
        description: 'Ensure your browser is available',
      },
      {
        description: 'Check that port 3000 is not in use',
      },
      {
        description: 'Try authentication again',
        command: 'onboardkit auth',
      },
    ],
  },

  // Network errors
  [ErrorCode.NETWORK_CONNECTION_FAILED]: {
    message: 'Network connection failed',
    guidance: [
      {
        description: 'Check your internet connection',
      },
      {
        description: 'Check firewall settings',
      },
      {
        description: 'Try again in a few moments',
      },
    ],
  },

  [ErrorCode.NETWORK_TIMEOUT]: {
    message: 'Network request timed out',
    guidance: [
      {
        description: 'Check your internet connection speed',
      },
      {
        description: 'The operation will be retried automatically',
        automatic: true,
      },
    ],
  },

  [ErrorCode.NETWORK_DNS_FAILED]: {
    message: 'DNS resolution failed',
    guidance: [
      {
        description: 'Check your DNS settings',
      },
      {
        description: 'Try using a different DNS server',
      },
    ],
  },

  [ErrorCode.NETWORK_SSL_ERROR]: {
    message: 'SSL/TLS certificate error',
    guidance: [
      {
        description: 'Check system date and time',
      },
      {
        description: 'Update your system certificates',
      },
    ],
  },

  [ErrorCode.NETWORK_RATE_LIMIT]: {
    message: 'Rate limit exceeded',
    guidance: [
      {
        description: 'Wait before trying again',
      },
      {
        description: 'The request will be retried automatically',
        automatic: true,
      },
    ],
  },

  [ErrorCode.NETWORK_PROXY_ERROR]: {
    message: 'Proxy connection error',
    guidance: [
      {
        description: 'Check proxy configuration',
      },
      {
        description: 'Try without proxy',
      },
    ],
  },

  // AI/Generation errors
  [ErrorCode.AI_PROVIDER_ERROR]: {
    message: 'AI provider error',
    guidance: [
      {
        description: 'Check authentication status',
        command: 'onboardkit auth status',
      },
      {
        description: 'Try again in a few moments',
      },
    ],
  },

  [ErrorCode.AI_RESPONSE_INVALID]: {
    message: 'AI response could not be parsed',
    guidance: [
      {
        description: 'The request will be retried automatically',
        automatic: true,
      },
      {
        description: 'If this persists, try again later',
      },
    ],
  },

  [ErrorCode.AI_CONTEXT_TOO_LARGE]: {
    message: 'Input is too large for AI provider',
    guidance: [
      {
        description: 'Reduce the spec file size',
      },
      {
        description: 'Simplify onboarding steps',
      },
    ],
  },

  [ErrorCode.GENERATION_FAILED]: {
    message: 'Code generation failed',
    guidance: [
      {
        description: 'Check validation errors',
        command: 'onboardkit validate --verbose',
      },
      {
        description: 'Try generating again',
        command: 'onboardkit generate',
      },
    ],
  },

  [ErrorCode.TEMPLATE_ERROR]: {
    message: 'Template rendering error',
    guidance: [
      {
        description: 'Check spec file for invalid values',
      },
      {
        description: 'Use verbose mode for details',
        command: 'onboardkit generate --verbose',
      },
    ],
  },

  // Workflow errors
  [ErrorCode.WORKFLOW_CHECKPOINT_MISSING]: {
    message: 'Workflow checkpoint not found',
    guidance: [
      {
        description: 'Start workflow from beginning',
        command: 'onboardkit onboard',
      },
      {
        description: 'Clear checkpoints if corrupted',
        command: 'onboardkit reset',
      },
    ],
  },

  [ErrorCode.WORKFLOW_PHASE_FAILED]: {
    message: 'Workflow phase failed',
    guidance: [
      {
        description: 'Check error details above',
      },
      {
        description: 'Resume from last checkpoint',
        command: 'onboardkit onboard --resume',
      },
    ],
  },

  [ErrorCode.WORKFLOW_STATE_INVALID]: {
    message: 'Workflow state is invalid',
    guidance: [
      {
        description: 'Reset workflow state',
        command: 'onboardkit reset',
      },
      {
        description: 'Start fresh',
        command: 'onboardkit onboard',
      },
    ],
  },

  // Generic errors
  [ErrorCode.UNKNOWN_ERROR]: {
    message: 'An unknown error occurred',
    guidance: [
      {
        description: 'Use verbose mode for details',
        command: 'onboardkit <command> --verbose',
      },
      {
        description: 'Check error logs',
      },
    ],
  },

  [ErrorCode.INTERNAL_ERROR]: {
    message: 'Internal error',
    guidance: [
      {
        description: 'This is likely a bug',
      },
      {
        description: 'Please report this issue',
        command: 'https://github.com/your-org/onboardkit/issues',
      },
    ],
  },

  [ErrorCode.USER_CANCELLED]: {
    message: 'Operation cancelled by user',
    guidance: [],
  },
};

/**
 * Get error message details
 */
export function getErrorMessage(code: ErrorCode): ErrorMessage {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES[ErrorCode.UNKNOWN_ERROR];
}

/**
 * Format recovery actions for display
 */
export function formatRecoveryActions(actions: RecoveryAction[]): string {
  if (actions.length === 0) {
    return '';
  }

  const lines: string[] = [pc.bold('\nHow to fix:')];

  actions.forEach((action, index) => {
    const bullet = pc.cyan(`  ${index + 1}.`);
    const autoTag = action.automatic ? pc.dim(' (automatic)') : '';

    lines.push(`${bullet} ${action.description}${autoTag}`);

    if (action.command) {
      lines.push(pc.dim(`     ${pc.cyan(action.command)}`));
    }
  });

  return lines.join('\n');
}

/**
 * Format error message with context
 */
export function formatErrorMessage(
  code: ErrorCode,
  customMessage?: string,
  contextData?: Record<string, unknown>
): string {
  const errorMsg = getErrorMessage(code);
  const lines: string[] = [];

  // Main error message
  lines.push(pc.red(`✗ ${customMessage || errorMsg.message}`));

  // Context data
  if (contextData) {
    const relevantContext = Object.entries(contextData)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `  ${pc.dim(key)}: ${value}`)
      .join('\n');

    if (relevantContext) {
      lines.push('');
      lines.push(relevantContext);
    }
  }

  // Recovery actions
  if (errorMsg.guidance.length > 0) {
    lines.push(formatRecoveryActions(errorMsg.guidance));
  }

  // Learn more link
  if (errorMsg.learnMore) {
    lines.push('');
    lines.push(pc.dim(`Learn more: ${pc.cyan(errorMsg.learnMore)}`));
  }

  return lines.join('\n');
}
