import { describe, it, expect } from 'vitest';
import { join, resolve, normalize, sep } from 'node:path';
import { platform } from 'node:os';

describe('Path Handling - Cross-Platform', () => {
  describe('Path Normalization', () => {
    it('should normalize paths correctly', () => {
      const testPath = join('foo', 'bar', 'baz');
      expect(testPath).toBeDefined();
      expect(testPath).not.toContain('//');
    });

    it('should resolve absolute paths', () => {
      const relativePath = join('foo', 'bar');
      const absolutePath = resolve(relativePath);

      expect(absolutePath).toBeDefined();
      expect(absolutePath.length).toBeGreaterThan(relativePath.length);
    });

    it('should handle mixed separators', () => {
      const mixedPath = 'foo/bar\\baz';
      const normalizedPath = normalize(mixedPath);

      expect(normalizedPath).toBeDefined();
      // Should use platform-specific separator
      if (platform() === 'win32') {
        expect(normalizedPath).toContain('\\');
      } else {
        expect(normalizedPath).toContain('/');
      }
    });
  });

  describe('Path Separators', () => {
    it('should use correct separator for platform', () => {
      const testPath = join('foo', 'bar', 'baz');

      if (platform() === 'win32') {
        expect(testPath).toContain('\\');
      } else {
        expect(testPath).toContain('/');
      }
    });

    it('should not create paths with double separators', () => {
      const path1 = join('foo', 'bar');
      const path2 = join(path1, 'baz');

      expect(path2).not.toMatch(/[/\\]{2,}/);
    });
  });

  describe('Home Directory', () => {
    it('should resolve home directory path', () => {
      const homeEnv = platform() === 'win32' ? 'USERPROFILE' : 'HOME';
      const homeDir = process.env[homeEnv];

      expect(homeDir).toBeDefined();
      expect(homeDir).not.toBe('');
    });

    it('should create config paths in home directory', () => {
      const homeEnv = platform() === 'win32' ? 'USERPROFILE' : 'HOME';
      const homeDir = process.env[homeEnv];
      const configPath = join(homeDir || '', '.onboardkit', 'config.json');

      expect(configPath).toContain('.onboardkit');
      expect(configPath).toContain('config.json');
    });
  });

  describe('Output Directory Paths', () => {
    it('should create output paths with screens subdirectory', () => {
      const outputDir = 'onboardkit-output';
      const screensDir = join(outputDir, 'screens');

      expect(screensDir).toContain('onboardkit-output');
      expect(screensDir).toContain('screens');
    });

    it('should create nested directory paths', () => {
      const basePath = 'onboardkit-output';
      const nestedPath = join(basePath, 'screens', 'WelcomeScreen.tsx');

      expect(nestedPath).toContain('onboardkit-output');
      expect(nestedPath).toContain('screens');
      expect(nestedPath).toContain('WelcomeScreen.tsx');
    });
  });

  describe('Template Paths', () => {
    it('should resolve template paths correctly', () => {
      const templatePath = join('templates', 'expo', 'screens', 'WelcomeScreen.tsx.hbs');

      expect(templatePath).toContain('templates');
      expect(templatePath).toContain('expo');
      expect(templatePath).toContain('screens');
      expect(templatePath).toContain('WelcomeScreen.tsx.hbs');
    });

    it('should handle relative template paths', () => {
      const relativePath = join('..', 'templates', 'expo');
      const resolved = resolve(relativePath);

      expect(resolved).toBeDefined();
      expect(resolved).toContain('templates');
    });
  });

  describe('File Extensions', () => {
    it('should preserve file extensions in paths', () => {
      const filePath = join('screens', 'WelcomeScreen.tsx');

      expect(filePath).toContain('.tsx');
    });

    it('should handle double extensions', () => {
      const templatePath = join('templates', 'WelcomeScreen.tsx.hbs');

      expect(templatePath).toContain('.tsx.hbs');
    });
  });
});
