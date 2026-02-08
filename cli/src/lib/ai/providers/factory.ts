import { AIProvider } from '../types.js';
import { AIError } from '../errors.js';
import { AnthropicProvider } from './anthropic.js';
import { loadApiKey } from '../../auth/index.js';
import { loadTokens } from '../../oauth/index.js';
import { ANTHROPIC_PROVIDER } from '../../oauth/providers.js';

/**
 * Supported AI provider names
 */
export type ProviderName = 'anthropic' | 'claude';

/**
 * Create an AI provider instance
 */
export async function createProvider(
  providerName: ProviderName = 'anthropic',
  accessToken?: string
): Promise<AIProvider> {
  const normalizedName = normalizeProviderName(providerName);

  switch (normalizedName) {
    case 'anthropic': {
      // Try OAuth tokens first, fall back to API key
      const tokens = await loadTokens(ANTHROPIC_PROVIDER).catch(() => null);

      if (tokens) {
        // Use OAuth mode with Claude Code proxy
        return new AnthropicProvider({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_in: tokens.expires_in,
          token_type: 'Bearer',
        });
      }

      // Fall back to API key mode
      const apiKey = accessToken || (await loadApiKey());
      if (!apiKey) {
        throw new AIError(
          'No authentication found. Run "onboardkit auth" to authenticate with OAuth or API key.',
          'NO_AUTH'
        );
      }

      return new AnthropicProvider(apiKey);
    }

    default:
      throw new AIError(
        `Unsupported provider: ${providerName}. Supported providers: anthropic, claude`,
        'UNSUPPORTED_PROVIDER'
      );
  }
}

/**
 * Normalize provider name (handle aliases)
 */
function normalizeProviderName(name: ProviderName): 'anthropic' {
  const normalized = name.toLowerCase();

  if (normalized === 'claude' || normalized === 'anthropic') {
    return 'anthropic';
  }

  throw new AIError(
    `Invalid provider name: ${name}`,
    'INVALID_PROVIDER'
  );
}

/**
 * Get default provider
 */
export async function getDefaultProvider(): Promise<AIProvider> {
  return createProvider('anthropic');
}

/**
 * Check if a provider is configured
 */
export async function isProviderConfigured(
  providerName: ProviderName = 'anthropic'
): Promise<boolean> {
  try {
    const provider = await createProvider(providerName);
    return await provider.isAvailable();
  } catch {
    return false;
  }
}
