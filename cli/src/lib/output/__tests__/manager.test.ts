/**
 * Tests for output manager
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createOutputDirectory,
  ensureOutputDirectory,
  validateDirectoryPermissions,
  directoryExists,
  DirectoryExistsError,
  DirectoryPermissionError,
} from '../manager.js';

describe('Output Manager', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'onboardkit-test-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('createOutputDirectory', () => {
    it('should create all standard directories', async () => {
      const outputPath = join(tempDir, 'output');
      const result = await createOutputDirectory(outputPath);

      expect(result.structure.root).toBe(outputPath);
      expect(result.created.length).toBeGreaterThan(0);
      expect(result.errors).toHaveLength(0);

      // Verify directories exist
      await access(result.structure.screens);
      await access(result.structure.theme);
      await access(result.structure.components);
      await access(result.structure.navigation);
      await access(result.structure.metadata);
    });

    it('should skip existing directories', async () => {
      const outputPath = join(tempDir, 'output');

      // Create first time
      const result1 = await createOutputDirectory(outputPath);
      expect(result1.created.length).toBeGreaterThan(0);

      // Create second time with overwrite
      const result2 = await createOutputDirectory(outputPath, { overwrite: true });
      expect(result2.skipped.length).toBeGreaterThan(0);
    });

    it('should throw error if directory exists without overwrite', async () => {
      const outputPath = join(tempDir, 'output');

      await createOutputDirectory(outputPath);

      await expect(createOutputDirectory(outputPath)).rejects.toThrow(DirectoryExistsError);
    });

    it('should handle dry run mode', async () => {
      const outputPath = join(tempDir, 'dry-run');
      const result = await createOutputDirectory(outputPath, { dryRun: true });

      expect(result.created.length).toBeGreaterThan(0);

      // Directories should not actually exist
      const exists = await directoryExists(outputPath);
      expect(exists).toBe(false);
    });
  });

  describe('ensureOutputDirectory', () => {
    it('should create and validate directory', async () => {
      const outputPath = join(tempDir, 'ensure-test');
      const structure = await ensureOutputDirectory(outputPath);

      expect(structure.root).toBe(outputPath);

      // Verify directories exist
      await access(structure.screens);
      await access(structure.theme);
    });

    it('should validate permissions', async () => {
      const outputPath = join(tempDir, 'permission-test');
      await ensureOutputDirectory(outputPath);

      // Should not throw
      await expect(validateDirectoryPermissions(outputPath)).resolves.not.toThrow();
    });
  });

  describe('directoryExists', () => {
    it('should return true for existing directory', async () => {
      const exists = await directoryExists(tempDir);
      expect(exists).toBe(true);
    });

    it('should return false for non-existing directory', async () => {
      const exists = await directoryExists(join(tempDir, 'non-existent'));
      expect(exists).toBe(false);
    });

    it('should return false for files', async () => {
      // directoryExists should return false for files
      const exists = await directoryExists(join(tempDir, 'some-file.txt'));
      expect(exists).toBe(false);
    });
  });

  describe('validateDirectoryPermissions', () => {
    it('should validate readable and writable directory', async () => {
      await expect(validateDirectoryPermissions(tempDir)).resolves.not.toThrow();
    });

    it('should throw error for non-existent directory', async () => {
      const nonExistent = join(tempDir, 'non-existent');

      await expect(validateDirectoryPermissions(nonExistent)).rejects.toThrow(
        DirectoryPermissionError
      );
    });
  });

  describe('Error classes', () => {
    it('should create DirectoryExistsError', () => {
      const error = new DirectoryExistsError('/test/path');

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('DirectoryExistsError');
      expect(error.path).toBe('/test/path');
      expect(error.message).toContain('/test/path');
    });

    it('should create DirectoryPermissionError', () => {
      const error = new DirectoryPermissionError('/test/path', 'read');

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('DirectoryPermissionError');
      expect(error.path).toBe('/test/path');
      expect(error.operation).toBe('read');
      expect(error.message).toContain('read');
    });
  });
});
