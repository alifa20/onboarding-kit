import * as clack from '@clack/prompts';
import pc from 'picocolors';
import { exec } from 'child_process';
import { promisify } from 'util';
import {
  getProvider,
  executeOAuthFlow,
  saveTokens,
  loadTokens,
  revokeTokens,
  listStoredProviders,
  OAuthError,
} from '../lib/oauth/index.js';
import { ANTHROPIC_PROVIDER } from '../lib/oauth/providers.js';

const execAsync = promisify(exec);

/**
 * Open URL in default browser
 */
async function openBrowser(url: string): Promise<void> {
  const platform = process.platform;

  try {
    if (platform === 'darwin') {
      await execAsync(`open "${url}"`);
    } else if (platform === 'win32') {
      await execAsync(`start "" "${url}"`);
    } else {
      // Linux and others
      await execAsync(`xdg-open "${url}"`);
    }
  } catch (err) {
    // Ignore browser open errors
  }
}

/**
 * API Key Authentication
 */
export async function authCommand(): Promise<void> {
  clack.intro(pc.bgCyan(pc.black(' Anthropic API Key Authentication ')));

  try {
    // Check if already authenticated
    const storedProviders = await listStoredProviders();
    if (storedProviders.includes('anthropic')) {
      const useExisting = await clack.confirm({
        message: 'Already authenticated with Anthropic. Re-authenticate?',
        initialValue: false,
      });

      if (clack.isCancel(useExisting)) {
        clack.cancel('Operation cancelled');
        process.exit(0);
      }

      if (!useExisting) {
        clack.outro(pc.green('Using existing authentication'));
        return;
      }
    }

    clack.note(
      `OnboardKit uses ${pc.bold('Anthropic API keys')} for AI features.\n\n` +
        `${pc.cyan('→')} Visit ${pc.bold('console.anthropic.com')}\n` +
        `${pc.cyan('→')} Go to Settings > API Keys\n` +
        `${pc.cyan('→')} Create a new API key\n` +
        `${pc.cyan('→')} Paste the key below\n\n` +
        `${pc.dim('API keys start with: sk-ant-api03-...')}`,
      'API Key Required'
    );

    // Prompt for API key
    const apiKey = await clack.text({
      message: 'Enter your Anthropic API key:',
      placeholder: 'sk-ant-api03-...',
      validate: (value) => {
        if (!value) return 'API key is required';
        if (!value.startsWith('sk-ant-api')) {
          return 'Invalid API key format. Should start with sk-ant-api';
        }
        return undefined;
      },
    });

    if (clack.isCancel(apiKey)) {
      clack.cancel('Operation cancelled');
      process.exit(0);
    }

    const spinner = clack.spinner();
    spinner.start('Validating API key...');

    try {
      // Test the API key by making a simple API call
      const { ClaudeProxyClient } = await import('../lib/claude-proxy/index.js');
      const proxyClient = new ClaudeProxyClient({
        tokens: {
          access_token: apiKey as string,
          token_type: 'Bearer',
        },
      });

      // Test with a minimal request
      await proxyClient.sendMessage({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 10,
        messages: [
          {
            role: 'user',
            content: 'Hi',
          },
        ],
      });

      spinner.message('Saving credentials...');

      // Save the API key
      await saveTokens(ANTHROPIC_PROVIDER, {
        access_token: apiKey as string,
        token_type: 'Bearer',
      });

      spinner.stop('Authentication complete');

      clack.log.success('Successfully authenticated with Anthropic!');
      clack.note(
        `${pc.green('✓')} API key validated and saved\n` +
          `${pc.green('✓')} Stored securely in OS keychain\n` +
          `${pc.green('✓')} Ready to use AI features\n\n` +
          `${pc.dim('Note: API usage will be charged to your Anthropic account')}`,
        'Success'
      );

      clack.outro(pc.green('Ready to use OnboardKit ✓'));
    } catch (err) {
      spinner.stop('Authentication failed');

      const errorMessage = err instanceof Error ? err.message : String(err);
      
      clack.log.error(
        `Failed to validate API key. Please check:\n` +
          `  ${pc.cyan('→')} API key is copied correctly (no extra spaces)\n` +
          `  ${pc.cyan('→')} API key starts with sk-ant-api\n` +
          `  ${pc.cyan('→')} API key is active (not revoked)\n` +
          `  ${pc.cyan('→')} Your Anthropic account has API access\n\n` +
          `${pc.dim('Get your API key at: console.anthropic.com')}\n\n` +
          `Error: ${errorMessage}`
      );

      clack.outro(pc.red('Authentication failed'));
      process.exit(1);
    }
  } catch (err) {
    clack.log.error(`Fatal error: ${err}`);
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
    const storedProviders = await listStoredProviders();

    if (storedProviders.length === 0) {
      clack.log.warn('Not authenticated');
      clack.outro(pc.yellow('Run "onboardkit auth" to authenticate'));
      return;
    }

    if (storedProviders.includes('anthropic')) {
      try {
        const tokens = await loadTokens(ANTHROPIC_PROVIDER);

        clack.log.info(`${pc.green('✓')} ${pc.bold('Anthropic API Key')}`);
        clack.log.info(`  Status: ${pc.green('Authenticated')}`);
        clack.log.info(`  Key: ${pc.dim(tokens.access_token.substring(0, 20))}...`);
        clack.log.info(`  Storage: OS keychain`);

        clack.outro(pc.green('Status check complete'));
      } catch (err) {
        clack.log.error('Failed to load API key');
        clack.outro(pc.red('Status check failed'));
        process.exit(1);
      }
    }
  } catch (err) {
    clack.log.error(`Error: ${err}`);
    clack.outro(pc.red('Status check failed'));
    process.exit(1);
  }
}

/**
 * Revoke authentication
 */
export async function authRevokeCommand(): Promise<void> {
  clack.intro(pc.bgRed(pc.white(' Revoke Authentication ')));

  try {
    const storedProviders = await listStoredProviders();

    if (storedProviders.length === 0) {
      clack.log.warn('Not authenticated');
      clack.outro(pc.yellow('Nothing to revoke'));
      return;
    }

    // Confirm action
    const confirm = await clack.confirm({
      message: 'Are you sure you want to revoke authentication?',
    });

    if (clack.isCancel(confirm) || !confirm) {
      clack.cancel('Operation cancelled');
      process.exit(0);
    }

    const spinner = clack.spinner();
    spinner.start('Revoking credentials...');

    // Revoke all providers
    for (const providerName of storedProviders) {
      await revokeTokens(providerName);
    }

    spinner.stop('Credentials revoked');

    clack.log.success('Authentication has been revoked');
    clack.outro(pc.green('Revocation complete'));
  } catch (err) {
    clack.log.error(`Error: ${err}`);
    clack.outro(pc.red('Revocation failed'));
    process.exit(1);
  }
}
