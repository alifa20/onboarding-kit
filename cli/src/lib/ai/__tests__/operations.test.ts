import { describe, it, expect, beforeEach } from 'vitest';
import { validateSpecWithAI, formatValidationResult } from '../operations/validate.js';
import { repairSpec, formatRepairResult, getRepairSummary } from '../operations/repair.js';
import {
  enhanceSpec,
  formatEnhancementResult,
  getEnhancementSummary,
} from '../operations/enhance.js';
import { OnboardingSpec, ValidationError } from '../../spec/schema.js';
import {
  MockAIProvider,
  createMockValidationResponse,
  createMockRepairResponse,
  createMockEnhancementResponse,
} from './mock-provider.js';

const mockSpec: OnboardingSpec = {
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
};

const mockValidationErrors: ValidationError[] = [
  {
    path: ['welcome', 'headline'],
    message: 'Headline is required',
    code: 'required',
  },
];

describe('AI Operations', () => {
  let mockProvider: MockAIProvider;

  beforeEach(() => {
    mockProvider = new MockAIProvider();
  });

  describe('validateSpecWithAI', () => {
    it('should validate spec successfully', async () => {
      mockProvider.setMockResponse('validation', createMockValidationResponse(true));

      const result = await validateSpecWithAI(mockSpec, { provider: mockProvider });

      expect(result.validation.isValid).toBe(true);
      expect(result.validation.issues).toHaveLength(0);
      expect(result.context.messages.length).toBeGreaterThan(0);
    });

    it('should return validation issues', async () => {
      mockProvider.setMockResponse('validation', createMockValidationResponse(false));

      const result = await validateSpecWithAI(mockSpec, { provider: mockProvider });

      expect(result.validation.isValid).toBe(false);
      expect(result.validation.issues.length).toBeGreaterThan(0);
    });

    it('should include schema errors in prompt', async () => {
      mockProvider.setMockResponse('validation', createMockValidationResponse(true));

      await validateSpecWithAI(mockSpec, {
        provider: mockProvider,
        schemaErrors: mockValidationErrors,
      });

      const history = mockProvider.getCallHistory();
      const lastCall = history[history.length - 1];
      const userMessage = lastCall.messages.find((m) => m.role === 'user');

      expect(userMessage?.content).toContain('Schema validation');
      expect(userMessage?.content).toContain('Headline is required');
    });

    it('should maintain conversation context', async () => {
      mockProvider.setMockResponse('validation', createMockValidationResponse(true));

      const result = await validateSpecWithAI(mockSpec, { provider: mockProvider });

      expect(result.context.metadata.lastOperation).toBe('validate');
      expect(result.context.messages.length).toBeGreaterThan(0);
    });
  });

  describe('formatValidationResult', () => {
    it('should format valid result', () => {
      const result = {
        isValid: true,
        issues: [],
        suggestions: ['Great job!'],
      };

      const formatted = formatValidationResult(result);

      expect(formatted).toContain('✓');
      expect(formatted).toContain('valid');
      expect(formatted).toContain('Great job!');
    });

    it('should format invalid result with errors', () => {
      const result = {
        isValid: false,
        issues: [
          {
            severity: 'error' as const,
            path: 'test.field',
            message: 'Test error',
            suggestion: 'Fix it',
          },
        ],
        suggestions: [],
      };

      const formatted = formatValidationResult(result);

      expect(formatted).toContain('✗');
      expect(formatted).toContain('Errors:');
      expect(formatted).toContain('test.field');
      expect(formatted).toContain('Test error');
    });
  });

  describe('repairSpec', () => {
    it('should repair spec successfully', async () => {
      mockProvider.setMockResponse('repair', createMockRepairResponse());

      const result = await repairSpec(mockSpec, mockValidationErrors, {
        provider: mockProvider,
      });

      expect(result.repair.repairedSpec).toBeDefined();
      expect(result.repair.repairedSpec.projectName).toBe('Test App');
      expect(result.repair.changes.length).toBeGreaterThan(0);
    });

    it('should maintain conversation context', async () => {
      mockProvider.setMockResponse('repair', createMockRepairResponse());

      const result = await repairSpec(mockSpec, mockValidationErrors, {
        provider: mockProvider,
      });

      expect(result.context.metadata.lastOperation).toBe('repair');
    });

    it('should include validation errors in prompt', async () => {
      mockProvider.setMockResponse('repair', createMockRepairResponse());

      await repairSpec(mockSpec, mockValidationErrors, { provider: mockProvider });

      const history = mockProvider.getCallHistory();
      const lastCall = history[history.length - 1];
      const userMessage = lastCall.messages.find((m) => m.role === 'user');

      expect(userMessage?.content).toContain('Validation errors');
      expect(userMessage?.content).toContain('welcome.headline');
    });
  });

  describe('formatRepairResult', () => {
    it('should format repair result', () => {
      const result = {
        repairedSpec: mockSpec,
        changes: [
          {
            path: 'welcome.headline',
            before: 'Old',
            after: 'New',
            reason: 'Better',
          },
        ],
        explanation: 'Fixed the headline',
      };

      const formatted = formatRepairResult(result);

      expect(formatted).toContain('✓');
      expect(formatted).toContain('repaired');
      expect(formatted).toContain('welcome.headline');
      expect(formatted).toContain('Fixed the headline');
    });
  });

  describe('getRepairSummary', () => {
    it('should return summary for single change', () => {
      const result = {
        repairedSpec: mockSpec,
        changes: [
          {
            path: 'welcome.headline',
            before: 'Old',
            after: 'New',
            reason: 'Better',
          },
        ],
        explanation: 'Fixed',
      };

      const summary = getRepairSummary(result);

      expect(summary).toContain('1 field');
      expect(summary).toContain('welcome.headline');
    });

    it('should return summary for multiple changes', () => {
      const result = {
        repairedSpec: mockSpec,
        changes: [
          {
            path: 'field1',
            before: 'Old',
            after: 'New',
            reason: 'Better',
          },
          {
            path: 'field2',
            before: 'Old',
            after: 'New',
            reason: 'Better',
          },
        ],
        explanation: 'Fixed',
      };

      const summary = getRepairSummary(result);

      expect(summary).toContain('2 fields');
    });
  });

  describe('enhanceSpec', () => {
    it('should enhance spec successfully', async () => {
      mockProvider.setMockResponse('enhancement', createMockEnhancementResponse());

      const result = await enhanceSpec(mockSpec, { provider: mockProvider });

      expect(result.enhancement.enhancedSpec).toBeDefined();
      expect(result.enhancement.enhancements.length).toBeGreaterThan(0);
    });

    it('should maintain conversation context', async () => {
      mockProvider.setMockResponse('enhancement', createMockEnhancementResponse());

      const result = await enhanceSpec(mockSpec, { provider: mockProvider });

      expect(result.context.metadata.lastOperation).toBe('enhance');
    });

    it('should use higher temperature for creativity', async () => {
      mockProvider.setMockResponse('enhancement', createMockEnhancementResponse());

      await enhanceSpec(mockSpec, { provider: mockProvider });

      const history = mockProvider.getCallHistory();
      const lastCall = history[history.length - 1];

      expect(lastCall.options?.temperature).toBeGreaterThan(0.5);
    });
  });

  describe('formatEnhancementResult', () => {
    it('should format enhancement result', () => {
      const result = {
        enhancedSpec: mockSpec,
        enhancements: [
          {
            path: 'welcome.headline',
            before: 'Old',
            after: 'New Amazing Headline',
            type: 'headline' as const,
          },
        ],
        explanation: 'Enhanced the headline',
      };

      const formatted = formatEnhancementResult(result);

      expect(formatted).toContain('✓');
      expect(formatted).toContain('enhanced');
      expect(formatted).toContain('welcome.headline');
    });

    it('should group enhancements by type', () => {
      const result = {
        enhancedSpec: mockSpec,
        enhancements: [
          {
            path: 'welcome.headline',
            before: 'Old',
            after: 'New',
            type: 'headline' as const,
          },
          {
            path: 'welcome.cta',
            before: 'Old',
            after: 'New',
            type: 'cta' as const,
          },
        ],
        explanation: 'Enhanced',
      };

      const formatted = formatEnhancementResult(result);

      expect(formatted).toContain('Headlines');
      expect(formatted).toContain('Ctas');
    });
  });

  describe('getEnhancementSummary', () => {
    it('should return summary for enhancements', () => {
      const result = {
        enhancedSpec: mockSpec,
        enhancements: [
          {
            path: 'welcome.headline',
            before: 'Old',
            after: 'New',
            type: 'headline' as const,
          },
          {
            path: 'welcome.cta',
            before: 'Old',
            after: 'New',
            type: 'cta' as const,
          },
        ],
        explanation: 'Enhanced',
      };

      const summary = getEnhancementSummary(result);

      expect(summary).toContain('2 field');
      expect(summary).toContain('headline');
      expect(summary).toContain('cta');
    });
  });
});
