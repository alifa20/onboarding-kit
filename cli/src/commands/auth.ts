import * as clack from '@clack/prompts';
import pc from 'picocolors';
import {
  saveApiKey,
  loadApiKey,
  hasApiKey,
  isValidApiKey,
  testApiKey,
  removeApiKey,
} from '../lib/auth/index.js';

// Removed unused functions

/**
 * API Key Authentication
 */
export async function authCommand(options: { apiKey?: string; oauth?: boolean }): Promise<void> {
  clack.intro(pc.bgCyan(pc.black(' Anthropic Authentication ')));

  try {
    // If OAuth flag is set, show instructions for Claude CLI
    if (options.oauth) {
      clack.note(
        `Anthropic OAuth is restricted to official Claude applications.\n\n` +
          `For Claude Pro/Max subscriptions, use:\n` +
          `${pc.cyan('claude setup-token')}\n\n` +
          `This generates a token that can be used as:\n` +
          `${pc.cyan('export ANTHROPIC_API_KEY=$(cat ~/.anthropic/token.txt)')}\n\n` +
          `Then run ${pc.cyan('npx onboardkit onboard spec.md')}`,
        'OAuth Information'
      );
      clack.outro(pc.yellow('Use API key authentication instead (run without --oauth flag)'));
      return;
    }

    let apiKey = options.apiKey;

    // Check if already has API key
    if (!apiKey && (await hasApiKey())) {
      const useExisting = await clack.confirm({
        message: 'API key already configured. Do you want to replace it?',
        initialValue: false,
      });

      if (clack.isCancel(useExisting)) {
        clack.cancel('Operation cancelled');
        process.exit(0);
      }

      if (!useExisting) {
        clack.outro(pc.green('Using existing API key'));
        return;
      }
    }

    // Prompt for API key if not provided
    if (!apiKey) {
      clack.note(
        `${pc.bold('Option 1:')} API Key (Recommended)\n` +
          `Get your API key from:\n${pc.cyan('https://console.anthropic.com/settings/keys')}\n\n` +
          `${pc.bold('Option 2:')} Claude Pro/Max Subscription\n` +
          `If you have Claude Pro/Max, run:\n${pc.cyan('claude setup-token')}\n` +
          `Then use that token as your API key`,
        'Authentication Options'
      );

      const input = await clack.text({
        message: 'Enter your Anthropic API key or subscription token:',
        placeholder: 'sk-ant-... or token from claude setup-token',
        validate: (value) => {
          if (!value) return 'API key is required';
          // Allow both API keys and subscription tokens
          if (!value.startsWith('sk-ant-') && value.length < 20) {
            return 'Invalid format. Should start with "sk-ant-" or be a subscription token';
          }
        },
      });

      if (clack.isCancel(input)) {
        clack.cancel('Operation cancelled');
        process.exit(0);
      }

      apiKey = input as string;
    }

    // Test API key/token
    const spinner = clack.spinner();
    spinner.start('Testing credentials...');

    const isValid = await testApiKey(apiKey);

    if (!isValid) {
      spinner.stop('Credential test failed');
      clack.outro(pc.red('Invalid API key/token. Please check and try again.'));
      process.exit(1);
    }

    spinner.message('Saving credentials...');

    // Save API key
    await saveApiKey(apiKey);

    spinner.stop('Credentials saved');

    clack.log.success('Successfully configured Anthropic authentication!');
    clack.note(
      `Your credentials are saved to:\n${pc.dim('~/.onboardkit/api-key.txt')}\n\n` +
        `You can also use the ANTHROPIC_API_KEY environment variable.`,
      'Configuration'
    );

    clack.outro(pc.green('Authentication complete ✓'));
  } catch (err) {
    clack.log.error(`Error: ${err}`);
    clack.outro(pc.red('Authentication failed'));
    process.exit(1);
  }
}

/**
 * Show authentication status
 */
export async function authStatusCommand(): Promise<void> {
  clack.intro(pc.bgCyan(pc.black(' Authentication Status ')));

  try {
    const hasKey = await hasApiKey();

    if (!hasKey) {
      clack.log.warn('No API key configured');
      clack.outro(pc.yellow('Run "onboardkit auth" to configure your API key'));
      return;
    }

    const apiKey = await loadApiKey();
    if (!apiKey) {
      clack.log.warn('Could not load API key');
      clack.outro(pc.yellow('Run "onboardkit auth" to configure your API key'));
      return;
    }

    clack.log.info(`${pc.green('✓')} ${pc.bold('Anthropic API Key')}`);
    clack.log.info(`  Status: ${pc.green('Configured')}`);
    clack.log.info(`  Key: ${pc.dim(apiKey.substring(0, 20))}...`);
    clack.log.info(`  Source: ${process.env.ANTHROPIC_API_KEY ? 'Environment Variable' : 'Config File'}`);

    clack.outro(pc.green('Status check complete'));
  } catch (err) {
    clack.log.error(`Error checking status: ${err}`);
    clack.outro(pc.red('Status check failed'));
    process.exit(1);
  }
}

/**
 * Revoke authentication
 */
export async function authRevokeCommand(): Promise<void> {
  clack.intro(pc.bgRed(pc.white(' Remove API Key ')));

  try {
    const hasKey = await hasApiKey();

    if (!hasKey) {
      clack.log.warn('No API key configured');
      clack.outro(pc.yellow('Nothing to remove'));
      return;
    }

    // Confirm action
    const confirm = await clack.confirm({
      message: 'Are you sure you want to remove your stored API key?',
    });

    if (clack.isCancel(confirm) || !confirm) {
      clack.cancel('Operation cancelled');
      process.exit(0);
    }

    const spinner = clack.spinner();
    spinner.start('Removing API key...');

    // Remove API key
    await removeApiKey();

    spinner.stop('API key removed');

    clack.log.success('API key has been removed');
    clack.outro(pc.green('Removal complete'));
  } catch (err) {
    clack.log.error(`Error removing API key: ${err}`);
    clack.outro(pc.red('Removal failed'));
    process.exit(1);
  }
}
