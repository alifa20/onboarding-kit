import { Command } from 'commander';
import { getVersion } from './lib/version.js';
import { authCommand, authStatusCommand, authRevokeCommand } from './commands/auth.js';
import { initCommand } from './commands/init.js';
import { validateCommand } from './commands/validate.js';
import { generateCommand } from './commands/generate.js';

const program = new Command();

program
  .name('onboardkit')
  .description('Zero-cost AI-powered onboarding screen generator for React Native/Expo')
  .version(getVersion(), '-v, --version', 'Display version number');

// Init command
program
  .command('init')
  .description('Create a new onboarding spec template')
  .action(async () => {
    await initCommand();
  });

// Auth command with subcommands
const authCmd = program
  .command('auth')
  .description('Authenticate with AI provider via OAuth');

authCmd
  .command('login')
  .description('Authenticate with an AI provider')
  .option('-p, --provider <name>', 'AI provider (anthropic, claude)')
  .action(async (options) => {
    await authCommand(options);
  });

authCmd
  .command('status')
  .description('Show authentication status')
  .action(async () => {
    await authStatusCommand();
  });

authCmd
  .command('revoke')
  .description('Revoke stored credentials')
  .action(async () => {
    await authRevokeCommand();
  });

// Default auth action (login)
authCmd.action(async () => {
  await authCommand({});
});

// Validate command
program
  .command('validate')
  .description('Validate your onboarding spec')
  .option('-s, --spec <path>', 'Path to spec file (default: spec.md)')
  .option('-v, --verbose', 'Show detailed output')
  .action(async (options) => {
    await validateCommand(options);
  });

program
  .command('generate')
  .description('Generate screens from spec (template-only, no AI)')
  .option('-s, --spec <path>', 'Path to spec file (default: spec.md)')
  .option('-o, --output <path>', 'Output directory (default: onboardkit-output)')
  .option('-v, --verbose', 'Show detailed output')
  .option('--dry-run', 'Preview what would be generated without writing files')
  .option('--overwrite', 'Overwrite existing output directory')
  .action(async (options) => {
    await generateCommand(options);
  });

program
  .command('onboard')
  .description('Run full AI-powered workflow with 7 phases')
  .action(() => {
    console.log('onboard command - coming soon');
  });

program
  .command('reset')
  .description('Clear workflow checkpoints')
  .action(() => {
    console.log('reset command - coming soon');
  });

program.parse(process.argv);
