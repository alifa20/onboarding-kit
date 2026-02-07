/**
 * Contextual help for common errors
 */

import pc from 'picocolors';
import { ErrorCode } from './types.js';

/**
 * Help content definition
 */
interface HelpContent {
  title: string;
  description: string;
  examples?: string[];
  relatedCommands?: Array<{ command: string; description: string }>;
  troubleshooting?: string[];
  learnMore?: string;
}

/**
 * Help content catalog
 */
const HELP_CONTENT: Partial<Record<ErrorCode, HelpContent>> = {
  [ErrorCode.SPEC_NOT_FOUND]: {
    title: 'Creating a Spec File',
    description:
      'OnboardKit requires a spec file that defines your onboarding flow, theme, and content.',
    examples: [
      'onboardkit init                     # Create spec.md in current directory',
      'onboardkit init --output custom.md  # Create with custom name',
    ],
    relatedCommands: [
      {
        command: 'onboardkit init',
        description: 'Create a new spec template',
      },
      {
        command: 'onboardkit validate',
        description: 'Check spec file for errors',
      },
    ],
    troubleshooting: [
      'Ensure you are in the correct directory',
      'Check if spec.md exists in current directory',
      'Use --spec flag to specify a different file',
    ],
  },

  [ErrorCode.SPEC_VALIDATION_ERROR]: {
    title: 'Fixing Spec Validation Errors',
    description:
      'The spec file has validation errors that prevent code generation.',
    examples: [
      'onboardkit validate --verbose    # See detailed validation errors',
      'onboardkit validate --spec custom.md',
    ],
    relatedCommands: [
      {
        command: 'onboardkit validate',
        description: 'Validate spec file',
      },
    ],
    troubleshooting: [
      'Read the validation error messages carefully',
      'Check required fields are present',
      'Verify theme colors are valid hex codes',
      'Ensure all steps have required properties',
    ],
  },

  [ErrorCode.AUTH_NOT_CONFIGURED]: {
    title: 'Setting Up Authentication',
    description:
      'OnboardKit requires authentication with an AI provider for the onboard command.',
    examples: [
      'onboardkit auth                  # Start OAuth authentication',
      'onboardkit auth login            # Same as above',
      'onboardkit auth status           # Check authentication status',
    ],
    relatedCommands: [
      {
        command: 'onboardkit auth',
        description: 'Authenticate with AI provider',
      },
      {
        command: 'onboardkit auth status',
        description: 'Check authentication status',
      },
      {
        command: 'onboardkit auth revoke',
        description: 'Remove stored credentials',
      },
    ],
    troubleshooting: [
      'Ensure you have an account with the AI provider',
      'Check your internet connection',
      'Verify port 3000 is available for OAuth callback',
    ],
  },

  [ErrorCode.AUTH_TOKEN_EXPIRED]: {
    title: 'Token Expired',
    description: 'Your authentication token has expired and needs to be refreshed.',
    examples: ['onboardkit auth                  # Re-authenticate'],
    relatedCommands: [
      {
        command: 'onboardkit auth',
        description: 'Re-authenticate',
      },
    ],
    troubleshooting: [
      'Run auth command to get a new token',
      'Check if provider credentials are still valid',
    ],
  },

  [ErrorCode.NETWORK_CONNECTION_FAILED]: {
    title: 'Network Connection Issues',
    description: 'Unable to connect to the remote service.',
    troubleshooting: [
      'Check your internet connection',
      'Verify you can access the provider website in a browser',
      'Check if you are behind a proxy or firewall',
      'Try again in a few moments (service may be temporarily down)',
    ],
  },

  [ErrorCode.FILE_ALREADY_EXISTS]: {
    title: 'Output Directory Exists',
    description:
      'The output directory already exists and will not be overwritten by default.',
    examples: [
      'onboardkit generate --overwrite           # Overwrite existing files',
      'onboardkit generate --output new-folder   # Use different directory',
      'rm -rf onboardkit-output                  # Remove existing directory',
    ],
    troubleshooting: [
      'Use --overwrite flag to replace existing files',
      'Choose a different output directory',
      'Manually delete the existing directory',
    ],
  },

  [ErrorCode.GENERATION_FAILED]: {
    title: 'Code Generation Failed',
    description: 'An error occurred during code generation.',
    examples: [
      'onboardkit validate --verbose    # Check spec for errors',
      'onboardkit generate --verbose    # See detailed error messages',
      'onboardkit generate --dry-run    # Preview without writing files',
    ],
    relatedCommands: [
      {
        command: 'onboardkit validate',
        description: 'Validate spec before generating',
      },
      {
        command: 'onboardkit generate --verbose',
        description: 'Generate with detailed output',
      },
    ],
    troubleshooting: [
      'Validate your spec file first',
      'Check error messages for specific issues',
      'Use --verbose flag for more details',
    ],
  },

  [ErrorCode.WORKFLOW_PHASE_FAILED]: {
    title: 'Workflow Phase Failed',
    description: 'One of the workflow phases encountered an error.',
    examples: [
      'onboardkit onboard --resume      # Resume from last checkpoint',
      'onboardkit reset                 # Clear checkpoints and start over',
    ],
    relatedCommands: [
      {
        command: 'onboardkit onboard --resume',
        description: 'Resume from checkpoint',
      },
      {
        command: 'onboardkit reset',
        description: 'Clear workflow state',
      },
    ],
    troubleshooting: [
      'Check error message for specific phase that failed',
      'Resume from last checkpoint',
      'Reset and start over if checkpoints are corrupted',
    ],
  },
};

/**
 * Format help content for display
 */
export function formatHelp(content: HelpContent): string {
  const lines: string[] = [];

  // Title
  lines.push(pc.bold(pc.cyan(`\n${content.title}`)));
  lines.push(pc.dim('─'.repeat(60)));
  lines.push('');

  // Description
  lines.push(content.description);
  lines.push('');

  // Examples
  if (content.examples && content.examples.length > 0) {
    lines.push(pc.bold('Examples:'));
    content.examples.forEach((example) => {
      lines.push(pc.dim(`  $ ${example}`));
    });
    lines.push('');
  }

  // Related commands
  if (content.relatedCommands && content.relatedCommands.length > 0) {
    lines.push(pc.bold('Related Commands:'));
    content.relatedCommands.forEach((cmd) => {
      lines.push(`  ${pc.cyan(cmd.command)}`);
      lines.push(pc.dim(`    ${cmd.description}`));
    });
    lines.push('');
  }

  // Troubleshooting
  if (content.troubleshooting && content.troubleshooting.length > 0) {
    lines.push(pc.bold('Troubleshooting:'));
    content.troubleshooting.forEach((tip) => {
      lines.push(pc.dim(`  • ${tip}`));
    });
    lines.push('');
  }

  // Learn more
  if (content.learnMore) {
    lines.push(pc.dim(`Learn more: ${pc.cyan(content.learnMore)}`));
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Get help content for error code
 */
export function getHelp(code: ErrorCode): HelpContent | undefined {
  return HELP_CONTENT[code];
}

/**
 * Display help for error
 */
export function displayHelp(code: ErrorCode): void {
  const content = getHelp(code);
  if (content) {
    console.log(formatHelp(content));
  }
}

/**
 * Format command usage
 */
export function formatCommandUsage(command: string): string {
  const usages: Record<string, string> = {
    init: `
${pc.bold('Usage:')} onboardkit init [options]

${pc.bold('Description:')}
  Create a new onboarding spec template file.

${pc.bold('Options:')}
  --output <path>   Output file path (default: spec.md)
  -h, --help        Display help for command

${pc.bold('Examples:')}
  ${pc.dim('$')} onboardkit init
  ${pc.dim('$')} onboardkit init --output my-spec.md
`,

    auth: `
${pc.bold('Usage:')} onboardkit auth [command] [options]

${pc.bold('Commands:')}
  login             Authenticate with an AI provider
  status            Show authentication status
  revoke            Revoke stored credentials

${pc.bold('Options:')}
  -p, --provider    AI provider name (anthropic, claude)
  -h, --help        Display help for command

${pc.bold('Examples:')}
  ${pc.dim('$')} onboardkit auth
  ${pc.dim('$')} onboardkit auth login
  ${pc.dim('$')} onboardkit auth status
  ${pc.dim('$')} onboardkit auth revoke
`,

    validate: `
${pc.bold('Usage:')} onboardkit validate [options]

${pc.bold('Description:')}
  Validate your onboarding spec file.

${pc.bold('Options:')}
  -s, --spec <path>  Path to spec file (default: spec.md)
  -v, --verbose      Show detailed output
  -h, --help         Display help for command

${pc.bold('Examples:')}
  ${pc.dim('$')} onboardkit validate
  ${pc.dim('$')} onboardkit validate --spec custom.md
  ${pc.dim('$')} onboardkit validate --verbose
`,

    generate: `
${pc.bold('Usage:')} onboardkit generate [options]

${pc.bold('Description:')}
  Generate screens from spec (template-only, no AI).

${pc.bold('Options:')}
  -s, --spec <path>     Path to spec file (default: spec.md)
  -o, --output <path>   Output directory (default: onboardkit-output)
  -v, --verbose         Show detailed output
  --dry-run             Preview without writing files
  --overwrite           Overwrite existing output directory
  -h, --help            Display help for command

${pc.bold('Examples:')}
  ${pc.dim('$')} onboardkit generate
  ${pc.dim('$')} onboardkit generate --output ./screens
  ${pc.dim('$')} onboardkit generate --dry-run
  ${pc.dim('$')} onboardkit generate --overwrite --verbose
`,

    onboard: `
${pc.bold('Usage:')} onboardkit onboard [options]

${pc.bold('Description:')}
  Run full AI-powered workflow with 7 phases.

${pc.bold('Options:')}
  --resume           Resume from last checkpoint
  -v, --verbose      Show detailed output
  -h, --help         Display help for command

${pc.bold('Examples:')}
  ${pc.dim('$')} onboardkit onboard
  ${pc.dim('$')} onboardkit onboard --resume
  ${pc.dim('$')} onboardkit onboard --verbose
`,

    reset: `
${pc.bold('Usage:')} onboardkit reset [options]

${pc.bold('Description:')}
  Clear workflow checkpoints and state.

${pc.bold('Options:')}
  -h, --help         Display help for command

${pc.bold('Examples:')}
  ${pc.dim('$')} onboardkit reset
`,
  };

  return usages[command] || `Unknown command: ${command}`;
}

/**
 * Display command usage
 */
export function displayCommandUsage(command: string): void {
  console.log(formatCommandUsage(command));
}
