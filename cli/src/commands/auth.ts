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
 * Anthropic Authentication (OAuth or API Key)
 */
export async function authCommand(): Promise<void> {
  clack.intro(pc.bgCyan(pc.black(' Anthropic Authentication ')));

  try {
    // Check if already authenticated
    const storedProviders = await listStoredProviders();
    if (storedProviders.includes('anthropic')) {
      const useExisting = await clack.confirm({
        message: 'Already authenticated. Re-authenticate?',
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
      `OnboardKit supports two authentication methods:\n\n` +
        `${pc.bold('Option 1: Claude Pro/Max OAuth (Recommended)')}\n` +
        `${pc.cyan('→')} Run: ${pc.bold('claude setup-token')} (requires Claude Code CLI)\n` +
        `${pc.cyan('→')} Token format: ${pc.dim('sk-ant-oat01-...')}\n` +
        `${pc.green('✓')} Uses your Claude subscription (no API charges)\n\n` +
        `${pc.bold('Option 2: Anthropic API Key')}\n` +
        `${pc.cyan('→')} Get from: ${pc.bold('console.anthropic.com')}\n` +
        `${pc.cyan('→')} Token format: ${pc.dim('sk-ant-api03-...')}\n` +
        `${pc.yellow('$')} Pay-per-use (~$0.10-0.50 per generation)`,
      'Choose Authentication Method'
    );

    // Prompt for token/key
    const credential = await clack.text({
      message: 'Enter your Claude OAuth token or Anthropic API key:',
      placeholder: 'sk-ant-oat01-... or sk-ant-api03-...',
      validate: (value) => {
        if (!value) return 'Credential is required';
        if (!value.startsWith('sk-ant-')) {
          return 'Invalid format. Should start with sk-ant-oat (OAuth) or sk-ant-api (API key)';
        }
        return undefined;
      },
    });

    if (clack.isCancel(credential)) {
      clack.cancel('Operation cancelled');
      process.exit(0);
    }

    const isOAuthToken = (credential as string).startsWith('sk-ant-oat');
    const credentialType = isOAuthToken ? 'OAuth token' : 'API key';

    const spinner = clack.spinner();
    spinner.start(`Validating ${credentialType}...`);

    try {
      // Test the credential by making a simple API call
      const { ClaudeProxyClient } = await import('../lib/claude-proxy/index.js');
      const proxyClient = new ClaudeProxyClient({
        tokens: {
          access_token: credential as string,
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

      // Save the credential
      await saveTokens(ANTHROPIC_PROVIDER, {
        access_token: credential as string,
        token_type: 'Bearer',
      });

      spinner.stop('Authentication complete');

      clack.log.success(`Successfully authenticated with ${isOAuthToken ? 'Claude OAuth' : 'Anthropic API'}!`);
      
      if (isOAuthToken) {
        clack.note(
          `${pc.green('✓')} Claude Pro/Max OAuth token validated\n` +
            `${pc.green('✓')} Uses your Claude subscription (no API charges)\n` +
            `${pc.green('✓')} Stored securely in OS keychain\n` +
            `${pc.green('✓')} Ready to use AI features`,
          'Success'
        );
      } else {
        clack.note(
          `${pc.green('✓')} API key validated and saved\n` +
            `${pc.green('✓')} Stored securely in OS keychain\n` +
            `${pc.green('✓')} Ready to use AI features\n\n` +
            `${pc.dim('Note: API usage will be charged (~$0.10-0.50 per generation)')}`,
          'Success'
        );
      }

      clack.outro(pc.green('Ready to use OnboardKit ✓'));
    } catch (err) {
      spinner.stop('Authentication failed');

      const errorMessage = err instanceof Error ? err.message : String(err);
      
      if (isOAuthToken) {
        clack.log.error(
          `Failed to validate OAuth token. Please check:\n` +
            `  ${pc.cyan('→')} Token is copied correctly (no extra spaces)\n` +
            `  ${pc.cyan('→')} Token starts with sk-ant-oat01-\n` +
            `  ${pc.cyan('→')} Token hasn't expired (run ${pc.bold('claude setup-token')} again)\n` +
            `  ${pc.cyan('→')} You have Claude Pro or Claude Max subscription\n\n` +
            `${pc.dim('Get a new token: claude setup-token')}\n\n` +
            `Error: ${errorMessage}`
        );
      } else {
        clack.log.error(
          `Failed to validate API key. Please check:\n` +
            `  ${pc.cyan('→')} API key is copied correctly (no extra spaces)\n` +
            `  ${pc.cyan('→')} API key starts with sk-ant-api\n` +
            `  ${pc.cyan('→')} API key is active (not revoked)\n` +
            `  ${pc.cyan('→')} Your Anthropic account has API access\n\n` +
            `${pc.dim('Get your API key at: console.anthropic.com')}\n\n` +
            `Error: ${errorMessage}`
        );
      }

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
        const isOAuthToken = tokens.access_token.startsWith('sk-ant-oat');

        clack.log.info(`${pc.green('✓')} ${pc.bold(isOAuthToken ? 'Claude OAuth Token' : 'Anthropic API Key')}`);
        clack.log.info(`  Status: ${pc.green('Authenticated')}`);
        clack.log.info(`  Type: ${isOAuthToken ? 'OAuth (Claude Pro/Max subscription)' : 'API Key (pay-per-use)'}`);
        clack.log.info(`  Credential: ${pc.dim(tokens.access_token.substring(0, 20))}...`);
        clack.log.info(`  Storage: OS keychain`);

        clack.outro(pc.green('Status check complete'));
      } catch (err) {
        clack.log.error('Failed to load credentials');
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
