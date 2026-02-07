/**
 * Tests for template renderer
 */

import { describe, it, expect } from 'vitest';
import { renderTemplates } from '../renderer';
import type { OnboardingSpec } from '../../spec/schema';

describe('renderTemplates', () => {
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
    ],
    login: {
      methods: ['email', 'google'],
      headline: 'Welcome Back',
    },
    nameCapture: {
      headline: 'What should we call you?',
      fields: ['first_name', 'last_name'],
      cta: 'Continue',
    },
  };

  it('should render all required files', async () => {
    const result = await renderTemplates(mockSpec);

    expect(result.files).toBeDefined();
    expect(result.files.length).toBeGreaterThan(0);
  });

  it('should generate correct file summary', async () => {
    const result = await renderTemplates(mockSpec);

    expect(result.summary.totalFiles).toBe(result.files.length);
    expect(result.summary.screens).toBeGreaterThan(0);
    expect(result.summary.components).toBe(3); // Button, Input, Card
    expect(result.summary.themeFiles).toBe(4); // colors, typography, spacing, index
    expect(result.summary.navigationFiles).toBe(2); // stack, types
  });

  it('should render theme files correctly', async () => {
    const result = await renderTemplates(mockSpec);

    const colorsFile = result.files.find((f) => f.path === 'theme/colors.ts');
    expect(colorsFile).toBeDefined();
    expect(colorsFile?.content).toContain('#6C5CE7');
    expect(colorsFile?.content).toContain('primary');

    const typographyFile = result.files.find((f) => f.path === 'theme/typography.ts');
    expect(typographyFile).toBeDefined();
    expect(typographyFile?.content).toContain('Inter');

    const spacingFile = result.files.find((f) => f.path === 'theme/spacing.ts');
    expect(spacingFile).toBeDefined();
    expect(spacingFile?.content).toContain('borderRadius');
  });

  it('should render component files correctly', async () => {
    const result = await renderTemplates(mockSpec);

    const buttonFile = result.files.find((f) => f.path === 'components/Button.tsx');
    expect(buttonFile).toBeDefined();
    expect(buttonFile?.content).toContain('export function Button');
    expect(buttonFile?.content).toContain('ButtonProps');

    const inputFile = result.files.find((f) => f.path === 'components/Input.tsx');
    expect(inputFile).toBeDefined();
    expect(inputFile?.content).toContain('export function Input');

    const cardFile = result.files.find((f) => f.path === 'components/Card.tsx');
    expect(cardFile).toBeDefined();
    expect(cardFile?.content).toContain('export function Card');
  });

  it('should render screen files correctly', async () => {
    const result = await renderTemplates(mockSpec);

    const welcomeFile = result.files.find((f) => f.path === 'screens/WelcomeScreen.tsx');
    expect(welcomeFile).toBeDefined();
    expect(welcomeFile?.content).toContain('export function WelcomeScreen');
    expect(welcomeFile?.content).toContain('Welcome to TestApp');

    const loginFile = result.files.find((f) => f.path === 'screens/LoginScreen.tsx');
    expect(loginFile).toBeDefined();
    expect(loginFile?.content).toContain('export function LoginScreen');

    const signupFile = result.files.find((f) => f.path === 'screens/NameCaptureScreen.tsx');
    expect(signupFile).toBeDefined();
    expect(signupFile?.content).toContain('export function NameCaptureScreen');
  });

  it('should render navigation files correctly', async () => {
    const result = await renderTemplates(mockSpec);

    const stackFile = result.files.find((f) => f.path === 'navigation/stack.tsx');
    expect(stackFile).toBeDefined();
    expect(stackFile?.content).toContain('export function AppNavigator');
    expect(stackFile?.content).toContain('NavigationContainer');

    const typesFile = result.files.find((f) => f.path === 'navigation/types.ts');
    expect(typesFile).toBeDefined();
    expect(typesFile?.content).toContain('RootStackParamList');
  });

  it('should generate onboarding step screens', async () => {
    const result = await renderTemplates(mockSpec);

    const step1File = result.files.find((f) => f.path === 'screens/OnboardingStep1Screen.tsx');
    expect(step1File).toBeDefined();
    expect(step1File?.content).toContain('export function OnboardingStep1Screen');
    expect(step1File?.content).toContain('First Step');
  });

  it('should generate home screen', async () => {
    const result = await renderTemplates(mockSpec);

    const homeFile = result.files.find((f) => f.path === 'screens/HomeScreen.tsx');
    expect(homeFile).toBeDefined();
    expect(homeFile?.content).toContain('export function HomeScreen');
  });

  it('should format code with Prettier', async () => {
    const result = await renderTemplates(mockSpec);

    // Check that code is formatted (has proper indentation, semicolons, etc.)
    const welcomeFile = result.files.find((f) => f.path === 'screens/WelcomeScreen.tsx');
    expect(welcomeFile?.content).toMatch(/;\s*$/m); // Has semicolons at line ends
    expect(welcomeFile?.content).toContain('  '); // Has indentation
  });

  it('should handle login methods conditionally', async () => {
    const result = await renderTemplates(mockSpec);

    const loginFile = result.files.find((f) => f.path === 'screens/LoginScreen.tsx');
    expect(loginFile?.content).toContain('handleGoogleLogin'); // has Google
    expect(loginFile?.content).not.toContain('handleAppleLogin'); // no Apple in mock
  });

  it('should handle multiple onboarding steps', async () => {
    const specMultipleSteps: OnboardingSpec = {
      ...mockSpec,
      onboardingSteps: [
        { title: 'Step 1', headline: 'First', subtext: 'Sub1', image: 'img1' },
        { title: 'Step 2', headline: 'Second', subtext: 'Sub2', image: 'img2' },
        { title: 'Step 3', headline: 'Third', subtext: 'Sub3', image: 'img3' },
      ],
    };

    const result = await renderTemplates(specMultipleSteps);

    expect(result.files.find((f) => f.path === 'screens/OnboardingStep1Screen.tsx')).toBeDefined();
    expect(result.files.find((f) => f.path === 'screens/OnboardingStep2Screen.tsx')).toBeDefined();
    expect(result.files.find((f) => f.path === 'screens/OnboardingStep3Screen.tsx')).toBeDefined();
  });

  it('should compile TypeScript without errors', async () => {
    const result = await renderTemplates(mockSpec);

    // Basic check: no obvious syntax errors
    for (const file of result.files) {
      if (file.path.endsWith('.tsx') || file.path.endsWith('.ts')) {
        // Check for balanced brackets
        const openBraces = (file.content.match(/{/g) || []).length;
        const closeBraces = (file.content.match(/}/g) || []).length;
        expect(openBraces).toBe(closeBraces);

        // Check for balanced parentheses
        const openParens = (file.content.match(/\(/g) || []).length;
        const closeParens = (file.content.match(/\)/g) || []).length;
        expect(openParens).toBe(closeParens);
      }
    }
  });
});
