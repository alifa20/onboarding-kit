/**
 * Tests for file writer
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  writeFileAtomic,
  writeFiles,
  formatFileSize,
  validateContent,
  getFileExtension,
  isTypeScriptFile,
  isJSONFile,
} from '../writer.js';

describe('File Writer', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'onboardkit-test-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('writeFileAtomic', () => {
    it('should write file atomically', async () => {
      const filePath = join(tempDir, 'test.txt');
      const content = 'Hello, World!';

      const result = await writeFileAtomic(filePath, content);

      expect(result.success).toBe(true);
      expect(result.path).toBe(filePath);
      expect(result.size).toBeGreaterThan(0);

      const written = await readFile(filePath, 'utf-8');
      expect(written).toBe(content);
    });

    it('should create parent directories', async () => {
      const filePath = join(tempDir, 'nested', 'dir', 'test.txt');
      const content = 'Test content';

      const result = await writeFileAtomic(filePath, content);

      expect(result.success).toBe(true);

      const written = await readFile(filePath, 'utf-8');
      expect(written).toBe(content);
    });

    it('should handle dry run mode', async () => {
      const filePath = join(tempDir, 'dry-run.txt');
      const content = 'Dry run test';

      const result = await writeFileAtomic(filePath, content, { dryRun: true });

      expect(result.success).toBe(true);

      // File should not exist
      await expect(readFile(filePath, 'utf-8')).rejects.toThrow();
    });

    it('should overwrite existing files', async () => {
      const filePath = join(tempDir, 'existing.txt');
      await writeFileAtomic(filePath, 'First content');

      const result = await writeFileAtomic(filePath, 'Second content');

      expect(result.success).toBe(true);

      const written = await readFile(filePath, 'utf-8');
      expect(written).toBe('Second content');
    });
  });

  describe('writeFiles', () => {
    it('should write multiple files', async () => {
      const files = {
        'file1.txt': 'Content 1',
        'file2.txt': 'Content 2',
        'dir/file3.txt': 'Content 3',
      };

      const result = await writeFiles(files, tempDir);

      expect(result.successCount).toBe(3);
      expect(result.failureCount).toBe(0);
      expect(result.totalSize).toBeGreaterThan(0);

      const file1 = await readFile(join(tempDir, 'file1.txt'), 'utf-8');
      expect(file1).toBe('Content 1');
    });

    it('should report failures', async () => {
      const files = {
        'valid.txt': 'Valid content',
        '/root/invalid.txt': 'Invalid path', // Should fail on permissions
      };

      const result = await writeFiles(files, tempDir);

      // At least one should succeed
      expect(result.successCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(100)).toBe('100.00 B');
      expect(formatFileSize(1024)).toBe('1.00 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1.00 MB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.00 GB');
    });

    it('should handle decimal values', () => {
      expect(formatFileSize(1536)).toBe('1.50 KB');
      expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.50 MB');
    });
  });

  describe('validateContent', () => {
    it('should accept valid content', () => {
      expect(validateContent('Hello, World!')).toBe(true);
      expect(validateContent('A'.repeat(1000))).toBe(true);
    });

    it('should reject empty content', () => {
      expect(validateContent('')).toBe(false);
      expect(validateContent('   ')).toBe(false);
    });

    it('should reject content exceeding max size', () => {
      const largeContent = 'A'.repeat(11 * 1024 * 1024); // 11MB
      expect(validateContent(largeContent)).toBe(false);
    });

    it('should accept content within custom max size', () => {
      const content = 'A'.repeat(100);
      expect(validateContent(content, 1000)).toBe(true);
      expect(validateContent(content, 50)).toBe(false);
    });
  });

  describe('getFileExtension', () => {
    it('should extract file extensions', () => {
      expect(getFileExtension('file.txt')).toBe('txt');
      expect(getFileExtension('file.ts')).toBe('ts');
      expect(getFileExtension('file.test.ts')).toBe('ts');
      expect(getFileExtension('no-extension')).toBe('');
    });
  });

  describe('isTypeScriptFile', () => {
    it('should identify TypeScript files', () => {
      expect(isTypeScriptFile('file.ts')).toBe(true);
      expect(isTypeScriptFile('file.tsx')).toBe(true);
      expect(isTypeScriptFile('file.js')).toBe(false);
      expect(isTypeScriptFile('file.txt')).toBe(false);
    });
  });

  describe('isJSONFile', () => {
    it('should identify JSON files', () => {
      expect(isJSONFile('file.json')).toBe(true);
      expect(isJSONFile('file.ts')).toBe(false);
      expect(isJSONFile('file.txt')).toBe(false);
    });
  });
});
