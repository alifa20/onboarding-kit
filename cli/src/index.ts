import { Command } from 'commander';
import { getVersion } from './lib/version.js';
import { authCommand, authStatusCommand, authRevokeCommand } from './commands/auth.js';
import { initCommand } from './commands/init.js';
import { validateCommand } from './commands/validate.js';
import { generateCommand } from './commands/generate.js';
import { onboardCommand } from './commands/onboard.js';
import { resetCommand } from './commands/reset.js';
import { initializeErrorHandling, withErrorHandling } from './lib/errors/index.js';

// Initialize global error handlers
initializeErrorHandling();

const program = new Command();

program
  .name('onboardkit')
  .description('Zero-cost AI-powered onboarding screen generator for React Native/Expo')
  .version(getVersion(), '-v, --version', 'Display version number');

// Init command
program
  .command('init')
  .description('Create a new onboarding spec template')
  .action(withErrorHandling(initCommand, { commandName: 'init' }));

// Auth command with subcommands
const authCmd = program
  .command('auth')
  .description('Authenticate with AI provider via OAuth');

authCmd
  .command('login')
  .description('Authenticate with Claude Pro/Max via OAuth')
  .action(withErrorHandling(authCommand, { commandName: 'auth' }));

authCmd
  .command('status')
  .description('Show authentication status')
  .action(withErrorHandling(authStatusCommand, { commandName: 'auth-status' }));

authCmd
  .command('revoke')
  .description('Revoke stored credentials')
  .action(withErrorHandling(authRevokeCommand, { commandName: 'auth-revoke' }));

// Default auth action (login)
authCmd.action(withErrorHandling(authCommand, { commandName: 'auth' }));

// Validate command
program
  .command('validate')
  .description('Validate your onboarding spec')
  .option('-s, --spec <path>', 'Path to spec file (default: spec.md)')
  .option('-v, --verbose', 'Show detailed output')
  .action(withErrorHandling(validateCommand, { commandName: 'validate' }));

program
  .command('generate')
  .description('Generate screens from spec (template-only, no AI)')
  .option('-s, --spec <path>', 'Path to spec file (default: spec.md)')
  .option('-o, --output <path>', 'Output directory (default: onboardkit-output)')
  .option('-v, --verbose', 'Show detailed output')
  .option('--dry-run', 'Preview what would be generated without writing files')
  .option('--overwrite', 'Overwrite existing output directory')
  .action(withErrorHandling(generateCommand, { commandName: 'generate' }));

// Onboard command - Full AI-powered workflow
program
  .command('onboard')
  .description('Run full AI-powered workflow with 7 phases')
  .option('-s, --spec <path>', 'Path to spec file (default: spec.md)')
  .option('-o, --output <path>', 'Output directory (default: onboardkit-output)')
  .option('--ai-repair', 'Automatically repair validation errors with AI')
  .option('--ai-enhance', 'Enhance copy with AI improvements')
  .option('--skip-refinement', 'Skip optional refinement phase (default: true)')
  .option('-v, --verbose', 'Show detailed output')
  .option('--dry-run', 'Preview workflow without writing files')
  .option('--overwrite', 'Overwrite existing output directory')
  .action(withErrorHandling(onboardCommand, { commandName: 'onboard' }));

// Reset command - Clear checkpoints
program
  .command('reset')
  .description('Clear workflow checkpoints')
  .option('-s, --spec <path>', 'Path to spec file (default: spec.md)')
  .option('-f, --force', 'Skip confirmation prompt')
  .action(withErrorHandling(resetCommand, { commandName: 'reset' }));

program.parse(process.argv);
