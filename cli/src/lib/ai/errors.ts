import {
  AIError,
  AIRateLimitError,
  AIAuthenticationError,
  AINetworkError,
  AIParseError,
  AITimeoutError,
} from './types.js';

/**
 * Retry strategy configuration
 */
export interface RetryStrategy {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

/**
 * Default retry strategy with exponential backoff
 */
export const DEFAULT_RETRY_STRATEGY: RetryStrategy = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 8000,
  backoffMultiplier: 2,
};

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof AIRateLimitError) {
    return true;
  }
  if (error instanceof AINetworkError) {
    return true;
  }
  if (error instanceof AITimeoutError) {
    return true;
  }
  return false;
}

/**
 * Calculate retry delay with exponential backoff
 */
export function calculateRetryDelay(
  attemptNumber: number,
  strategy: RetryStrategy = DEFAULT_RETRY_STRATEGY
): number {
  const delay = strategy.initialDelayMs * Math.pow(strategy.backoffMultiplier, attemptNumber - 1);
  return Math.min(delay, strategy.maxDelayMs);
}

/**
 * Execute function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  strategy: RetryStrategy = DEFAULT_RETRY_STRATEGY
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= strategy.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if error is not retryable
      if (!isRetryableError(error)) {
        throw error;
      }

      // Don't retry if max retries reached
      if (attempt >= strategy.maxRetries) {
        throw error;
      }

      // Calculate delay for next retry
      const delay = calculateRetryDelay(attempt + 1, strategy);

      // Handle rate limit specific delay
      if (error instanceof AIRateLimitError && error.retryAfter) {
        await sleep(error.retryAfter * 1000);
      } else {
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wrap fetch errors into AI-specific errors
 */
export function wrapFetchError(error: unknown, provider: string): AIError {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Network errors
    if (
      message.includes('fetch') ||
      message.includes('network') ||
      message.includes('econnrefused') ||
      message.includes('enotfound')
    ) {
      return new AINetworkError(`Network error communicating with ${provider}: ${error.message}`);
    }

    // Timeout errors
    if (message.includes('timeout') || message.includes('aborted')) {
      return new AITimeoutError(`Request to ${provider} timed out: ${error.message}`);
    }

    // Generic error
    return new AIError(`Error communicating with ${provider}: ${error.message}`, undefined, provider);
  }

  return new AIError(`Unknown error communicating with ${provider}`, undefined, provider);
}

/**
 * Handle HTTP response errors
 */
export function handleHTTPError(status: number, statusText: string, provider: string): AIError {
  switch (status) {
    case 401:
    case 403:
      return new AIAuthenticationError(
        `Authentication failed with ${provider}. Please run 'onboardkit auth' to re-authenticate.`
      );
    case 429:
      return new AIRateLimitError(
        `Rate limit exceeded for ${provider}. Please wait before trying again.`
      );
    case 500:
    case 502:
    case 503:
    case 504:
      return new AINetworkError(`${provider} server error (${status}): ${statusText}`);
    default:
      return new AIError(
        `Request failed with status ${status}: ${statusText}`,
        `HTTP_${status}`,
        provider
      );
  }
}

/**
 * Export error classes
 */
export {
  AIError,
  AIRateLimitError,
  AIAuthenticationError,
  AINetworkError,
  AIParseError,
  AITimeoutError,
};
