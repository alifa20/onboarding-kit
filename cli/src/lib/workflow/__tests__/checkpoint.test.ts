/**
 * Tests for checkpoint management
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  saveCheckpoint,
  loadCheckpoint,
  clearCheckpoint,
  hasCheckpoint,
  createCheckpoint,
  updateCheckpoint,
  isCheckpointValid,
  getCheckpointAge,
  formatCheckpointAge,
} from '../checkpoint.js';
import { WorkflowPhase } from '../types.js';

describe('checkpoint', () => {
  let tempDir: string;
  let specPath: string;

  beforeEach(async () => {
    // Create temp directory
    tempDir = await mkdtemp(join(tmpdir(), 'checkpoint-test-'));
    specPath = join(tempDir, 'spec.md');

    // Create dummy spec file
    await writeFile(specPath, '# Test Spec', 'utf-8');
  });

  afterEach(async () => {
    // Clean up temp directory
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('createCheckpoint', () => {
    it('should create a valid checkpoint', () => {
      const checkpoint = createCheckpoint(
        WorkflowPhase.SPEC_CHECK,
        'abc123',
        specPath,
        '/output'
      );

      expect(checkpoint.phase).toBe(WorkflowPhase.SPEC_CHECK);
      expect(checkpoint.specHash).toBe('abc123');
      expect(checkpoint.specPath).toBe(specPath);
      expect(checkpoint.outputPath).toBe('/output');
      expect(checkpoint.data).toEqual({});
      expect(checkpoint.timestamp).toBeTruthy();
    });

    it('should create checkpoint with initial data', () => {
      const checkpoint = createCheckpoint(
        WorkflowPhase.GENERATION,
        'abc123',
        specPath,
        '/output',
        { validatedSpec: { projectName: 'Test' } as any }
      );

      expect(checkpoint.data.validatedSpec).toBeTruthy();
      expect(checkpoint.data.validatedSpec?.projectName).toBe('Test');
    });
  });

  describe('updateCheckpoint', () => {
    it('should update checkpoint phase and data', () => {
      const original = createCheckpoint(
        WorkflowPhase.SPEC_CHECK,
        'abc123',
        specPath,
        '/output'
      );

      const updated = updateCheckpoint(original, WorkflowPhase.REPAIR, {
        repairedSpec: { projectName: 'Fixed' } as any,
      });

      expect(updated.phase).toBe(WorkflowPhase.REPAIR);
      expect(updated.data.repairedSpec).toBeTruthy();
      expect(updated.specHash).toBe('abc123'); // Should preserve other fields
    });

    it('should merge data without losing existing fields', () => {
      const original = createCheckpoint(
        WorkflowPhase.SPEC_CHECK,
        'abc123',
        specPath,
        '/output',
        { validatedSpec: { projectName: 'Test' } as any }
      );

      const updated = updateCheckpoint(original, WorkflowPhase.ENHANCEMENT, {
        enhancedSpec: { projectName: 'Enhanced' } as any,
      });

      expect(updated.data.validatedSpec).toBeTruthy();
      expect(updated.data.enhancedSpec).toBeTruthy();
    });
  });

  describe('saveCheckpoint and loadCheckpoint', () => {
    it('should save and load checkpoint', async () => {
      const checkpoint = createCheckpoint(
        WorkflowPhase.GENERATION,
        'abc123',
        specPath,
        '/output'
      );

      await saveCheckpoint(checkpoint);

      const loaded = await loadCheckpoint(specPath);

      expect(loaded).toBeTruthy();
      expect(loaded?.phase).toBe(checkpoint.phase);
      expect(loaded?.specHash).toBe(checkpoint.specHash);
      expect(loaded?.specPath).toBe(checkpoint.specPath);
    });

    it('should return null if no checkpoint exists', async () => {
      const loaded = await loadCheckpoint(specPath);
      expect(loaded).toBeNull();
    });

    it('should return null if checkpoint is corrupted', async () => {
      // Create checkpoint directory
      const checkpoint = createCheckpoint(
        WorkflowPhase.GENERATION,
        'abc123',
        specPath,
        '/output'
      );
      await saveCheckpoint(checkpoint);

      // Corrupt the checkpoint file
      const checkpointPath = join(tempDir, '.onboardkit', 'checkpoint.json');
      await writeFile(checkpointPath, 'invalid json{', 'utf-8');

      const loaded = await loadCheckpoint(specPath);
      expect(loaded).toBeNull();
    });
  });

  describe('clearCheckpoint', () => {
    it('should clear existing checkpoint', async () => {
      const checkpoint = createCheckpoint(
        WorkflowPhase.GENERATION,
        'abc123',
        specPath,
        '/output'
      );

      await saveCheckpoint(checkpoint);
      expect(hasCheckpoint(specPath)).toBe(true);

      await clearCheckpoint(specPath);
      expect(hasCheckpoint(specPath)).toBe(false);
    });

    it('should not throw if no checkpoint exists', async () => {
      await expect(clearCheckpoint(specPath)).resolves.not.toThrow();
    });
  });

  describe('hasCheckpoint', () => {
    it('should return true if checkpoint exists', async () => {
      const checkpoint = createCheckpoint(
        WorkflowPhase.GENERATION,
        'abc123',
        specPath,
        '/output'
      );

      await saveCheckpoint(checkpoint);
      expect(hasCheckpoint(specPath)).toBe(true);
    });

    it('should return false if checkpoint does not exist', () => {
      expect(hasCheckpoint(specPath)).toBe(false);
    });
  });

  describe('isCheckpointValid', () => {
    it('should return true for matching hash', () => {
      const checkpoint = createCheckpoint(
        WorkflowPhase.GENERATION,
        'abc123',
        specPath,
        '/output'
      );

      expect(isCheckpointValid(checkpoint, 'abc123')).toBe(true);
    });

    it('should return false for different hash', () => {
      const checkpoint = createCheckpoint(
        WorkflowPhase.GENERATION,
        'abc123',
        specPath,
        '/output'
      );

      expect(isCheckpointValid(checkpoint, 'xyz789')).toBe(false);
    });
  });

  describe('getCheckpointAge and formatCheckpointAge', () => {
    it('should calculate checkpoint age in milliseconds', () => {
      const checkpoint = createCheckpoint(
        WorkflowPhase.GENERATION,
        'abc123',
        specPath,
        '/output'
      );

      const age = getCheckpointAge(checkpoint);
      expect(age).toBeGreaterThanOrEqual(0);
      expect(age).toBeLessThan(1000); // Should be less than 1 second old
    });

    it('should format recent checkpoint as "just now"', () => {
      const checkpoint = createCheckpoint(
        WorkflowPhase.GENERATION,
        'abc123',
        specPath,
        '/output'
      );

      const formatted = formatCheckpointAge(checkpoint);
      expect(formatted).toBe('just now');
    });

    it('should format old checkpoint with days', () => {
      const checkpoint = createCheckpoint(
        WorkflowPhase.GENERATION,
        'abc123',
        specPath,
        '/output'
      );

      // Set timestamp to 2 days ago
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
      checkpoint.timestamp = twoDaysAgo;

      const formatted = formatCheckpointAge(checkpoint);
      expect(formatted).toContain('day');
    });
  });
});
