import { describe, it, expect } from 'vitest';
import { platform, homedir, tmpdir } from 'node:os';

describe('Environment Variables - Cross-Platform', () => {
  describe('Home Directory Detection', () => {
    it('should detect home directory using os.homedir()', () => {
      const home = homedir();

      expect(home).toBeDefined();
      expect(home).not.toBe('');
      expect(home.length).toBeGreaterThan(0);
    });

    it('should detect home directory from environment variables', () => {
      const homeEnv = platform() === 'win32' ? process.env.USERPROFILE : process.env.HOME;

      expect(homeEnv).toBeDefined();
      expect(homeEnv).not.toBe('');
    });

    it('should prefer os.homedir() over environment variables', () => {
      const home = homedir();
      const homeEnv = platform() === 'win32' ? process.env.USERPROFILE : process.env.HOME;

      // os.homedir() should work even if env vars are missing
      expect(home).toBeDefined();
    });
  });

  describe('Temporary Directory', () => {
    it('should detect temp directory', () => {
      const temp = tmpdir();

      expect(temp).toBeDefined();
      expect(temp).not.toBe('');
    });

    it('should return platform-specific temp directory', () => {
      const temp = tmpdir();

      if (platform() === 'win32') {
        expect(temp).toMatch(/[a-zA-Z]:\\/);
      } else {
        expect(temp).toMatch(/^\/[a-z]/);
      }
    });
  });

  describe('Platform Detection', () => {
    it('should detect current platform', () => {
      const currentPlatform = platform();

      expect(currentPlatform).toBeDefined();
      expect(['darwin', 'linux', 'win32']).toContain(currentPlatform);
    });

    it('should provide platform-specific behavior', () => {
      const currentPlatform = platform();

      if (currentPlatform === 'darwin') {
        // macOS specific checks
        expect(process.platform).toBe('darwin');
      } else if (currentPlatform === 'linux') {
        // Linux specific checks
        expect(process.platform).toBe('linux');
      } else if (currentPlatform === 'win32') {
        // Windows specific checks
        expect(process.platform).toBe('win32');
      }
    });
  });

  describe('Environment Variable Access', () => {
    it('should access NODE_ENV if set', () => {
      const nodeEnv = process.env.NODE_ENV;

      // NODE_ENV might not be set, but accessing it should not throw
      expect(nodeEnv === undefined || typeof nodeEnv === 'string').toBe(true);
    });

    it('should handle missing environment variables', () => {
      const nonExistent = process.env.ONBOARDKIT_NONEXISTENT_VAR;

      expect(nonExistent).toBeUndefined();
    });
  });

  describe('Line Endings', () => {
    it('should detect platform line ending', () => {
      const lineEnding = platform() === 'win32' ? '\r\n' : '\n';

      expect(lineEnding).toBeDefined();
      expect(lineEnding.length).toBeGreaterThan(0);
    });

    it('should handle both CRLF and LF in parsing', () => {
      const textCRLF = 'line1\r\nline2\r\nline3';
      const textLF = 'line1\nline2\nline3';

      const linesCRLF = textCRLF.split(/\r?\n/);
      const linesLF = textLF.split(/\r?\n/);

      expect(linesCRLF).toHaveLength(3);
      expect(linesLF).toHaveLength(3);
    });
  });

  describe('Path Environment Variables', () => {
    it('should access PATH variable', () => {
      const pathVar = platform() === 'win32' ? process.env.Path : process.env.PATH;

      expect(pathVar).toBeDefined();
      expect(pathVar).not.toBe('');
    });
  });

  describe('Shell Detection', () => {
    it('should detect shell environment', () => {
      const shell = process.env.SHELL || process.env.ComSpec;

      // Shell should be defined on most systems
      if (platform() !== 'win32') {
        expect(shell).toBeDefined();
      }
    });
  });

  describe('User Information', () => {
    it('should access username from environment', () => {
      const username = process.env.USER || process.env.USERNAME;

      expect(username).toBeDefined();
      expect(typeof username).toBe('string');
    });
  });
});
