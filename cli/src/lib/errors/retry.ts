/**
 * Retry logic with exponential backoff
 */

import { ErrorCode } from './types.js';
import { CLIError, NetworkError, AuthenticationError } from './base.js';

/**
 * Retry strategy configuration
 */
export interface RetryStrategy {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors: Set<ErrorCode>;
}

/**
 * Default retry strategy
 */
export const DEFAULT_RETRY_STRATEGY: RetryStrategy = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 8000,
  backoffMultiplier: 2,
  retryableErrors: new Set([
    ErrorCode.NETWORK_CONNECTION_FAILED,
    ErrorCode.NETWORK_TIMEOUT,
    ErrorCode.NETWORK_RATE_LIMIT,
    ErrorCode.AI_PROVIDER_ERROR,
    ErrorCode.AI_RESPONSE_INVALID,
  ]),
};

/**
 * Retry callback function
 */
export interface RetryCallback {
  onRetry?: (attempt: number, delay: number, error: Error) => void;
  onSuccess?: () => void;
  onFailure?: (error: Error) => void;
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(
  error: unknown,
  strategy: RetryStrategy = DEFAULT_RETRY_STRATEGY
): boolean {
  // User cancellation is never retryable
  if (error instanceof CLIError && error.code === ErrorCode.USER_CANCELLED) {
    return false;
  }

  // Authentication errors are not retryable (need user action)
  if (error instanceof AuthenticationError) {
    return false;
  }

  // Check if error has canRetry flag
  if (error instanceof CLIError) {
    if (!error.canRetry) {
      return false;
    }
    return strategy.retryableErrors.has(error.code);
  }

  // Network errors are generally retryable
  if (error instanceof NetworkError) {
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
  const delay =
    strategy.initialDelayMs *
    Math.pow(strategy.backoffMultiplier, attemptNumber - 1);

  return Math.min(delay, strategy.maxDelayMs);
}

/**
 * Add jitter to delay to prevent thundering herd
 */
export function addJitter(delay: number, jitterPercent: number = 0.1): number {
  const jitter = delay * jitterPercent;
  return delay + Math.random() * jitter - jitter / 2;
}

/**
 * Sleep utility for retry delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    strategy?: Partial<RetryStrategy>;
    callbacks?: RetryCallback;
    signal?: AbortSignal;
  } = {}
): Promise<T> {
  const strategy: RetryStrategy = {
    ...DEFAULT_RETRY_STRATEGY,
    ...options.strategy,
    retryableErrors:
      options.strategy?.retryableErrors || DEFAULT_RETRY_STRATEGY.retryableErrors,
  };

  const { callbacks, signal } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= strategy.maxRetries; attempt++) {
    // Check if operation was cancelled
    if (signal?.aborted) {
      throw new CLIError('Operation cancelled', {
        code: ErrorCode.USER_CANCELLED,
      });
    }

    try {
      const result = await fn();
      callbacks?.onSuccess?.();
      return result;
    } catch (error) {
      lastError = error;

      // Don't retry if error is not retryable
      if (!isRetryableError(error, strategy)) {
        callbacks?.onFailure?.(error as Error);
        throw error;
      }

      // Don't retry if max retries reached
      if (attempt >= strategy.maxRetries) {
        callbacks?.onFailure?.(error as Error);
        throw error;
      }

      // Calculate delay for next retry
      let delay = calculateRetryDelay(attempt + 1, strategy);

      // Handle rate limit specific delay
      if (error instanceof NetworkError && error.retryAfter) {
        delay = error.retryAfter * 1000;
      }

      // Add jitter to prevent thundering herd
      delay = addJitter(delay);

      // Notify about retry
      callbacks?.onRetry?.(attempt + 1, delay, error as Error);

      // Wait before retrying
      await sleep(delay);
    }
  }

  callbacks?.onFailure?.(lastError as Error);
  throw lastError;
}

/**
 * Retry with progress indication
 */
export async function withRetryProgress<T>(
  fn: () => Promise<T>,
  options: {
    strategy?: Partial<RetryStrategy>;
    operation?: string;
    signal?: AbortSignal;
  } = {}
): Promise<T> {
  const operation = options.operation || 'Operation';

  return withRetry(fn, {
    strategy: options.strategy,
    signal: options.signal,
    callbacks: {
      onRetry: (attempt, delay, error) => {
        const delaySeconds = Math.round(delay / 1000);
        console.error(
          `${operation} failed (attempt ${attempt}): ${(error as Error).message}`
        );
        console.error(`Retrying in ${delaySeconds}s...`);
      },
      onFailure: (error) => {
        console.error(`${operation} failed after all retries: ${error.message}`);
      },
    },
  });
}

/**
 * Retry batch of operations with individual retry logic
 */
export async function retryBatch<T>(
  operations: Array<() => Promise<T>>,
  options: {
    strategy?: Partial<RetryStrategy>;
    concurrency?: number;
  } = {}
): Promise<Array<{ success: boolean; result?: T; error?: Error }>> {
  const concurrency = options.concurrency || 5;
  const results: Array<{ success: boolean; result?: T; error?: Error }> = [];

  // Process operations in batches
  for (let i = 0; i < operations.length; i += concurrency) {
    const batch = operations.slice(i, i + concurrency);

    const batchResults = await Promise.all(
      batch.map(async (op) => {
        try {
          const result = await withRetry(op, { strategy: options.strategy });
          return { success: true, result };
        } catch (error) {
          return { success: false, error: error as Error };
        }
      })
    );

    results.push(...batchResults);
  }

  return results;
}
