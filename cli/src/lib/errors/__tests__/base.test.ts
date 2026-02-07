/**
 * Tests for base error classes
 */

import { describe, it, expect } from 'vitest';
import {
  CLIError,
  ValidationError,
  GenerationError,
  FileSystemError,
  NetworkError,
  AuthenticationError,
  WorkflowError,
} from '../base.js';
import { ErrorCode, ExitCode, ErrorSeverity } from '../types.js';

describe('CLIError', () => {
  it('should create a basic CLI error', () => {
    const error = new CLIError('Test error', {
      code: ErrorCode.UNKNOWN_ERROR,
    });

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('CLIError');
    expect(error.message).toBe('Test error');
    expect(error.code).toBe(ErrorCode.UNKNOWN_ERROR);
    expect(error.exitCode).toBe(ExitCode.GENERAL_ERROR);
  });

  it('should allow custom metadata', () => {
    const error = new CLIError('Test error', {
      code: ErrorCode.FILE_NOT_FOUND,
      exitCode: ExitCode.FILE_SYSTEM_ERROR,
      severity: ErrorSeverity.HIGH,
      category: 'filesystem',
      canRetry: false,
      recoveryActions: [{ description: 'Check the file path' }],
    });

    expect(error.exitCode).toBe(ExitCode.FILE_SYSTEM_ERROR);
    expect(error.severity).toBe(ErrorSeverity.HIGH);
    expect(error.category).toBe('filesystem');
    expect(error.canRetry).toBe(false);
    expect(error.recoveryActions).toHaveLength(1);
  });

  it('should support context data', () => {
    const error = new CLIError('File not found', {
      code: ErrorCode.FILE_NOT_FOUND,
      contextData: {
        path: '/some/file.txt',
        operation: 'read',
      },
    });

    expect(error.contextData).toEqual({
      path: '/some/file.txt',
      operation: 'read',
    });
  });
});

describe('ValidationError', () => {
  it('should create a validation error with defaults', () => {
    const error = new ValidationError('Spec validation failed');

    expect(error).toBeInstanceOf(CLIError);
    expect(error.name).toBe('ValidationError');
    expect(error.code).toBe(ErrorCode.SPEC_VALIDATION_ERROR);
    expect(error.exitCode).toBe(ExitCode.VALIDATION_ERROR);
    expect(error.severity).toBe(ErrorSeverity.HIGH);
    expect(error.canRetry).toBe(false);
  });

  it('should allow metadata override', () => {
    const error = new ValidationError('Test', {
      code: ErrorCode.SPEC_PARSE_ERROR,
      canRetry: true,
    });

    expect(error.code).toBe(ErrorCode.SPEC_PARSE_ERROR);
    expect(error.canRetry).toBe(true);
  });
});

describe('GenerationError', () => {
  it('should create a generation error', () => {
    const error = new GenerationError('Template rendering failed');

    expect(error).toBeInstanceOf(CLIError);
    expect(error.name).toBe('GenerationError');
    expect(error.code).toBe(ErrorCode.GENERATION_FAILED);
    expect(error.exitCode).toBe(ExitCode.GENERATION_ERROR);
    expect(error.canRetry).toBe(true);
  });
});

describe('FileSystemError', () => {
  it('should create a filesystem error with path', () => {
    const error = new FileSystemError('File not found', '/path/to/file');

    expect(error).toBeInstanceOf(CLIError);
    expect(error.name).toBe('FileSystemError');
    expect(error.path).toBe('/path/to/file');
    expect(error.contextData?.path).toBe('/path/to/file');
  });

  it('should work without path', () => {
    const error = new FileSystemError('Disk error');

    expect(error.path).toBeUndefined();
  });
});

describe('NetworkError', () => {
  it('should create a network error', () => {
    const error = new NetworkError('Connection failed');

    expect(error).toBeInstanceOf(CLIError);
    expect(error.name).toBe('NetworkError');
    expect(error.code).toBe(ErrorCode.NETWORK_CONNECTION_FAILED);
    expect(error.canRetry).toBe(true);
  });

  it('should support URL and status code', () => {
    const error = new NetworkError('Request failed', {
      url: 'https://api.example.com',
      statusCode: 500,
    });

    expect(error.url).toBe('https://api.example.com');
    expect(error.statusCode).toBe(500);
  });

  it('should support retry-after header', () => {
    const error = new NetworkError('Rate limited', {
      statusCode: 429,
      retryAfter: 60,
    });

    expect(error.retryAfter).toBe(60);
  });
});

describe('AuthenticationError', () => {
  it('should create an authentication error', () => {
    const error = new AuthenticationError('Token expired');

    expect(error).toBeInstanceOf(CLIError);
    expect(error.name).toBe('AuthenticationError');
    expect(error.code).toBe(ErrorCode.AUTH_TOKEN_INVALID);
    expect(error.exitCode).toBe(ExitCode.AUTHENTICATION_ERROR);
    expect(error.canRetry).toBe(false);
  });

  it('should support provider name', () => {
    const error = new AuthenticationError('Auth failed', 'anthropic');

    expect(error.provider).toBe('anthropic');
    expect(error.contextData?.provider).toBe('anthropic');
  });
});

describe('WorkflowError', () => {
  it('should create a workflow error', () => {
    const error = new WorkflowError('Phase failed');

    expect(error).toBeInstanceOf(CLIError);
    expect(error.name).toBe('WorkflowError');
    expect(error.code).toBe(ErrorCode.WORKFLOW_PHASE_FAILED);
    expect(error.canRetry).toBe(true);
    expect(error.canRollback).toBe(true);
  });

  it('should support phase and checkpoint', () => {
    const error = new WorkflowError('Phase failed', {
      phase: 'validation',
      checkpoint: 'checkpoint-123',
    });

    expect(error.phase).toBe('validation');
    expect(error.checkpoint).toBe('checkpoint-123');
    expect(error.contextData?.phase).toBe('validation');
    expect(error.contextData?.checkpoint).toBe('checkpoint-123');
  });
});

describe('Error inheritance', () => {
  it('should maintain proper prototype chain', () => {
    const error = new ValidationError('Test');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(CLIError);
    expect(error).toBeInstanceOf(ValidationError);
  });

  it('should have proper stack trace', () => {
    const error = new CLIError('Test', { code: ErrorCode.UNKNOWN_ERROR });

    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('CLIError');
  });
});
