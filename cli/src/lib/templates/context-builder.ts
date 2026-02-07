/**
 * Build Handlebars context from validated spec
 */

import type { OnboardingSpec } from '../spec/schema.js';

export interface TemplateContext {
  projectName: string;
  config: OnboardingSpec['config'];
  theme: OnboardingSpec['theme'];
  welcome: OnboardingSpec['welcome'];
  onboardingSteps: OnboardingSpec['onboardingSteps'];
  login: OnboardingSpec['login'];
  nameCapture: OnboardingSpec['nameCapture'];
  softPaywall?: OnboardingSpec['softPaywall'];
  hardPaywall?: OnboardingSpec['hardPaywall'];

  // Computed properties
  hasGoogle: boolean;
  hasApple: boolean;
  hasEmail: boolean;
  hasPhone: boolean;
  hasSoftPaywall: boolean;
  hasHardPaywall: boolean;
  totalSteps: number;

  // Screen names for navigation
  screens: {
    welcome: string;
    onboardingSteps: string[];
    softPaywall?: string;
    login: string;
    nameCapture: string;
    hardPaywall?: string;
    home: string;
  };
}

/**
 * Build template context from validated spec
 */
export function buildTemplateContext(spec: OnboardingSpec): TemplateContext {
  const hasGoogle = spec.login.methods.includes('google');
  const hasApple = spec.login.methods.includes('apple');
  const hasEmail = spec.login.methods.includes('email');
  const hasPhone = spec.login.methods.includes('phone');
  const hasSoftPaywall = spec.softPaywall !== undefined;
  const hasHardPaywall = spec.hardPaywall !== undefined;
  const totalSteps = spec.onboardingSteps.length;

  return {
    projectName: spec.projectName,
    config: spec.config,
    theme: spec.theme,
    welcome: spec.welcome,
    onboardingSteps: spec.onboardingSteps,
    login: spec.login,
    nameCapture: spec.nameCapture,
    softPaywall: spec.softPaywall,
    hardPaywall: spec.hardPaywall,

    // Computed
    hasGoogle,
    hasApple,
    hasEmail,
    hasPhone,
    hasSoftPaywall,
    hasHardPaywall,
    totalSteps,

    // Screen names
    screens: {
      welcome: 'WelcomeScreen',
      onboardingSteps: spec.onboardingSteps.map((_, index) => `OnboardingStep${index + 1}Screen`),
      softPaywall: hasSoftPaywall ? 'SoftPaywallScreen' : undefined,
      login: 'LoginScreen',
      nameCapture: 'NameCaptureScreen',
      hardPaywall: hasHardPaywall ? 'HardPaywallScreen' : undefined,
      home: 'HomeScreen',
    },
  };
}
