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
    // If OAuth flag is set, show the reality about OAuth
    if (options.oauth) {
      clack.note(
        `${pc.red('⚠ OAuth tokens do NOT work with Anthropic API')}\n\n` +
          `OAuth tokens from Claude Code (sk-ant-oat01-) are restricted\n` +
          `to Claude Code only. The API returns:\n` +
          `${pc.dim('"OAuth authentication is currently not supported."')}\n\n` +
          `${pc.bold('You must use an API key instead:')}\n` +
          `1. Visit ${pc.cyan('https://console.anthropic.com/settings/keys')}\n` +
          `2. Create a new API key (sk-ant-api03-...)\n` +
          `3. Run ${pc.cyan('npx onboardkit auth')} with that key\n\n` +
          `${pc.dim('Source: https://jpcaparas.medium.com/claude-code-cripples-third-party-coding-agents-from-using-oauth-6548e9b49df3')}`,
        'OAuth Reality Check'
      );
      clack.outro(pc.red('OAuth tokens are not supported. Use API keys.'));
      process.exit(1);
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
        `${pc.bold('Get your API key from:')}\n` +
          `${pc.cyan('https://console.anthropic.com/settings/keys')}\n\n` +
          `${pc.yellow('⚠ Note:')} OAuth tokens (sk-ant-oat01-) from Claude Code\n` +
          `do NOT work with the Anthropic API. You need an API key\n` +
          `that starts with ${pc.cyan('sk-ant-api03-')}`,
        'API Key Required'
      );

      const input = await clack.text({
        message: 'Enter your Anthropic API key:',
        placeholder: 'sk-ant-api03-...',
        validate: (value) => {
          if (!value) return 'API key is required';
          if (!value.startsWith('sk-ant-api')) {
            return 'Invalid API key. Should start with "sk-ant-api03-"';
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
