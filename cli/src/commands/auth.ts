import * as clack from '@clack/prompts';
import pc from 'picocolors';
import { exec } from 'child_process';
import { promisify } from 'util';
import {
  getProvider,
  listProviders,
  isProviderConfigured,
  executeOAuthFlow,
  saveTokens,
  revokeTokens,
  getCredentialStatus,
  listStoredProviders,
  OAuthError,
} from '../lib/oauth/index.js';

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
    throw new Error(`Failed to open browser: ${err}`);
  }
}

/**
 * Format timestamp for display
 */
function formatTimestamp(timestamp?: number): string {
  if (!timestamp) return 'Unknown';

  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffMins > 0) {
    return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  } else {
    return 'just now';
  }
}

/**
 * Format expiration time
 */
function formatExpiration(expiresAt?: number): string {
  if (!expiresAt) return 'Never';

  const now = Date.now();
  const diffMs = expiresAt - now;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMs < 0) {
    return pc.red('Expired');
  }

  if (diffDays > 0) {
    return pc.green(`${diffDays} day${diffDays > 1 ? 's' : ''}`);
  } else if (diffHours > 0) {
    return pc.yellow(`${diffHours} hour${diffHours > 1 ? 's' : ''}`);
  } else if (diffMins > 0) {
    return pc.yellow(`${diffMins} minute${diffMins > 1 ? 's' : ''}`);
  } else {
    return pc.red('Expiring soon');
  }
}

/**
 * Execute OAuth authentication flow
 */
export async function authCommand(options: { provider?: string }): Promise<void> {
  clack.intro(pc.bgCyan(pc.black(' OAuth Authentication ')));

  try {
    // Get provider from option or prompt user
    let providerName = options.provider;

    if (!providerName) {
      const availableProviders = listProviders();

      if (availableProviders.length === 0) {
        clack.outro(pc.red('No OAuth providers configured'));
        process.exit(1);
      }

      if (availableProviders.length === 1) {
        providerName = availableProviders[0].name;
        clack.log.info(`Using ${availableProviders[0].displayName}`);
      } else {
        const selected = await clack.select({
          message: 'Select AI provider:',
          options: availableProviders.map((p) => ({
            value: p.name,
            label: p.displayName,
          })),
        });

        if (clack.isCancel(selected)) {
          clack.cancel('Operation cancelled');
          process.exit(0);
        }

        providerName = selected as string;
      }
    }

    const provider = getProvider(providerName);

    if (!provider) {
      clack.outro(pc.red(`Unknown provider: ${providerName}`));
      process.exit(1);
    }

    // Check if provider is configured
    if (!isProviderConfigured(provider)) {
      clack.log.error(
        `${provider.displayName} is not configured. Please set the client ID.`
      );
      clack.outro(pc.red('Authentication failed'));
      process.exit(1);
    }

    const spinner = clack.spinner();

    // Start OAuth flow
    spinner.start('Starting OAuth flow...');

    try {
      // Start callback server and get auth URL
      const port = 3000;
      spinner.message('Starting local callback server...');

      // We need to structure this differently since executeOAuthFlow waits for callback
      // Let's use the lower-level functions instead
      const {
        generateCodeVerifier,
        generateCodeChallenge,
        generateState,
        buildAuthorizationUrl,
        startCallbackServer,
        getRedirectUri,
        exchangeCodeForTokens,
      } = await import('../lib/oauth/index.js');

      const codeVerifier = generateCodeVerifier();
      const codeChallenge = generateCodeChallenge(codeVerifier);
      const state = generateState();
      const redirectUri = getRedirectUri(port);

      const authUrl = buildAuthorizationUrl(provider, {
        codeVerifier,
        codeChallenge,
        state,
        redirectUri,
      });

      spinner.stop('Callback server started');

      // Show instructions
      clack.log.info(`Opening browser for authorization...`);
      clack.log.info(`If browser doesn't open, visit:\n${pc.cyan(authUrl)}`);

      // Open browser
      try {
        await openBrowser(authUrl);
        clack.log.success('Browser opened');
      } catch (err) {
        clack.log.warn('Could not open browser automatically');
      }

      // Wait for callback
      spinner.start('Waiting for authorization...');
      const callback = await startCallbackServer(port);

      // Verify state
      if (callback.state !== state) {
        spinner.stop('State verification failed');
        throw new OAuthError('State mismatch - possible CSRF attack');
      }

      spinner.message('Exchanging authorization code for tokens...');

      // Exchange code for tokens
      const tokens = await exchangeCodeForTokens(
        provider,
        callback.code,
        codeVerifier,
        redirectUri
      );

      spinner.message('Saving credentials...');

      // Save tokens
      await saveTokens(provider, tokens);

      spinner.stop('Credentials saved');

      clack.log.success(`Successfully authenticated with ${provider.displayName}!`);

      // Show expiration info if available
      if (tokens.expires_in) {
        const expiresIn = Math.floor(tokens.expires_in / 3600);
        clack.log.info(`Access token expires in ${expiresIn} hours`);
      }

      clack.outro(pc.green('Authentication complete ✓'));
    } catch (err) {
      spinner.stop('Authentication failed');

      if (err instanceof OAuthError) {
        clack.log.error(err.message);
      } else {
        clack.log.error(`Unexpected error: ${err}`);
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
      clack.log.warn('No authenticated providers found');
      clack.outro(pc.yellow('Run "onboardkit auth" to authenticate'));
      return;
    }

    for (const providerName of storedProviders) {
      const provider = getProvider(providerName);

      if (!provider) {
        continue;
      }

      const status = await getCredentialStatus(provider);

      const statusIcon = status.isExpired ? pc.red('✗') : pc.green('✓');
      const statusText = status.isExpired ? pc.red('Expired') : pc.green('Active');

      clack.log.info(`${statusIcon} ${pc.bold(provider.displayName)}`);
      clack.log.info(`  Status: ${statusText}`);

      if (status.expiresAt) {
        clack.log.info(`  Expires: ${formatExpiration(status.expiresAt)}`);
      }

      if (status.canRefresh) {
        clack.log.info(`  Refresh: ${pc.green('Available')}`);
      }

      console.log(); // Empty line
    }

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
  clack.intro(pc.bgRed(pc.white(' Revoke Authentication ')));

  try {
    const storedProviders = await listStoredProviders();

    if (storedProviders.length === 0) {
      clack.log.warn('No authenticated providers found');
      clack.outro(pc.yellow('Nothing to revoke'));
      return;
    }

    // Confirm action
    const confirm = await clack.confirm({
      message: 'Are you sure you want to revoke all stored credentials?',
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

    clack.log.success('All credentials have been removed');
    clack.outro(pc.green('Revocation complete'));
  } catch (err) {
    clack.log.error(`Error revoking credentials: ${err}`);
    clack.outro(pc.red('Revocation failed'));
    process.exit(1);
  }
}
