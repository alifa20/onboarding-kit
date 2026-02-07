/**
 * Tests for retry logic
 */

import { describe, it, expect, vi } from 'vitest';
import {
  isRetryableError,
  calculateRetryDelay,
  addJitter,
  withRetry,
  withRetryProgress,
  DEFAULT_RETRY_STRATEGY,
} from '../retry.js';
import { CLIError, NetworkError, AuthenticationError } from '../base.js';
import { ErrorCode } from '../types.js';

describe('isRetryableError', () => {
  it('should identify retryable network errors', () => {
    const error = new NetworkError('Connection failed');
    expect(isRetryableError(error)).toBe(true);
  });

  it('should not retry authentication errors', () => {
    const error = new AuthenticationError('Token expired');
    expect(isRetryableError(error)).toBe(false);
  });

  it('should not retry user cancellation', () => {
    const error = new CLIError('Cancelled', {
      code: ErrorCode.USER_CANCELLED,
    });
    expect(isRetryableError(error)).toBe(false);
  });

  it('should respect canRetry flag', () => {
    const error = new CLIError('Test', {
      code: ErrorCode.NETWORK_CONNECTION_FAILED,
      canRetry: false,
    });
    expect(isRetryableError(error)).toBe(false);
  });

  it('should check error code against strategy', () => {
    const error = new CLIError('Test', {
      code: ErrorCode.NETWORK_TIMEOUT,
      canRetry: true,
    });
    expect(isRetryableError(error)).toBe(true);
  });
});

describe('calculateRetryDelay', () => {
  it('should calculate exponential backoff', () => {
    expect(calculateRetryDelay(1)).toBe(1000);
    expect(calculateRetryDelay(2)).toBe(2000);
    expect(calculateRetryDelay(3)).toBe(4000);
  });

  it('should respect max delay', () => {
    expect(calculateRetryDelay(10)).toBe(8000); // capped at maxDelayMs
  });

  it('should use custom strategy', () => {
    const strategy = {
      ...DEFAULT_RETRY_STRATEGY,
      initialDelayMs: 500,
      backoffMultiplier: 3,
    };

    expect(calculateRetryDelay(1, strategy)).toBe(500);
    expect(calculateRetryDelay(2, strategy)).toBe(1500);
    expect(calculateRetryDelay(3, strategy)).toBe(4500);
  });
});

describe('addJitter', () => {
  it('should add jitter to delay', () => {
    const delay = 1000;
    const jittered = addJitter(delay, 0.1);

    expect(jittered).toBeGreaterThanOrEqual(900);
    expect(jittered).toBeLessThanOrEqual(1100);
  });

  it('should use default jitter percent', () => {
    const delay = 1000;
    const jittered = addJitter(delay);

    expect(jittered).toBeGreaterThanOrEqual(900);
    expect(jittered).toBeLessThanOrEqual(1100);
  });
});

describe('withRetry', () => {
  it('should succeed on first try', async () => {
    const fn = vi.fn().mockResolvedValue('success');

    const result = await withRetry(fn);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on retryable error', async () => {
    const error = new NetworkError('Connection failed');
    const fn = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockRejectedValueOnce(error)
      .mockResolvedValue('success');

    const result = await withRetry(fn, {
      strategy: { ...DEFAULT_RETRY_STRATEGY, initialDelayMs: 10 },
    });

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should not retry on non-retryable error', async () => {
    const error = new AuthenticationError('Token invalid');
    const fn = vi.fn().mockRejectedValue(error);

    await expect(withRetry(fn)).rejects.toThrow(error);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should fail after max retries', async () => {
    const error = new NetworkError('Connection failed');
    const fn = vi.fn().mockRejectedValue(error);

    await expect(
      withRetry(fn, {
        strategy: { ...DEFAULT_RETRY_STRATEGY, maxRetries: 2, initialDelayMs: 10 },
      })
    ).rejects.toThrow(error);

    expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it('should call callbacks', async () => {
    const onRetry = vi.fn();
    const onSuccess = vi.fn();
    const onFailure = vi.fn();

    const error = new NetworkError('Connection failed');
    const fn = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue('success');

    await withRetry(fn, {
      strategy: { ...DEFAULT_RETRY_STRATEGY, initialDelayMs: 10 },
      callbacks: { onRetry, onSuccess, onFailure },
    });

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onFailure).not.toHaveBeenCalled();
  });

  it('should handle abort signal', async () => {
    const controller = new AbortController();
    const fn = vi.fn().mockImplementation(async () => {
      controller.abort();
      throw new NetworkError('Connection failed');
    });

    await expect(
      withRetry(fn, {
        signal: controller.signal,
        strategy: { ...DEFAULT_RETRY_STRATEGY, initialDelayMs: 10 },
      })
    ).rejects.toThrow('Operation cancelled');

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should respect retry-after for rate limits', async () => {
    const error = new NetworkError('Rate limited', {
      statusCode: 429,
      retryAfter: 1, // 1 second
    });

    const fn = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue('success');

    const start = Date.now();
    await withRetry(fn, {
      strategy: { ...DEFAULT_RETRY_STRATEGY, initialDelayMs: 10 },
    });
    const elapsed = Date.now() - start;

    // Should wait at least 1 second (from retryAfter)
    expect(elapsed).toBeGreaterThanOrEqual(900);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('withRetryProgress', () => {
  it('should retry with console output', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new NetworkError('Connection failed');
    const fn = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue('success');

    const result = await withRetryProgress(fn, {
      strategy: { ...DEFAULT_RETRY_STRATEGY, initialDelayMs: 10 },
      operation: 'Test operation',
    });

    expect(result).toBe('success');
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('Test operation failed')
    );

    consoleError.mockRestore();
  });
});
