/**
 * Tests for recovery strategies
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  CheckpointRecovery,
  CleanupRecovery,
  PermissionRecovery,
  NetworkRecovery,
  RecoveryManager,
  createRecoveryContext,
} from '../recovery.js';
import { WorkflowError, FileSystemError, NetworkError } from '../base.js';
import { ErrorCode } from '../types.js';

describe('CheckpointRecovery', () => {
  const strategy = new CheckpointRecovery();
  let tempDir: string;

  beforeEach(async () => {
    tempDir = join(tmpdir(), `onboardkit-test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should identify workflow errors', () => {
    const error = new WorkflowError('Phase failed', {
      checkpoint: 'test-checkpoint',
    });
    expect(strategy.canRecover(error)).toBe(true);
  });

  it('should not handle non-workflow errors', () => {
    const error = new FileSystemError('File not found');
    expect(strategy.canRecover(error)).toBe(false);
  });

  it('should find existing checkpoint', async () => {
    const checkpointPath = join(tempDir, 'test-checkpoint.json');
    await fs.writeFile(checkpointPath, JSON.stringify({}));

    const error = new WorkflowError('Phase failed', {
      checkpoint: 'test-checkpoint',
    });

    const result = await strategy.recover(error, {
      checkpointDirectory: tempDir,
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('Can resume');
  });

  it('should handle missing checkpoint', async () => {
    const error = new WorkflowError('Phase failed', {
      checkpoint: 'missing-checkpoint',
    });

    const result = await strategy.recover(error, {
      checkpointDirectory: tempDir,
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain('not found');
    expect(result.actions).toBeDefined();
  });
});

describe('CleanupRecovery', () => {
  const strategy = new CleanupRecovery();
  let tempDir: string;

  beforeEach(async () => {
    tempDir = join(tmpdir(), `onboardkit-test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should identify file exists errors', () => {
    const error = new FileSystemError('File exists', '/path', {
      code: ErrorCode.FILE_ALREADY_EXISTS,
    });
    expect(strategy.canRecover(error)).toBe(true);
  });

  it('should suggest cleanup for existing file', async () => {
    const filePath = join(tempDir, 'test.txt');
    await fs.writeFile(filePath, 'content');

    const error = new FileSystemError('File exists', filePath, {
      code: ErrorCode.FILE_ALREADY_EXISTS,
    });

    const result = await strategy.recover(error, {
      workingDirectory: tempDir,
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain('Manual cleanup');
    expect(result.actions).toBeDefined();
    expect(result.actions?.some((a) => a.includes('rm -rf'))).toBe(true);
  });

  it('should handle non-existent path', async () => {
    const filePath = join(tempDir, 'missing.txt');

    const error = new FileSystemError('File exists', filePath, {
      code: ErrorCode.FILE_ALREADY_EXISTS,
    });

    const result = await strategy.recover(error, {
      workingDirectory: tempDir,
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('does not exist');
  });
});

describe('PermissionRecovery', () => {
  const strategy = new PermissionRecovery();

  it('should identify permission errors', () => {
    const error = new FileSystemError('Access denied', '/path', {
      code: ErrorCode.FILE_ACCESS_DENIED,
    });
    expect(strategy.canRecover(error)).toBe(true);
  });

  it('should suggest permission fixes', async () => {
    const error = new FileSystemError('Access denied', '/etc/hosts', {
      code: ErrorCode.FILE_ACCESS_DENIED,
    });

    const result = await strategy.recover(error, {});

    // May succeed or fail depending on permissions, but should provide actions
    expect(result.actions).toBeDefined();
    expect(result.actions?.some((a) => a.includes('chmod'))).toBe(true);
  });
});

describe('NetworkRecovery', () => {
  const strategy = new NetworkRecovery();

  it('should identify network errors', () => {
    const error = new NetworkError('Connection failed');
    expect(strategy.canRecover(error)).toBe(true);
  });

  it('should indicate automatic retry', async () => {
    const error = new NetworkError('Connection failed');

    const result = await strategy.recover(error, {});

    expect(result.success).toBe(true);
    expect(result.message).toContain('retried automatically');
    expect(result.actions).toBeDefined();
  });
});

describe('RecoveryManager', () => {
  it('should try all strategies', async () => {
    const manager = new RecoveryManager();
    const error = new NetworkError('Connection failed');

    const result = await manager.tryRecover(error, {});

    expect(result.success).toBe(true);
  });

  it('should return no strategy for unknown errors', async () => {
    const manager = new RecoveryManager();
    const error = new Error('Unknown error');

    const result = await manager.tryRecover(error, {});

    expect(result.success).toBe(false);
    expect(result.message).toContain('No recovery strategy');
  });

  it('should allow custom strategies', async () => {
    const manager = new RecoveryManager();

    const customStrategy = {
      canRecover: (error: Error) => error.message === 'Custom error',
      recover: async () => ({
        success: true,
        message: 'Custom recovery',
      }),
    };

    manager.addStrategy(customStrategy);

    const error = new Error('Custom error');
    const result = await manager.tryRecover(error, {});

    expect(result.success).toBe(true);
    expect(result.message).toBe('Custom recovery');
  });
});

describe('createRecoveryContext', () => {
  it('should create context from options', () => {
    const context = createRecoveryContext({
      cwd: '/working',
      output: '/output',
      checkpoint: '/checkpoint',
      verbose: true,
    });

    expect(context.workingDirectory).toBe('/working');
    expect(context.outputDirectory).toBe('/output');
    expect(context.checkpointDirectory).toBe('/checkpoint');
    expect(context.verbose).toBe(true);
  });

  it('should use defaults', () => {
    const context = createRecoveryContext({});

    expect(context.workingDirectory).toBe(process.cwd());
    expect(context.verbose).toBeUndefined();
  });
});
