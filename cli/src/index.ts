import { Command } from 'commander';
import { getVersion } from './lib/version.js';
import { authCommand, authStatusCommand, authRevokeCommand } from './commands/auth.js';

const program = new Command();

program
  .name('onboardkit')
  .description('Zero-cost AI-powered onboarding screen generator for React Native/Expo')
  .version(getVersion(), '-v, --version', 'Display version number');

// Placeholder commands - will be implemented in subsequent tasks
program
  .command('init')
  .description('Create a new onboarding spec template')
  .action(() => {
    console.log('init command - coming soon');
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

program
  .command('validate')
  .description('Validate your onboarding spec')
  .action(() => {
    console.log('validate command - coming soon');
  });

program
  .command('generate')
  .description('Generate screens from spec (template-only, no AI)')
  .action(() => {
    console.log('generate command - coming soon');
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
