import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdir, rm, writeFile, readFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import type { OnboardingSpec } from '../../types/index.js';

/**
 * Creates a temporary directory for testing
 */
export async function createTempDir(): Promise<string> {
  const dir = join(tmpdir(), `onboardkit-test-${randomBytes(8).toString('hex')}`);
  await mkdir(dir, { recursive: true });
  return dir;
}

/**
 * Removes a temporary directory and all its contents
 */
export async function cleanupTempDir(dir: string): Promise<void> {
  try {
    await rm(dir, { recursive: true, force: true });
  } catch (error) {
    // Ignore errors during cleanup
  }
}

/**
 * Creates a spec file in a temporary directory
 */
export async function createSpecFile(dir: string, content: string): Promise<string> {
  const specPath = join(dir, 'spec.md');
  await writeFile(specPath, content, 'utf-8');
  return specPath;
}

/**
 * Loads fixture content from a file
 */
export async function loadFixture(fixtureName: string): Promise<string> {
  const fixturePath = new URL(`../fixtures/${fixtureName}`, import.meta.url);
  return readFile(fixturePath, 'utf-8');
}

/**
 * Creates a minimal valid spec
 */
export function createMinimalSpec(): string {
  return `# TestApp

## Config

- Platform: expo
- Navigation: react-navigation
- Styling: stylesheet

## Theme

- Primary: #6366F1
- Secondary: #8B5CF6
- Background: #FFFFFF
- Surface: #F5F5F5
- Text: #000000
- Text Secondary: #666666
- Error: #DC2626
- Success: #10B981
- Font: System
- Border Radius: 12

## Welcome Screen

- Headline: Welcome to TestApp
- Subtext: Get started with our app
- Image: welcome
- CTA: Get Started
- Skip: Skip

## Onboarding Steps

### Step 1

- Title: First Step
- Headline: Discover Features
- Subtext: Learn about our amazing features
- Image: step1

## Login

- Methods: [email, google]
- Headline: Sign in to your account

## Name Capture

- Headline: What's your name?
- Fields: [first_name, last_name]
- CTA: Continue
`;
}

/**
 * Creates a complete spec with all optional sections
 */
export function createCompleteSpec(): string {
  return `# CompleteApp

## Config

- Platform: expo
- Navigation: react-navigation
- Styling: stylesheet

## Theme

- Primary: #6366F1
- Secondary: #8B5CF6
- Background: #FFFFFF
- Surface: #F5F5F5
- Text: #000000
- Text Secondary: #666666
- Error: #DC2626
- Success: #10B981
- Font: Inter
- Border Radius: 16

## Welcome Screen

- Headline: Welcome to CompleteApp
- Subtext: The complete solution for your needs
- Image: welcome
- CTA: Get Started
- Skip: Skip

## Onboarding Steps

### Step 1

- Title: Step One
- Headline: Feature One
- Subtext: Learn about our first feature
- Image: step1

### Step 2

- Title: Step Two
- Headline: Feature Two
- Subtext: Discover more capabilities
- Image: step2

### Step 3

- Title: Step Three
- Headline: Feature Three
- Subtext: Everything you need to know
- Image: step3

## Soft Paywall

- Headline: Unlock Premium Features
- Subtext: Get the most out of CompleteApp
- Features:
  - Unlimited access to all features
  - Priority support
  - Advanced analytics
  - Custom branding
- CTA: Start Free Trial
- Skip: Maybe Later
- Price: $9.99/month

## Login

- Methods: [email, google, apple]
- Headline: Sign in to your account

## Name Capture

- Headline: Tell us about yourself
- Fields: [first_name, last_name, email]
- CTA: Create Account

## Hard Paywall

- Headline: Choose Your Plan
- Plans:
  - name: Free
    price: $0
    features: [Basic features, Community support]
  - name: Pro
    price: $9.99
    features: [All features, Priority support, Advanced analytics]
  - name: Enterprise
    price: $99.99
    features: [Unlimited everything, Dedicated support, Custom integration]
- CTA: Subscribe Now
- Restore: Restore Purchase
`;
}

/**
 * Mock spec object for testing
 */
export function createMockSpec(): OnboardingSpec {
  return {
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
      headline: 'Welcome to TestApp',
      subtext: 'Get started with our app',
      image: 'welcome',
      cta: 'Get Started',
      skip: 'Skip',
    },
    onboardingSteps: [
      {
        title: 'First Step',
        headline: 'Discover Features',
        subtext: 'Learn about our amazing features',
        image: 'step1',
      },
    ],
    login: {
      methods: ['email', 'google'],
      headline: 'Sign in to your account',
    },
    nameCapture: {
      headline: "What's your name?",
      fields: ['first_name', 'last_name'],
      cta: 'Continue',
    },
  };
}
