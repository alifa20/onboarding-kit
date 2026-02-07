/**
 * Tests for error middleware
 */

import { describe, it, expect, vi } from 'vitest';
import {
  formatError,
  getExitCode,
  fromNodeError,
  withFileSystemErrors,
} from '../middleware.js';
import { CLIError, FileSystemError, NetworkError } from '../base.js';
import { ErrorCode, ExitCode } from '../types.js';

describe('formatError', () => {
  it('should format CLI error', () => {
    const error = new CLIError('Test error', {
      code: ErrorCode.FILE_NOT_FOUND,
    });

    const formatted = formatError(error);

    expect(formatted).toContain('Test error');
    expect(formatted).toContain('✗');
  });

  it('should format generic error', () => {
    const error = new Error('Generic error');

    const formatted = formatError(error);

    expect(formatted).toContain('Generic error');
  });

  it('should include context in verbose mode', () => {
    const error = new CLIError('Test error', {
      code: ErrorCode.FILE_NOT_FOUND,
      contextData: { path: '/test/file' },
    });

    const formatted = formatError(error, { verbose: true });

    expect(formatted).toContain('Error Details');
    expect(formatted).toContain('/test/file');
  });

  it('should include stack trace when requested', () => {
    const error = new Error('Test error');

    const formatted = formatError(error, { showStack: true });

    expect(formatted).toContain('Stack Trace');
  });
});

describe('getExitCode', () => {
  it('should return exit code from CLI error', () => {
    const error = new CLIError('Test', {
      code: ErrorCode.FILE_NOT_FOUND,
      exitCode: ExitCode.FILE_SYSTEM_ERROR,
    });

    expect(getExitCode(error)).toBe(ExitCode.FILE_SYSTEM_ERROR);
  });

  it('should infer exit code from error message', () => {
    const error = new Error('File not found (ENOENT)');
    expect(getExitCode(error)).toBe(ExitCode.FILE_SYSTEM_ERROR);
  });

  it('should return general error code for unknown errors', () => {
    const error = new Error('Unknown error');
    expect(getExitCode(error)).toBe(ExitCode.GENERAL_ERROR);
  });

  it('should detect network errors', () => {
    const error = new Error('Network timeout occurred');
    expect(getExitCode(error)).toBe(ExitCode.NETWORK_ERROR);
  });
});

describe('fromNodeError', () => {
  it('should convert ENOENT error', () => {
    const nodeError = Object.assign(new Error('File not found'), {
      code: 'ENOENT',
      errno: -2,
      syscall: 'open',
      path: '/test/file',
    } as NodeJS.ErrnoException);

    const cliError = fromNodeError(nodeError);

    expect(cliError).toBeInstanceOf(CLIError);
    expect(cliError.code).toBe(ErrorCode.FILE_NOT_FOUND);
    expect(cliError.exitCode).toBe(ExitCode.FILE_SYSTEM_ERROR);
    expect(cliError.message).toContain('/test/file');
  });

  it('should convert EACCES error', () => {
    const nodeError = Object.assign(new Error('Permission denied'), {
      code: 'EACCES',
      path: '/test/file',
    } as NodeJS.ErrnoException);

    const cliError = fromNodeError(nodeError);

    expect(cliError.code).toBe(ErrorCode.FILE_ACCESS_DENIED);
    expect(cliError.message).toContain('Permission denied');
  });

  it('should convert EEXIST error', () => {
    const nodeError = Object.assign(new Error('File exists'), {
      code: 'EEXIST',
      path: '/test/file',
    } as NodeJS.ErrnoException);

    const cliError = fromNodeError(nodeError);

    expect(cliError.code).toBe(ErrorCode.FILE_ALREADY_EXISTS);
  });

  it('should convert ENOSPC error', () => {
    const nodeError = Object.assign(new Error('No space left'), {
      code: 'ENOSPC',
    } as NodeJS.ErrnoException);

    const cliError = fromNodeError(nodeError);

    expect(cliError.code).toBe(ErrorCode.NO_SPACE_LEFT);
  });

  it('should convert EMFILE error', () => {
    const nodeError = Object.assign(new Error('Too many open files'), {
      code: 'EMFILE',
    } as NodeJS.ErrnoException);

    const cliError = fromNodeError(nodeError);

    expect(cliError.code).toBe(ErrorCode.TOO_MANY_OPEN_FILES);
  });

  it('should handle unknown error codes', () => {
    const nodeError = Object.assign(new Error('Unknown error'), {
      code: 'EUNKNOWN',
      errno: -999,
    } as NodeJS.ErrnoException);

    const cliError = fromNodeError(nodeError);

    expect(cliError.code).toBe(ErrorCode.UNKNOWN_ERROR);
    expect(cliError.contextData?.code).toBe('EUNKNOWN');
  });

  it('should use provided path over error path', () => {
    const nodeError = Object.assign(new Error('Error'), {
      code: 'ENOENT',
      path: '/wrong/path',
    } as NodeJS.ErrnoException);

    const cliError = fromNodeError(nodeError, '/correct/path');

    expect(cliError.message).toContain('/correct/path');
    expect(cliError.contextData?.path).toBe('/correct/path');
  });
});

describe('withFileSystemErrors', () => {
  it('should pass through successful operations', async () => {
    const result = await withFileSystemErrors(async () => 'success');

    expect(result).toBe('success');
  });

  it('should convert Node.js errors to CLI errors', async () => {
    const nodeError = Object.assign(new Error('File not found'), {
      code: 'ENOENT',
      path: '/test/file',
    } as NodeJS.ErrnoException);

    const operation = async () => {
      throw nodeError;
    };

    await expect(withFileSystemErrors(operation, '/test/file')).rejects.toThrow(
      CLIError
    );
  });

  it('should pass through non-Node errors', async () => {
    const error = new Error('Custom error');

    const operation = async () => {
      throw error;
    };

    await expect(withFileSystemErrors(operation)).rejects.toThrow(error);
  });

  it('should use provided path in conversion', async () => {
    const nodeError = Object.assign(new Error('Error'), {
      code: 'ENOENT',
    } as NodeJS.ErrnoException);

    const operation = async () => {
      throw nodeError;
    };

    try {
      await withFileSystemErrors(operation, '/custom/path');
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(CLIError);
      if (error instanceof CLIError) {
        expect(error.message).toContain('/custom/path');
      }
    }
  });
});
