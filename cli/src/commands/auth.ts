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
 * Setup Token Authentication (via Claude Code CLI)
 */
export async function authCommand(): Promise<void> {
  clack.intro(pc.bgCyan(pc.black(' Claude Pro/Max Setup Token ')));

  try {
    // Check if already authenticated
    const storedProviders = await listStoredProviders();
    if (storedProviders.includes('anthropic')) {
      const useExisting = await clack.confirm({
        message: 'Already authenticated with Claude. Re-authenticate?',
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
      `OnboardKit uses ${pc.bold('Claude Code setup tokens')} to access your Claude Pro/Max subscription.\n\n` +
        `${pc.cyan('→')} Install Claude Code CLI if not already installed\n` +
        `${pc.cyan('→')} Run ${pc.bold('claude setup-token')} to generate a token\n` +
        `${pc.cyan('→')} Paste the token below\n` +
        `${pc.cyan('→')} Your subscription will be used (no API charges!)`,
      'Setup Token Required'
    );

    // Prompt for setup token
    const setupToken = await clack.text({
      message: 'Enter your Claude Code setup token:',
      placeholder: 'sk-ant-oat01-...',
      validate: (value) => {
        if (!value) return 'Setup token is required';
        if (!value.startsWith('sk-ant-oat01-')) {
          return 'Invalid token format. Should start with sk-ant-oat01-';
        }
        return undefined;
      },
    });

    if (clack.isCancel(setupToken)) {
      clack.cancel('Operation cancelled');
      process.exit(0);
    }

    const spinner = clack.spinner();
    spinner.start('Validating setup token...');

    try {
      // Test the token by making a simple API call
      const { ClaudeProxyClient } = await import('../lib/claude-proxy/index.js');
      const proxyClient = new ClaudeProxyClient({
        tokens: {
          access_token: setupToken as string,
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

      // Save the token as OAuth tokens
      await saveTokens(ANTHROPIC_PROVIDER, {
        access_token: setupToken as string,
        token_type: 'Bearer',
      });

      spinner.stop('Authentication complete');

      clack.log.success('Successfully authenticated with Claude Pro/Max!');
      clack.note(
        `${pc.green('✓')} Your Claude subscription will be used\n` +
          `${pc.green('✓')} No API charges - uses your $20-200/month subscription\n` +
          `${pc.green('✓')} Token saved to OS keychain`,
        'Success'
      );

      clack.outro(pc.green('Ready to use OnboardKit ✓'));
    } catch (err) {
      spinner.stop('Authentication failed');

      clack.log.error(
        `Failed to validate setup token. Please check:\n` +
          `  ${pc.cyan('→')} Token is copied correctly\n` +
          `  ${pc.cyan('→')} You have Claude Pro or Claude Max subscription\n` +
          `  ${pc.cyan('→')} Token hasn't expired\n\n` +
          `Error: ${err instanceof Error ? err.message : err}`
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

        clack.log.info(`${pc.green('✓')} ${pc.bold('Claude Pro/Max Setup Token')}`);
        clack.log.info(`  Status: ${pc.green('Authenticated')}`);
        clack.log.info(`  Mode: Subscription (no API charges)`);
        clack.log.info(`  Token: ${pc.dim(tokens.access_token.substring(0, 20))}...`);
        clack.log.info(`  Type: Claude Code setup token`);

        clack.outro(pc.green('Status check complete'));
      } catch (err) {
        clack.log.error('Failed to load setup token');
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
