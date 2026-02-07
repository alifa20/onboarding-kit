/**
 * Tests for metadata tracking
 */

import { describe, it, expect } from 'vitest';
import {
  computeChecksum,
  determineFileType,
  createFileMetadata,
  createOutputManifest,
  verifyChecksum,
  groupFilesByType,
  calculateManifestStats,
} from '../metadata.js';

describe('Metadata', () => {
  describe('computeChecksum', () => {
    it('should compute consistent checksums', () => {
      const content = 'Hello, World!';
      const checksum1 = computeChecksum(content);
      const checksum2 = computeChecksum(content);

      expect(checksum1).toBe(checksum2);
      expect(checksum1).toHaveLength(64); // SHA-256 hex length
    });

    it('should produce different checksums for different content', () => {
      const checksum1 = computeChecksum('Content 1');
      const checksum2 = computeChecksum('Content 2');

      expect(checksum1).not.toBe(checksum2);
    });
  });

  describe('determineFileType', () => {
    it('should identify screen files', () => {
      expect(determineFileType('screens/Welcome.tsx')).toBe('screen');
      expect(determineFileType('screens/Login.tsx')).toBe('screen');
    });

    it('should identify theme files', () => {
      expect(determineFileType('theme/colors.ts')).toBe('theme');
      expect(determineFileType('theme/typography.ts')).toBe('theme');
    });

    it('should identify component files', () => {
      expect(determineFileType('components/Button.tsx')).toBe('component');
    });

    it('should identify navigation files', () => {
      expect(determineFileType('navigation/Navigator.tsx')).toBe('navigation');
    });

    it('should identify config files', () => {
      expect(determineFileType('index.ts')).toBe('config');
      expect(determineFileType('config.json')).toBe('config');
    });

    it('should categorize unknown files as other', () => {
      expect(determineFileType('random/file.ts')).toBe('other');
    });
  });

  describe('createFileMetadata', () => {
    it('should create metadata with all fields', () => {
      const content = 'Test content';
      const metadata = createFileMetadata('/test/output/file.ts', content, '/test/output');

      expect(metadata.path).toBe('/test/output/file.ts');
      expect(metadata.relativePath).toBe('file.ts');
      expect(metadata.size).toBeGreaterThan(0);
      expect(metadata.checksum).toHaveLength(64);
      expect(metadata.timestamp).toBeTruthy();
      expect(metadata.type).toBe('other');
    });

    it('should include template name if provided', () => {
      const metadata = createFileMetadata(
        '/test/output/screen.tsx',
        'content',
        '/test/output',
        'welcome-template'
      );

      expect(metadata.template).toBe('welcome-template');
    });
  });

  describe('createOutputManifest', () => {
    it('should create manifest with correct totals', () => {
      const files = [
        createFileMetadata('/test/file1.ts', 'Content 1', '/test'),
        createFileMetadata('/test/file2.ts', 'Content 2', '/test'),
      ];

      const manifest = createOutputManifest('/test/output', files);

      expect(manifest.version).toBe('1.0.0');
      expect(manifest.outputDirectory).toBe('/test/output');
      expect(manifest.totalFiles).toBe(2);
      expect(manifest.totalSize).toBeGreaterThan(0);
      expect(manifest.files).toHaveLength(2);
      expect(manifest.generatedAt).toBeTruthy();
    });
  });

  describe('verifyChecksum', () => {
    it('should verify correct checksums', () => {
      const content = 'Test content';
      const checksum = computeChecksum(content);

      expect(verifyChecksum(content, checksum)).toBe(true);
    });

    it('should reject incorrect checksums', () => {
      const content = 'Test content';
      const wrongChecksum = computeChecksum('Different content');

      expect(verifyChecksum(content, wrongChecksum)).toBe(false);
    });
  });

  describe('groupFilesByType', () => {
    it('should group files correctly', () => {
      const files = [
        createFileMetadata('/test/screens/Welcome.tsx', 'content', '/test'),
        createFileMetadata('/test/screens/Login.tsx', 'content', '/test'),
        createFileMetadata('/test/theme/colors.ts', 'content', '/test'),
        createFileMetadata('/test/components/Button.tsx', 'content', '/test'),
      ];

      const groups = groupFilesByType(files);

      expect(groups.screen).toHaveLength(2);
      expect(groups.theme).toHaveLength(1);
      expect(groups.component).toHaveLength(1);
      expect(groups.navigation).toHaveLength(0);
    });
  });

  describe('calculateManifestStats', () => {
    it('should calculate correct statistics', () => {
      const files = [
        createFileMetadata('/test/screens/Welcome.tsx', 'A'.repeat(100), '/test'),
        createFileMetadata('/test/screens/Login.tsx', 'B'.repeat(200), '/test'),
        createFileMetadata('/test/theme/colors.ts', 'C'.repeat(50), '/test'),
      ];

      const manifest = createOutputManifest('/test/output', files);
      const stats = calculateManifestStats(manifest);

      expect(stats.totalFiles).toBe(3);
      expect(stats.screenCount).toBe(2);
      expect(stats.themeCount).toBe(1);
      expect(stats.componentCount).toBe(0);
      expect(stats.avgFileSize).toBeGreaterThan(0);
    });

    it('should handle empty manifest', () => {
      const manifest = createOutputManifest('/test/output', []);
      const stats = calculateManifestStats(manifest);

      expect(stats.totalFiles).toBe(0);
      expect(stats.avgFileSize).toBe(0);
    });
  });
});
