/**
 * Tests for output logger
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OutputLogger, LogLevel, createLogger, formatDuration } from '../logger.js';

describe('Output Logger', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('OutputLogger', () => {
    it('should create logger with default config', () => {
      const logger = new OutputLogger();

      expect(logger).toBeDefined();
    });

    it('should respect verbose mode', () => {
      const logger = new OutputLogger({ verbose: true });

      logger.debug('Debug message');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should skip debug messages when not verbose', () => {
      const logger = new OutputLogger({ verbose: false });

      logger.debug('Debug message');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should log info messages', () => {
      const logger = new OutputLogger();

      logger.info('Info message');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log warning messages', () => {
      const logger = new OutputLogger();

      logger.warn('Warning message');
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should log error messages', () => {
      const logger = new OutputLogger();

      logger.error('Error message');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should respect min log level', () => {
      const logger = new OutputLogger({ minLevel: LogLevel.ERROR });

      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should include timestamps when enabled', () => {
      const logger = new OutputLogger({ timestamps: true });

      logger.info('Test message');

      expect(consoleLogSpy).toHaveBeenCalled();
      const call = consoleLogSpy.mock.calls[0][0];
      expect(call).toContain('s]');
    });

    it('should skip timestamps when disabled', () => {
      const logger = new OutputLogger({ timestamps: false });

      logger.info('Test message');

      expect(consoleLogSpy).toHaveBeenCalled();
      const call = consoleLogSpy.mock.calls[0][0];
      expect(call).not.toContain('[');
    });
  });

  describe('Specialized logging methods', () => {
    it('should log file write operations', () => {
      const logger = new OutputLogger({ verbose: true });

      logger.fileWrite('/path/to/file.ts', 1024);

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log directory creation', () => {
      const logger = new OutputLogger({ verbose: true });

      logger.directoryCreate('/path/to/dir');

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log permission changes', () => {
      const logger = new OutputLogger({ verbose: true });

      logger.permissionChange('/path/to/file', 0o644);

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log validation results', () => {
      const logger = new OutputLogger({ verbose: true });

      logger.validation('TypeScript check', true);
      logger.validation('Syntax check', false);

      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
    });

    it('should log operations', () => {
      const logger = new OutputLogger({ verbose: true });

      logger.operationStart('Test operation');
      logger.operationComplete('Test operation', 1000);

      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
    });

    it('should log operation errors', () => {
      const logger = new OutputLogger();
      const error = new Error('Test error');

      logger.operationError('Test operation', error);

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should log JSON data in verbose mode', () => {
      const logger = new OutputLogger({ verbose: true });
      const data = { key: 'value', nested: { prop: 123 } };

      logger.json('Test data', data);

      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('Timer methods', () => {
    it('should track elapsed time', () => {
      const logger = new OutputLogger();

      const elapsed = logger.getElapsed();
      expect(elapsed).toBeGreaterThanOrEqual(0);
    });

    it('should reset timer', () => {
      const logger = new OutputLogger();

      // Wait a bit
      const before = logger.getElapsed();

      logger.resetTimer();

      const after = logger.getElapsed();
      expect(after).toBeLessThan(before + 10); // Should be close to 0
    });
  });

  describe('Child logger', () => {
    it('should create child logger with same config', () => {
      const parent = new OutputLogger({ verbose: true });
      const child = parent.child('context');

      expect(child).toBeDefined();
      expect(child).toBeInstanceOf(OutputLogger);
    });
  });

  describe('createLogger', () => {
    it('should create logger with verbose flag', () => {
      const logger = createLogger(true);

      expect(logger).toBeInstanceOf(OutputLogger);
    });

    it('should create non-verbose logger by default', () => {
      const logger = createLogger();

      logger.debug('Debug message');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('formatDuration', () => {
    it('should format milliseconds', () => {
      expect(formatDuration(500)).toBe('500ms');
      expect(formatDuration(999)).toBe('999ms');
    });

    it('should format seconds', () => {
      expect(formatDuration(1000)).toBe('1.00s');
      expect(formatDuration(5500)).toBe('5.50s');
      expect(formatDuration(59000)).toBe('59.00s');
    });

    it('should format minutes', () => {
      expect(formatDuration(60000)).toBe('1m 0s');
      expect(formatDuration(90000)).toBe('1m 30s');
      expect(formatDuration(125000)).toBe('2m 5s');
    });
  });
});
