import { describe, it, expect } from 'vitest';
import { validateSpec, formatValidationErrors, getSpecFeatures } from '../validator.js';

describe('validateSpec', () => {
  it('should validate a complete valid spec', () => {
    const validSpec = {
      projectName: 'TestApp',
      config: {
        platform: 'expo',
        navigation: 'react-navigation',
        styling: 'stylesheet',
      },
      theme: {
        primary: '#6366F1',
        secondary: '#8B5CF6',
        background: '#FFFFFF',
        surface: '#F5F5F5',
        text: '#000000',
        textSecondary: '#666666',
        error: '#DC2626',
        success: '#10B981',
        font: 'System',
        borderRadius: 12,
      },
      welcome: {
        headline: 'Welcome',
        subtext: 'Get started',
        image: 'welcome',
        cta: 'Start',
        skip: 'Skip',
      },
      onboardingSteps: [
        {
          title: 'Step 1',
          headline: 'First',
          subtext: 'First step',
          image: 'step1',
        },
      ],
      login: {
        methods: ['email', 'google'],
        headline: 'Sign in',
      },
      nameCapture: {
        headline: 'Your name?',
        fields: ['first_name', 'last_name'],
        cta: 'Continue',
      },
    };

    const result = validateSpec(validSpec);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.projectName).toBe('TestApp');
    }
  });

  it('should reject spec with missing required fields', () => {
    const invalidSpec = {
      projectName: 'TestApp',
      // Missing config
      theme: {
        primary: '#6366F1',
      },
    };

    const result = validateSpec(invalidSpec);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it('should reject invalid hex colors', () => {
    const invalidSpec = {
      projectName: 'TestApp',
      config: {
        platform: 'expo',
        navigation: 'react-navigation',
        styling: 'stylesheet',
      },
      theme: {
        primary: 'invalid-color', // Invalid hex
        secondary: '#8B5CF6',
        background: '#FFFFFF',
        surface: '#F5F5F5',
        text: '#000000',
        textSecondary: '#666666',
        error: '#DC2626',
        success: '#10B981',
        font: 'System',
        borderRadius: 12,
      },
      welcome: {
        headline: 'Welcome',
        subtext: 'Get started',
        image: 'welcome',
        cta: 'Start',
      },
      onboardingSteps: [
        {
          title: 'Step 1',
          headline: 'First',
          subtext: 'First step',
          image: 'step1',
        },
      ],
      login: {
        methods: ['email'],
        headline: 'Sign in',
      },
      nameCapture: {
        headline: 'Your name?',
        fields: ['first_name'],
        cta: 'Continue',
      },
    };

    const result = validateSpec(invalidSpec);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((e) => e.path.includes('primary'))).toBe(true);
    }
  });

  it('should accept valid 3-digit hex colors', () => {
    const validSpec = {
      projectName: 'TestApp',
      config: {
        platform: 'expo',
        navigation: 'react-navigation',
        styling: 'stylesheet',
      },
      theme: {
        primary: '#F57', // Valid 3-digit hex
        secondary: '#8B5CF6',
        background: '#FFF',
        surface: '#F5F5F5',
        text: '#000',
        textSecondary: '#666',
        error: '#F00',
        success: '#0F0',
        font: 'System',
        borderRadius: 8,
      },
      welcome: {
        headline: 'Welcome',
        subtext: 'Get started',
        image: 'welcome',
        cta: 'Start',
      },
      onboardingSteps: [
        {
          title: 'Step 1',
          headline: 'First',
          subtext: 'First step',
          image: 'step1',
        },
      ],
      login: {
        methods: ['email'],
        headline: 'Sign in',
      },
      nameCapture: {
        headline: 'Your name?',
        fields: ['first_name'],
        cta: 'Continue',
      },
    };

    const result = validateSpec(validSpec);

    expect(result.success).toBe(true);
  });

  it('should validate optional sections', () => {
    const specWithPaywall = {
      projectName: 'TestApp',
      config: {
        platform: 'expo',
        navigation: 'react-navigation',
        styling: 'stylesheet',
      },
      theme: {
        primary: '#6366F1',
        secondary: '#8B5CF6',
        background: '#FFFFFF',
        surface: '#F5F5F5',
        text: '#000000',
        textSecondary: '#666666',
        error: '#DC2626',
        success: '#10B981',
        font: 'System',
        borderRadius: 12,
      },
      welcome: {
        headline: 'Welcome',
        subtext: 'Get started',
        image: 'welcome',
        cta: 'Start',
      },
      onboardingSteps: [
        {
          title: 'Step 1',
          headline: 'First',
          subtext: 'First step',
          image: 'step1',
        },
      ],
      softPaywall: {
        headline: 'Upgrade',
        subtext: 'Get premium',
        features: ['Feature 1', 'Feature 2'],
        cta: 'Subscribe',
        price: '$9.99/mo',
      },
      login: {
        methods: ['email'],
        headline: 'Sign in',
      },
      nameCapture: {
        headline: 'Your name?',
        fields: ['first_name'],
        cta: 'Continue',
      },
    };

    const result = validateSpec(specWithPaywall);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.softPaywall).toBeDefined();
    }
  });
});

describe('formatValidationErrors', () => {
  it('should format errors in a readable way', () => {
    const errors = [
      {
        path: ['theme', 'primary'],
        message: 'Invalid hex color',
        code: 'invalid_string',
      },
      {
        path: ['projectName'],
        message: 'Required field missing',
        code: 'invalid_type',
      },
    ];

    const formatted = formatValidationErrors(errors);

    expect(formatted).toContain('theme.primary');
    expect(formatted).toContain('projectName');
    expect(formatted).toContain('Invalid hex color');
  });
});

describe('getSpecFeatures', () => {
  it('should detect optional features', () => {
    const spec = {
      projectName: 'TestApp',
      config: {
        platform: 'expo' as const,
        navigation: 'react-navigation' as const,
        styling: 'stylesheet' as const,
      },
      theme: {
        primary: '#6366F1',
        secondary: '#8B5CF6',
        background: '#FFFFFF',
        surface: '#F5F5F5',
        text: '#000000',
        textSecondary: '#666666',
        error: '#DC2626',
        success: '#10B981',
        font: 'System',
        borderRadius: 12,
      },
      welcome: {
        headline: 'Welcome',
        subtext: 'Get started',
        image: 'welcome',
        cta: 'Start',
      },
      onboardingSteps: [
        {
          title: 'Step 1',
          headline: 'First',
          subtext: 'First step',
          image: 'step1',
        },
        {
          title: 'Step 2',
          headline: 'Second',
          subtext: 'Second step',
          image: 'step2',
        },
      ],
      softPaywall: {
        headline: 'Upgrade',
        subtext: 'Get premium',
        features: ['Feature 1'],
        cta: 'Subscribe',
        price: '$9.99',
      },
      login: {
        methods: ['email' as const],
        headline: 'Sign in',
      },
      nameCapture: {
        headline: 'Your name?',
        fields: ['first_name' as const],
        cta: 'Continue',
      },
    };

    const features = getSpecFeatures(spec);

    expect(features.hasSoftPaywall).toBe(true);
    expect(features.hasHardPaywall).toBe(false);
    expect(features.stepCount).toBe(2);
  });
});
