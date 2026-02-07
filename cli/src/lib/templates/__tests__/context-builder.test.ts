/**
 * Tests for context builder
 */

import { describe, it, expect } from 'vitest';
import { buildTemplateContext } from '../context-builder';
import type { OnboardingSpec } from '../../spec/schema';

describe('buildTemplateContext', () => {
  const mockSpec: OnboardingSpec = {
    projectName: 'TestApp',
    config: {
      platform: 'expo',
      navigation: 'react-navigation',
      styling: 'stylesheet',
    },
    theme: {
      primary: '#6C5CE7',
      secondary: '#A29BFE',
      background: '#FFFFFF',
      surface: '#F8F9FA',
      text: '#2D3436',
      textSecondary: '#636E72',
      error: '#E17055',
      success: '#00B894',
      font: 'Inter',
      borderRadius: 16,
    },
    welcome: {
      headline: 'Welcome to TestApp',
      subtext: 'Your journey starts here',
      image: 'welcome-hero',
      cta: 'Get Started',
      skip: 'Skip',
    },
    onboardingSteps: [
      {
        title: 'Step 1',
        headline: 'First Step',
        subtext: 'Learn the basics',
        image: 'step1',
      },
      {
        title: 'Step 2',
        headline: 'Second Step',
        subtext: 'Advanced features',
        image: 'step2',
      },
    ],
    login: {
      methods: ['email', 'google', 'apple'],
      headline: 'Welcome Back',
    },
    nameCapture: {
      headline: 'What should we call you?',
      fields: ['first_name', 'last_name'],
      cta: 'Continue',
    },
  };

  it('should build basic context properties', () => {
    const context = buildTemplateContext(mockSpec);

    expect(context.projectName).toBe('TestApp');
    expect(context.config).toEqual(mockSpec.config);
    expect(context.theme).toEqual(mockSpec.theme);
    expect(context.welcome).toEqual(mockSpec.welcome);
  });

  it('should compute login method flags correctly', () => {
    const context = buildTemplateContext(mockSpec);

    expect(context.hasGoogle).toBe(true);
    expect(context.hasApple).toBe(true);
    expect(context.hasEmail).toBe(true);
    expect(context.hasPhone).toBe(false);
  });

  it('should compute paywall flags correctly', () => {
    const contextNoPay = buildTemplateContext(mockSpec);
    expect(contextNoPay.hasSoftPaywall).toBe(false);
    expect(contextNoPay.hasHardPaywall).toBe(false);

    const specWithPaywall: OnboardingSpec = {
      ...mockSpec,
      softPaywall: {
        headline: 'Go Premium',
        subtext: 'Unlock all features',
        features: ['Feature 1', 'Feature 2'],
        cta: 'Subscribe',
        skip: 'Maybe later',
        price: '$9.99/month',
      },
    };

    const contextWithPay = buildTemplateContext(specWithPaywall);
    expect(contextWithPay.hasSoftPaywall).toBe(true);
  });

  it('should compute total steps correctly', () => {
    const context = buildTemplateContext(mockSpec);
    expect(context.totalSteps).toBe(2);
  });

  it('should generate correct screen names', () => {
    const context = buildTemplateContext(mockSpec);

    expect(context.screens.welcome).toBe('WelcomeScreen');
    expect(context.screens.login).toBe('LoginScreen');
    expect(context.screens.nameCapture).toBe('NameCaptureScreen');
    expect(context.screens.home).toBe('HomeScreen');
    expect(context.screens.onboardingSteps).toEqual([
      'OnboardingStep1Screen',
      'OnboardingStep2Screen',
    ]);
  });

  it('should handle optional softPaywall', () => {
    const context = buildTemplateContext(mockSpec);
    expect(context.screens.softPaywall).toBeUndefined();

    const specWithPaywall: OnboardingSpec = {
      ...mockSpec,
      softPaywall: {
        headline: 'Go Premium',
        subtext: 'Unlock all features',
        features: ['Feature 1'],
        cta: 'Subscribe',
        price: '$9.99/month',
      },
    };

    const contextWithPaywall = buildTemplateContext(specWithPaywall);
    expect(contextWithPaywall.screens.softPaywall).toBe('SoftPaywallScreen');
  });

  it('should handle email-only login', () => {
    const specEmailOnly: OnboardingSpec = {
      ...mockSpec,
      login: {
        methods: ['email'],
        headline: 'Sign In',
      },
    };

    const context = buildTemplateContext(specEmailOnly);
    expect(context.hasEmail).toBe(true);
    expect(context.hasGoogle).toBe(false);
    expect(context.hasApple).toBe(false);
  });
});
