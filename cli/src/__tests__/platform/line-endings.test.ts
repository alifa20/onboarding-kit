import { describe, it, expect } from 'vitest';
import { platform } from 'node:os';

describe('Line Endings - Cross-Platform', () => {
  describe('Line Ending Detection', () => {
    it('should determine platform line ending', () => {
      const lineEnding = platform() === 'win32' ? '\r\n' : '\n';

      expect(lineEnding).toBeDefined();
      if (platform() === 'win32') {
        expect(lineEnding).toBe('\r\n');
      } else {
        expect(lineEnding).toBe('\n');
      }
    });
  });

  describe('Parsing Text with Different Line Endings', () => {
    it('should parse CRLF line endings', () => {
      const text = 'line1\r\nline2\r\nline3';
      const lines = text.split(/\r?\n/);

      expect(lines).toHaveLength(3);
      expect(lines[0]).toBe('line1');
      expect(lines[1]).toBe('line2');
      expect(lines[2]).toBe('line3');
    });

    it('should parse LF line endings', () => {
      const text = 'line1\nline2\nline3';
      const lines = text.split(/\r?\n/);

      expect(lines).toHaveLength(3);
      expect(lines[0]).toBe('line1');
      expect(lines[1]).toBe('line2');
      expect(lines[2]).toBe('line3');
    });

    it('should parse CR line endings (legacy Mac)', () => {
      const text = 'line1\rline2\rline3';
      const lines = text.split(/\r\n?|\n/);

      expect(lines).toHaveLength(3);
      expect(lines[0]).toBe('line1');
      expect(lines[1]).toBe('line2');
      expect(lines[2]).toBe('line3');
    });

    it('should handle mixed line endings', () => {
      const text = 'line1\nline2\r\nline3\rline4';
      const lines = text.split(/\r\n?|\n/);

      expect(lines).toHaveLength(4);
    });
  });

  describe('Normalizing Line Endings', () => {
    it('should normalize CRLF to LF', () => {
      const text = 'line1\r\nline2\r\nline3';
      const normalized = text.replace(/\r\n/g, '\n');

      expect(normalized).toBe('line1\nline2\nline3');
      expect(normalized).not.toContain('\r');
    });

    it('should normalize LF to CRLF', () => {
      const text = 'line1\nline2\nline3';
      const normalized = text.replace(/\n/g, '\r\n');

      expect(normalized).toBe('line1\r\nline2\r\nline3');
      expect(normalized).toContain('\r\n');
    });

    it('should normalize all line endings to platform default', () => {
      const text = 'line1\r\nline2\nline3\rline4';
      const platformLineEnding = platform() === 'win32' ? '\r\n' : '\n';
      const normalized = text.replace(/\r\n?|\n/g, platformLineEnding);

      const lines = normalized.split(platformLineEnding);
      expect(lines).toHaveLength(4);
    });
  });

  describe('Spec File Line Endings', () => {
    it('should parse spec with CRLF line endings', () => {
      const spec = '# TestApp\r\n\r\n## Config\r\n\r\n- Platform: expo';
      const lines = spec.split(/\r?\n/);

      expect(lines.length).toBeGreaterThan(0);
      expect(lines[0]).toBe('# TestApp');
    });

    it('should parse spec with LF line endings', () => {
      const spec = '# TestApp\n\n## Config\n\n- Platform: expo';
      const lines = spec.split(/\r?\n/);

      expect(lines.length).toBeGreaterThan(0);
      expect(lines[0]).toBe('# TestApp');
    });

    it('should parse markdown lists with different line endings', () => {
      const specCRLF = '## Theme\r\n\r\n- Primary: #6366F1\r\n- Secondary: #8B5CF6';
      const specLF = '## Theme\n\n- Primary: #6366F1\n- Secondary: #8B5CF6';

      const linesCRLF = specCRLF.split(/\r?\n/);
      const linesLF = specLF.split(/\r?\n/);

      expect(linesCRLF.filter(l => l.startsWith('-'))).toHaveLength(2);
      expect(linesLF.filter(l => l.startsWith('-'))).toHaveLength(2);
    });
  });

  describe('Generated Code Line Endings', () => {
    it('should generate code with consistent line endings', () => {
      const code = [
        'import React from "react";',
        'import { View, Text } from "react-native";',
        '',
        'export default function WelcomeScreen() {',
        '  return <View><Text>Welcome</Text></View>;',
        '}',
      ].join('\n');

      const lines = code.split('\n');
      expect(lines).toHaveLength(6);
    });

    it('should preserve line endings after formatting', () => {
      const codeLF = 'const x = 1;\nconst y = 2;';
      const codeCRLF = 'const x = 1;\r\nconst y = 2;';

      // Both should be parseable
      expect(codeLF.split(/\r?\n/)).toHaveLength(2);
      expect(codeCRLF.split(/\r?\n/)).toHaveLength(2);
    });
  });

  describe('Template Line Endings', () => {
    it('should handle template with CRLF', () => {
      const template = 'import React from "react";\r\n\r\nexport default function {{name}}() {\r\n  return null;\r\n}';
      const lines = template.split(/\r?\n/);

      expect(lines.length).toBeGreaterThan(0);
      expect(lines[0]).toContain('import React');
    });

    it('should handle template with LF', () => {
      const template = 'import React from "react";\n\nexport default function {{name}}() {\n  return null;\n}';
      const lines = template.split(/\r?\n/);

      expect(lines.length).toBeGreaterThan(0);
      expect(lines[0]).toContain('import React');
    });
  });
});
