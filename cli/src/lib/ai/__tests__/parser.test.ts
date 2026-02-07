import { describe, it, expect } from 'vitest';
import {
  parseValidationResponse,
  parseRepairResponse,
  parseEnhancementResponse,
  safeParseResponse,
} from '../parser.js';
import { AIParseError } from '../types.js';

describe('AI Response Parser', () => {
  describe('parseValidationResponse', () => {
    it('should parse valid JSON response', () => {
      const response = JSON.stringify({
        isValid: true,
        issues: [],
        suggestions: ['Consider adding more details'],
      });

      const result = parseValidationResponse(response);

      expect(result.isValid).toBe(true);
      expect(result.issues).toEqual([]);
      expect(result.suggestions).toEqual(['Consider adding more details']);
    });

    it('should parse response with markdown code block', () => {
      const response = '```json\n{"isValid": false, "issues": []}\n```';

      const result = parseValidationResponse(response);

      expect(result.isValid).toBe(false);
      expect(result.issues).toEqual([]);
    });

    it('should parse response with issues', () => {
      const response = JSON.stringify({
        isValid: false,
        issues: [
          {
            severity: 'error',
            path: 'welcome.headline',
            message: 'Headline is too short',
            suggestion: 'Make it more descriptive',
          },
        ],
      });

      const result = parseValidationResponse(response);

      expect(result.isValid).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].severity).toBe('error');
      expect(result.issues[0].path).toBe('welcome.headline');
    });

    it('should throw on missing isValid field', () => {
      const response = JSON.stringify({
        issues: [],
      });

      expect(() => parseValidationResponse(response)).toThrow(AIParseError);
    });

    it('should throw on invalid issue structure', () => {
      const response = JSON.stringify({
        isValid: false,
        issues: [
          {
            // Missing severity
            path: 'test',
            message: 'Test',
          },
        ],
      });

      expect(() => parseValidationResponse(response)).toThrow(AIParseError);
    });

    it('should throw on malformed JSON', () => {
      const response = 'not valid json';

      expect(() => parseValidationResponse(response)).toThrow(AIParseError);
    });
  });

  describe('parseRepairResponse', () => {
    it('should parse valid repair response', () => {
      const response = JSON.stringify({
        repairedSpec: {
          projectName: 'Test App',
          config: {
            platform: 'expo',
            navigation: 'react-navigation',
            styling: 'stylesheet',
          },
          theme: {
            primary: '#FF5733',
            secondary: '#33FF57',
            background: '#FFFFFF',
            surface: '#F5F5F5',
            text: '#000000',
            textSecondary: '#666666',
            error: '#FF0000',
            success: '#00FF00',
            font: 'System',
            borderRadius: 8,
          },
          welcome: {
            headline: 'Welcome',
            subtext: 'Get started',
            image: 'welcome.png',
            cta: 'Continue',
          },
          onboardingSteps: [
            {
              title: 'Step 1',
              headline: 'First Step',
              subtext: 'Description',
              image: 'step1.png',
            },
          ],
          login: {
            methods: ['email'],
            headline: 'Login',
          },
          nameCapture: {
            headline: 'Your Name',
            fields: ['first_name'],
            cta: 'Continue',
          },
        },
        changes: [
          {
            path: 'welcome.headline',
            before: 'Hi',
            after: 'Welcome',
            reason: 'More descriptive',
          },
        ],
        explanation: 'Fixed headline',
      });

      const result = parseRepairResponse(response);

      expect(result.repairedSpec.projectName).toBe('Test App');
      expect(result.changes).toHaveLength(1);
      expect(result.explanation).toBe('Fixed headline');
    });

    it('should throw if repaired spec is invalid', () => {
      const response = JSON.stringify({
        repairedSpec: {
          // Invalid spec - missing required fields
          projectName: 'Test',
        },
        changes: [],
        explanation: 'Test',
      });

      expect(() => parseRepairResponse(response)).toThrow(AIParseError);
    });

    it('should throw on missing explanation', () => {
      const response = JSON.stringify({
        repairedSpec: {},
        changes: [],
        // Missing explanation
      });

      expect(() => parseRepairResponse(response)).toThrow(AIParseError);
    });
  });

  describe('parseEnhancementResponse', () => {
    it('should parse valid enhancement response', () => {
      const response = JSON.stringify({
        enhancedSpec: {
          projectName: 'Test App',
          config: {
            platform: 'expo',
            navigation: 'react-navigation',
            styling: 'stylesheet',
          },
          theme: {
            primary: '#FF5733',
            secondary: '#33FF57',
            background: '#FFFFFF',
            surface: '#F5F5F5',
            text: '#000000',
            textSecondary: '#666666',
            error: '#FF0000',
            success: '#00FF00',
            font: 'System',
            borderRadius: 8,
          },
          welcome: {
            headline: 'Welcome to Your Journey',
            subtext: 'Get started with amazing features',
            image: 'welcome.png',
            cta: 'Begin Your Journey',
          },
          onboardingSteps: [
            {
              title: 'Step 1',
              headline: 'First Step',
              subtext: 'Description',
              image: 'step1.png',
            },
          ],
          login: {
            methods: ['email'],
            headline: 'Login',
          },
          nameCapture: {
            headline: 'Your Name',
            fields: ['first_name'],
            cta: 'Continue',
          },
        },
        enhancements: [
          {
            path: 'welcome.headline',
            before: 'Welcome',
            after: 'Welcome to Your Journey',
            type: 'headline',
          },
          {
            path: 'welcome.cta',
            before: 'Continue',
            after: 'Begin Your Journey',
            type: 'cta',
          },
        ],
        explanation: 'Enhanced headlines and CTAs',
      });

      const result = parseEnhancementResponse(response);

      expect(result.enhancedSpec.projectName).toBe('Test App');
      expect(result.enhancements).toHaveLength(2);
      expect(result.enhancements[0].type).toBe('headline');
      expect(result.explanation).toBe('Enhanced headlines and CTAs');
    });

    it('should throw if enhanced spec is invalid', () => {
      const response = JSON.stringify({
        enhancedSpec: {
          // Invalid spec
          projectName: 'Test',
        },
        enhancements: [],
        explanation: 'Test',
      });

      expect(() => parseEnhancementResponse(response)).toThrow(AIParseError);
    });

    it('should throw on invalid enhancement type', () => {
      const response = JSON.stringify({
        enhancedSpec: {
          projectName: 'Test App',
          config: {
            platform: 'expo',
            navigation: 'react-navigation',
            styling: 'stylesheet',
          },
          theme: {
            primary: '#FF5733',
            secondary: '#33FF57',
            background: '#FFFFFF',
            surface: '#F5F5F5',
            text: '#000000',
            textSecondary: '#666666',
            error: '#FF0000',
            success: '#00FF00',
            font: 'System',
            borderRadius: 8,
          },
          welcome: {
            headline: 'Welcome',
            subtext: 'Get started',
            image: 'welcome.png',
            cta: 'Continue',
          },
          onboardingSteps: [
            {
              title: 'Step 1',
              headline: 'First Step',
              subtext: 'Description',
              image: 'step1.png',
            },
          ],
          login: {
            methods: ['email'],
            headline: 'Login',
          },
          nameCapture: {
            headline: 'Your Name',
            fields: ['first_name'],
            cta: 'Continue',
          },
        },
        enhancements: [
          {
            path: 'test',
            before: 'old',
            after: 'new',
            type: 'invalid-type', // Invalid
          },
        ],
        explanation: 'Test',
      });

      expect(() => parseEnhancementResponse(response)).toThrow(AIParseError);
    });
  });

  describe('safeParseResponse', () => {
    it('should parse successfully', () => {
      const parser = (content: string) => JSON.parse(content);
      const result = safeParseResponse('{"test": true}', parser, 'test');

      expect(result).toEqual({ test: true });
    });

    it('should wrap parse errors', () => {
      const parser = () => {
        throw new AIParseError('Parse failed');
      };

      expect(() => safeParseResponse('invalid', parser, 'test')).toThrow(
        'Failed to parse test response from AI'
      );
    });
  });
});
