import { describe, it, expect } from 'vitest';
import {
  VALIDATION_SYSTEM_PROMPT,
  REPAIR_SYSTEM_PROMPT,
  ENHANCEMENT_SYSTEM_PROMPT,
  createValidationPrompt,
  createRepairPrompt,
  createEnhancementPrompt,
  getSystemPrompt,
} from '../prompts/index.js';
import { OnboardingSpec, ValidationError } from '../../spec/schema.js';

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

describe('AI Prompts', () => {
  describe('System Prompts', () => {
    it('should have validation system prompt', () => {
      expect(VALIDATION_SYSTEM_PROMPT).toContain('validate');
      expect(VALIDATION_SYSTEM_PROMPT).toContain('JSON');
      expect(VALIDATION_SYSTEM_PROMPT).toContain('isValid');
    });

    it('should have repair system prompt', () => {
      expect(REPAIR_SYSTEM_PROMPT).toContain('repair');
      expect(REPAIR_SYSTEM_PROMPT).toContain('repairedSpec');
      expect(REPAIR_SYSTEM_PROMPT).toContain('changes');
    });

    it('should have enhancement system prompt', () => {
      expect(ENHANCEMENT_SYSTEM_PROMPT).toContain('enhance');
      expect(ENHANCEMENT_SYSTEM_PROMPT).toContain('enhancedSpec');
      expect(ENHANCEMENT_SYSTEM_PROMPT).toContain('enhancements');
    });
  });

  describe('createValidationPrompt', () => {
    it('should create prompt with spec', () => {
      const prompt = createValidationPrompt(mockSpec);

      expect(prompt).toContain('validate');
      expect(prompt).toContain('Test App');
      expect(prompt).toContain('```json');
    });

    it('should include validation errors if provided', () => {
      const prompt = createValidationPrompt(mockSpec, mockValidationErrors);

      expect(prompt).toContain('Schema validation');
      expect(prompt).toContain('welcome.headline');
      expect(prompt).toContain('Headline is required');
    });

    it('should work without validation errors', () => {
      const prompt = createValidationPrompt(mockSpec);

      expect(prompt).not.toContain('Schema validation');
      expect(prompt).toContain('Test App');
    });
  });

  describe('createRepairPrompt', () => {
    it('should create prompt with spec and errors', () => {
      const prompt = createRepairPrompt(mockSpec, mockValidationErrors);

      expect(prompt).toContain('repair');
      expect(prompt).toContain('Validation errors');
      expect(prompt).toContain('welcome.headline');
      expect(prompt).toContain('Headline is required');
      expect(prompt).toContain('```json');
    });

    it('should format multiple errors', () => {
      const errors: ValidationError[] = [
        {
          path: ['welcome', 'headline'],
          message: 'Error 1',
          code: 'error1',
        },
        {
          path: ['login', 'methods'],
          message: 'Error 2',
          code: 'error2',
        },
      ];

      const prompt = createRepairPrompt(mockSpec, errors);

      expect(prompt).toContain('welcome.headline');
      expect(prompt).toContain('Error 1');
      expect(prompt).toContain('login.methods');
      expect(prompt).toContain('Error 2');
    });
  });

  describe('createEnhancementPrompt', () => {
    it('should create prompt with spec', () => {
      const prompt = createEnhancementPrompt(mockSpec);

      expect(prompt).toContain('enhance');
      expect(prompt).toContain('Test App');
      expect(prompt).toContain('Headlines');
      expect(prompt).toContain('CTAs');
      expect(prompt).toContain('```json');
    });

    it('should include project name', () => {
      const prompt = createEnhancementPrompt(mockSpec);

      expect(prompt).toContain('Project: Test App');
    });

    it('should mention improvement areas', () => {
      const prompt = createEnhancementPrompt(mockSpec);

      expect(prompt).toContain('Headlines');
      expect(prompt).toContain('Subtext');
      expect(prompt).toContain('CTAs');
      expect(prompt).toContain('Features');
    });
  });

  describe('getSystemPrompt', () => {
    it('should return validation prompt for validate operation', () => {
      const prompt = getSystemPrompt('validate');
      expect(prompt).toBe(VALIDATION_SYSTEM_PROMPT);
    });

    it('should return repair prompt for repair operation', () => {
      const prompt = getSystemPrompt('repair');
      expect(prompt).toBe(REPAIR_SYSTEM_PROMPT);
    });

    it('should return enhancement prompt for enhance operation', () => {
      const prompt = getSystemPrompt('enhance');
      expect(prompt).toBe(ENHANCEMENT_SYSTEM_PROMPT);
    });
  });
});
