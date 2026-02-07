import { AIProvider } from '../types.js';
import { AIError } from '../errors.js';
import { createAnthropicProvider } from './anthropic.js';
import { getValidAccessToken } from '../../oauth/index.js';
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
      // Get access token from OAuth if not provided
      const token = accessToken || (await getValidAccessToken(ANTHROPIC_PROVIDER));
      return createAnthropicProvider(token);
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
