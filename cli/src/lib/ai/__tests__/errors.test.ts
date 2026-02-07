import { describe, it, expect, vi } from 'vitest';
import {
  AIError,
  AIRateLimitError,
  AIAuthenticationError,
  AINetworkError,
  AITimeoutError,
  isRetryableError,
  calculateRetryDelay,
  withRetry,
  DEFAULT_RETRY_STRATEGY,
  wrapFetchError,
  handleHTTPError,
} from '../errors.js';

describe('AI Errors', () => {
  describe('Error Classes', () => {
    it('should create AIError with message and code', () => {
      const error = new AIError('Test error', 'TEST_CODE', 'test-provider');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.provider).toBe('test-provider');
      expect(error.name).toBe('AIError');
    });

    it('should create AIRateLimitError with retry-after', () => {
      const error = new AIRateLimitError('Rate limited', 60);
      expect(error.message).toBe('Rate limited');
      expect(error.retryAfter).toBe(60);
      expect(error.code).toBe('RATE_LIMIT');
      expect(error.name).toBe('AIRateLimitError');
    });

    it('should create AIAuthenticationError', () => {
      const error = new AIAuthenticationError('Auth failed');
      expect(error.message).toBe('Auth failed');
      expect(error.code).toBe('AUTHENTICATION');
      expect(error.name).toBe('AIAuthenticationError');
    });

    it('should create AINetworkError', () => {
      const error = new AINetworkError('Network error');
      expect(error.message).toBe('Network error');
      expect(error.code).toBe('NETWORK');
      expect(error.name).toBe('AINetworkError');
    });

    it('should create AITimeoutError', () => {
      const error = new AITimeoutError('Timeout');
      expect(error.message).toBe('Timeout');
      expect(error.code).toBe('TIMEOUT');
      expect(error.name).toBe('AITimeoutError');
    });
  });

  describe('isRetryableError', () => {
    it('should return true for rate limit errors', () => {
      const error = new AIRateLimitError('Rate limited');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for network errors', () => {
      const error = new AINetworkError('Network error');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for timeout errors', () => {
      const error = new AITimeoutError('Timeout');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return false for authentication errors', () => {
      const error = new AIAuthenticationError('Auth failed');
      expect(isRetryableError(error)).toBe(false);
    });

    it('should return false for generic errors', () => {
      const error = new Error('Generic error');
      expect(isRetryableError(error)).toBe(false);
    });
  });

  describe('calculateRetryDelay', () => {
    it('should calculate exponential backoff', () => {
      const strategy = DEFAULT_RETRY_STRATEGY;

      expect(calculateRetryDelay(1, strategy)).toBe(1000); // 1s
      expect(calculateRetryDelay(2, strategy)).toBe(2000); // 2s
      expect(calculateRetryDelay(3, strategy)).toBe(4000); // 4s
      expect(calculateRetryDelay(4, strategy)).toBe(8000); // 8s (max)
      expect(calculateRetryDelay(5, strategy)).toBe(8000); // Still 8s (capped)
    });

    it('should respect custom strategy', () => {
      const customStrategy = {
        maxRetries: 2,
        initialDelayMs: 500,
        maxDelayMs: 2000,
        backoffMultiplier: 3,
      };

      expect(calculateRetryDelay(1, customStrategy)).toBe(500);
      expect(calculateRetryDelay(2, customStrategy)).toBe(1500);
      expect(calculateRetryDelay(3, customStrategy)).toBe(2000); // Capped
    });
  });

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const result = await withRetry(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable error', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new AINetworkError('Network error'))
        .mockResolvedValue('success');

      const result = await withRetry(fn, {
        maxRetries: 1,
        initialDelayMs: 10,
        maxDelayMs: 10,
        backoffMultiplier: 1,
      });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-retryable error', async () => {
      const error = new AIAuthenticationError('Auth failed');
      const fn = vi.fn().mockRejectedValue(error);

      await expect(
        withRetry(fn, {
          maxRetries: 3,
          initialDelayMs: 10,
          maxDelayMs: 10,
          backoffMultiplier: 1,
        })
      ).rejects.toThrow(error);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should give up after max retries', async () => {
      const error = new AINetworkError('Network error');
      const fn = vi.fn().mockRejectedValue(error);

      await expect(
        withRetry(fn, {
          maxRetries: 2,
          initialDelayMs: 10,
          maxDelayMs: 10,
          backoffMultiplier: 1,
        })
      ).rejects.toThrow(error);

      expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('wrapFetchError', () => {
    it('should wrap network errors', () => {
      const error = new Error('fetch failed');
      const wrapped = wrapFetchError(error, 'test-provider');

      expect(wrapped).toBeInstanceOf(AINetworkError);
      expect(wrapped.message).toContain('Network error');
    });

    it('should wrap timeout errors', () => {
      const error = new Error('Request timeout');
      const wrapped = wrapFetchError(error, 'test-provider');

      expect(wrapped).toBeInstanceOf(AITimeoutError);
      expect(wrapped.message).toContain('timed out');
    });

    it('should wrap unknown errors', () => {
      const error = new Error('Unknown error');
      const wrapped = wrapFetchError(error, 'test-provider');

      expect(wrapped).toBeInstanceOf(AIError);
      expect(wrapped.provider).toBe('test-provider');
    });
  });

  describe('handleHTTPError', () => {
    it('should handle 401 as authentication error', () => {
      const error = handleHTTPError(401, 'Unauthorized', 'test-provider');
      expect(error).toBeInstanceOf(AIAuthenticationError);
    });

    it('should handle 429 as rate limit error', () => {
      const error = handleHTTPError(429, 'Too Many Requests', 'test-provider');
      expect(error).toBeInstanceOf(AIRateLimitError);
    });

    it('should handle 500 as network error', () => {
      const error = handleHTTPError(500, 'Internal Server Error', 'test-provider');
      expect(error).toBeInstanceOf(AINetworkError);
    });

    it('should handle other status codes as generic error', () => {
      const error = handleHTTPError(400, 'Bad Request', 'test-provider');
      expect(error).toBeInstanceOf(AIError);
      expect(error.code).toBe('HTTP_400');
    });
  });
});
