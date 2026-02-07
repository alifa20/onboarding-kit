/**
 * Tests for resume logic
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkResume, validateCheckpointData } from '../resume.js';
import { createCheckpoint, saveCheckpoint } from '../checkpoint.js';
import { WorkflowPhase } from '../types.js';

// Mock clack prompts
vi.mock('@clack/prompts', () => ({
  confirm: vi.fn().mockResolvedValue(true),
  isCancel: vi.fn().mockReturnValue(false),
  log: {
    warn: vi.fn(),
  },
}));

// Mock spec hash computation
vi.mock('../../spec/hash.js', () => ({
  computeSpecHash: vi.fn().mockResolvedValue('abc123'),
}));

describe('resume', () => {
  let tempDir: string;
  let specPath: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'resume-test-'));
    specPath = join(tempDir, 'spec.md');
    await writeFile(specPath, '# Test Spec', 'utf-8');
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('checkResume', () => {
    it('should return shouldResume=false if no checkpoint exists', async () => {
      const result = await checkResume(specPath, {});

      expect(result.shouldResume).toBe(false);
      expect(result.checkpoint).toBeNull();
      expect(result.startPhase).toBe(1);
    });

    it('should prompt user to resume if valid checkpoint exists', async () => {
      const checkpoint = createCheckpoint(
        WorkflowPhase.GENERATION,
        'abc123',
        specPath,
        '/output'
      );
      await saveCheckpoint(checkpoint);

      const result = await checkResume(specPath, {});

      expect(result.shouldResume).toBe(true);
      expect(result.checkpoint).toBeTruthy();
      expect(result.startPhase).toBe(WorkflowPhase.GENERATION);
    });

    it('should start fresh if spec hash changed', async () => {
      const checkpoint = createCheckpoint(
        WorkflowPhase.GENERATION,
        'old-hash',
        specPath,
        '/output'
      );
      await saveCheckpoint(checkpoint);

      const result = await checkResume(specPath, {});

      expect(result.shouldResume).toBe(false);
      expect(result.startPhase).toBe(1);
    });

    it('should start fresh if user declines resume', async () => {
      const { confirm } = await import('@clack/prompts');
      vi.mocked(confirm).mockResolvedValueOnce(false);

      const checkpoint = createCheckpoint(
        WorkflowPhase.GENERATION,
        'abc123',
        specPath,
        '/output'
      );
      await saveCheckpoint(checkpoint);

      const result = await checkResume(specPath, {});

      expect(result.shouldResume).toBe(false);
      expect(result.startPhase).toBe(1);
    });

    it('should start fresh if user cancels prompt', async () => {
      const { confirm, isCancel } = await import('@clack/prompts');
      const symbol = Symbol('cancel');
      vi.mocked(confirm).mockResolvedValueOnce(symbol);
      vi.mocked(isCancel).mockReturnValueOnce(true);

      const checkpoint = createCheckpoint(
        WorkflowPhase.GENERATION,
        'abc123',
        specPath,
        '/output'
      );
      await saveCheckpoint(checkpoint);

      const result = await checkResume(specPath, {});

      expect(result.shouldResume).toBe(false);
    });
  });

  describe('validateCheckpointData', () => {
    it('should validate phase 2 (spec check) data', () => {
      const checkpoint = createCheckpoint(
        WorkflowPhase.SPEC_CHECK,
        'abc123',
        specPath,
        '/output',
        { validatedSpec: { projectName: 'Test' } as any }
      );

      const result = validateCheckpointData(checkpoint);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should invalidate phase 2 without spec data', () => {
      const checkpoint = createCheckpoint(
        WorkflowPhase.SPEC_CHECK,
        'abc123',
        specPath,
        '/output'
      );

      const result = validateCheckpointData(checkpoint);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing spec validation data');
    });

    it('should validate phase 3 (repair) data', () => {
      const checkpoint = createCheckpoint(
        WorkflowPhase.REPAIR,
        'abc123',
        specPath,
        '/output',
        {
          validationErrors: [{ path: 'test', message: 'error' }],
          repairedSpec: { projectName: 'Test' } as any,
        }
      );

      const result = validateCheckpointData(checkpoint);

      expect(result.valid).toBe(true);
    });

    it('should invalidate phase 3 with errors but no repair', () => {
      const checkpoint = createCheckpoint(
        WorkflowPhase.REPAIR,
        'abc123',
        specPath,
        '/output',
        { validationErrors: [{ path: 'test', message: 'error' }] }
      );

      const result = validateCheckpointData(checkpoint);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing repair data');
    });

    it('should validate phase 5 (generation) data', () => {
      const checkpoint = createCheckpoint(
        WorkflowPhase.GENERATION,
        'abc123',
        specPath,
        '/output',
        { generatedFiles: { 'test.ts': 'content' } }
      );

      const result = validateCheckpointData(checkpoint);

      expect(result.valid).toBe(true);
    });

    it('should invalidate phase 5 without generated files', () => {
      const checkpoint = createCheckpoint(
        WorkflowPhase.GENERATION,
        'abc123',
        specPath,
        '/output'
      );

      const result = validateCheckpointData(checkpoint);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing generated files');
    });

    it('should validate phase 7 (finalize) data', () => {
      const checkpoint = createCheckpoint(
        WorkflowPhase.FINALIZE,
        'abc123',
        specPath,
        '/output',
        { generatedFiles: { 'test.ts': 'content' } }
      );

      const result = validateCheckpointData(checkpoint);

      expect(result.valid).toBe(true);
    });

    it('should allow phase 4 (enhancement) without enhanced spec', () => {
      const checkpoint = createCheckpoint(
        WorkflowPhase.ENHANCEMENT,
        'abc123',
        specPath,
        '/output',
        { validatedSpec: { projectName: 'Test' } as any }
      );

      const result = validateCheckpointData(checkpoint);

      expect(result.valid).toBe(true);
    });
  });
});
