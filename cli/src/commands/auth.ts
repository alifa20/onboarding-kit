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
 * OAuth Authentication via claude.ai
 */
export async function authCommand(): Promise<void> {
  clack.intro(pc.bgCyan(pc.black(' Claude Pro/Max OAuth ')));

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
      `This will authenticate with your ${pc.bold('Claude Pro or Claude Max')} subscription.\n\n` +
        `${pc.cyan('→')} A browser window will open to claude.ai\n` +
        `${pc.cyan('→')} Log in with your Claude Pro/Max account\n` +
        `${pc.cyan('→')} Grant access to OnboardKit\n` +
        `${pc.cyan('→')} Your subscription will be used (no API charges!)`,
      'OAuth Flow'
    );

    const spinner = clack.spinner();
    spinner.start('Starting OAuth flow...');

    try {
      // Import OAuth flow functions
      const {
        generateCodeVerifier,
        generateCodeChallenge,
        generateState,
        buildAuthorizationUrl,
        startCallbackServer,
        getRedirectUri,
        exchangeCodeForTokens,
      } = await import('../lib/oauth/index.js');

      const port = 3000;
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = generateCodeChallenge(codeVerifier);
      const state = generateState();
      const redirectUri = getRedirectUri(port);

      const authUrl = buildAuthorizationUrl(ANTHROPIC_PROVIDER, {
        codeVerifier,
        codeChallenge,
        state,
        redirectUri,
      });

      spinner.stop('Opening browser...');

      clack.log.info(`If browser doesn't open, visit:\n${pc.cyan(authUrl)}`);

      // Open browser
      await openBrowser(authUrl);

      // Wait for callback
      spinner.start('Waiting for authentication...');
      const callback = await startCallbackServer(port);

      // Verify state
      if (callback.state !== state) {
        spinner.stop('State verification failed');
        throw new OAuthError('State mismatch - possible CSRF attack');
      }

      spinner.message('Exchanging authorization code...');

      // Exchange code for tokens
      const tokens = await exchangeCodeForTokens(
        ANTHROPIC_PROVIDER,
        callback.code,
        codeVerifier,
        redirectUri
      );

      spinner.message('Saving credentials...');

      // Save tokens
      await saveTokens(ANTHROPIC_PROVIDER, tokens);

      spinner.stop('Authentication complete');

      clack.log.success('Successfully authenticated with Claude Pro/Max!');
      clack.note(
        `${pc.green('✓')} Your Claude subscription will be used\n` +
          `${pc.green('✓')} No API charges - uses your $20-200/month subscription\n` +
          `${pc.green('✓')} Tokens saved to OS keychain`,
        'Success'
      );

      clack.outro(pc.green('Ready to use OnboardKit ✓'));
    } catch (err) {
      spinner.stop('Authentication failed');

      if (err instanceof OAuthError) {
        clack.log.error(err.message);
      } else {
        clack.log.error(`Error: ${err}`);
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

        clack.log.info(`${pc.green('✓')} ${pc.bold('Claude Pro/Max OAuth')}`);
        clack.log.info(`  Status: ${pc.green('Authenticated')}`);
        clack.log.info(`  Mode: Subscription (no API charges)`);
        clack.log.info(`  Token: ${pc.dim(tokens.access_token.substring(0, 20))}...`);

        if (tokens.expires_in) {
          const expiresIn = Math.floor(tokens.expires_in / 3600);
          clack.log.info(`  Expires: ${expiresIn} hours`);
        }

        clack.outro(pc.green('Status check complete'));
      } catch (err) {
        clack.log.error('Failed to load OAuth tokens');
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
