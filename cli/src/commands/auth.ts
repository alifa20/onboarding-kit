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
export async function authCommand(options: { apiKey?: string }): Promise<void> {
  clack.intro(pc.bgCyan(pc.black(' Anthropic API Key Setup ')));

  try {
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
        `Get your API key from:\n${pc.cyan('https://console.anthropic.com/settings/keys')}`,
        'API Key Required'
      );

      const input = await clack.text({
        message: 'Enter your Anthropic API key:',
        placeholder: 'sk-ant-...',
        validate: (value) => {
          if (!value) return 'API key is required';
          if (!isValidApiKey(value)) {
            return 'Invalid API key format. Should start with "sk-ant-"';
          }
        },
      });

      if (clack.isCancel(input)) {
        clack.cancel('Operation cancelled');
        process.exit(0);
      }

      apiKey = input as string;
    }

    // Validate API key
    if (!isValidApiKey(apiKey)) {
      clack.outro(pc.red('Invalid API key format. Should start with "sk-ant-"'));
      process.exit(1);
    }

    // Test API key
    const spinner = clack.spinner();
    spinner.start('Testing API key...');

    const isValid = await testApiKey(apiKey);

    if (!isValid) {
      spinner.stop('API key test failed');
      clack.outro(pc.red('Invalid API key. Please check your key and try again.'));
      process.exit(1);
    }

    spinner.message('Saving API key...');

    // Save API key
    await saveApiKey(apiKey);

    spinner.stop('API key saved');

    clack.log.success('Successfully configured Anthropic API key!');
    clack.note(
      `Your API key is saved to:\n${pc.dim('~/.onboardkit/api-key.txt')}\n\n` +
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
