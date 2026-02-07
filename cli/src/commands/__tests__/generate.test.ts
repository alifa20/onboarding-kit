/**
 * Integration tests for generate command
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { renderTemplates } from '../../lib/templates/renderer.js';
import { parseMarkdownSpec } from '../../lib/spec/parser.js';
import { validateSpec } from '../../lib/spec/validator.js';

describe('generate command integration', () => {
  let testDir: string;

  beforeEach(async () => {
    // Create temporary directory for tests
    testDir = join(tmpdir(), `onboardkit-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  const sampleSpec = `# TestApp

## Config

- Platform: expo
- Navigation: react-navigation
- Styling: stylesheet

## Theme

- Primary: #6C5CE7
- Secondary: #A29BFE
- Background: #FFFFFF
- Surface: #F8F9FA
- Text: #2D3436
- Text Secondary: #636E72
- Error: #E17055
- Success: #00B894
- Font: Inter
- Border Radius: 16

## Welcome Screen

- Headline: Welcome to TestApp
- Subtext: Your journey starts here
- Image: welcome-hero
- CTA: Get Started
- Skip: Skip

## Onboarding Steps

### Step 1

- Title: First Step
- Headline: Learn the Basics
- Subtext: Get started with TestApp
- Image: step1

## Login

- Methods: [email, google]
- Headline: Welcome Back

## Name Capture

- Headline: What should we call you?
- Fields: [first_name, last_name]
- CTA: Continue
`;

  it('should parse, validate, and generate from spec', async () => {
    // Parse
    const parsed = await parseMarkdownSpec(sampleSpec);
    expect(parsed).toBeDefined();

    // Validate
    const validated = validateSpec(parsed);
    expect(validated.success).toBe(true);

    if (!validated.success) {
      throw new Error('Validation failed');
    }

    // Generate
    const result = await renderTemplates(validated.data);
    expect(result.files.length).toBeGreaterThan(0);
    expect(result.summary.totalFiles).toBe(result.files.length);
  });

  it('should generate all required files', async () => {
    const parsed = await parseMarkdownSpec(sampleSpec);
    const validated = validateSpec(parsed);

    if (!validated.success) {
      throw new Error('Validation failed');
    }

    const result = await renderTemplates(validated.data);

    // Check for theme files
    expect(result.files.find((f) => f.path === 'theme/colors.ts')).toBeDefined();
    expect(result.files.find((f) => f.path === 'theme/typography.ts')).toBeDefined();
    expect(result.files.find((f) => f.path === 'theme/spacing.ts')).toBeDefined();
    expect(result.files.find((f) => f.path === 'theme/index.ts')).toBeDefined();

    // Check for component files
    expect(result.files.find((f) => f.path === 'components/Button.tsx')).toBeDefined();
    expect(result.files.find((f) => f.path === 'components/Input.tsx')).toBeDefined();
    expect(result.files.find((f) => f.path === 'components/Card.tsx')).toBeDefined();

    // Check for screen files
    expect(result.files.find((f) => f.path === 'screens/WelcomeScreen.tsx')).toBeDefined();
    expect(result.files.find((f) => f.path === 'screens/LoginScreen.tsx')).toBeDefined();
    expect(result.files.find((f) => f.path === 'screens/NameCaptureScreen.tsx')).toBeDefined();
    expect(result.files.find((f) => f.path === 'screens/OnboardingStep1Screen.tsx')).toBeDefined();
    expect(result.files.find((f) => f.path === 'screens/HomeScreen.tsx')).toBeDefined();

    // Check for navigation files
    expect(result.files.find((f) => f.path === 'navigation/stack.tsx')).toBeDefined();
    expect(result.files.find((f) => f.path === 'navigation/types.ts')).toBeDefined();
  });

  it('should write files to disk', async () => {
    const parsed = await parseMarkdownSpec(sampleSpec);
    const validated = validateSpec(parsed);

    if (!validated.success) {
      throw new Error('Validation failed');
    }

    const result = await renderTemplates(validated.data);

    // Create output directories
    const outputDir = join(testDir, 'output');
    await fs.mkdir(join(outputDir, 'screens'), { recursive: true });
    await fs.mkdir(join(outputDir, 'components'), { recursive: true });
    await fs.mkdir(join(outputDir, 'navigation'), { recursive: true });
    await fs.mkdir(join(outputDir, 'theme'), { recursive: true });

    // Write all files
    for (const file of result.files) {
      const filePath = join(outputDir, file.path);
      await fs.writeFile(filePath, file.content, 'utf-8');
    }

    // Verify files exist
    const welcomeContent = await fs.readFile(
      join(outputDir, 'screens/WelcomeScreen.tsx'),
      'utf-8',
    );
    expect(welcomeContent).toContain('WelcomeScreen');
    expect(welcomeContent).toContain('Welcome to TestApp');

    const colorsContent = await fs.readFile(join(outputDir, 'theme/colors.ts'), 'utf-8');
    expect(colorsContent).toContain('#6C5CE7');
  });

  it('should generate valid TypeScript code', async () => {
    const parsed = await parseMarkdownSpec(sampleSpec);
    const validated = validateSpec(parsed);

    if (!validated.success) {
      throw new Error('Validation failed');
    }

    const result = await renderTemplates(validated.data);

    // Check that all TypeScript files have balanced syntax
    for (const file of result.files) {
      if (file.path.endsWith('.ts') || file.path.endsWith('.tsx')) {
        // Basic syntax checks
        expect(file.content).not.toContain('undefined');
        expect(file.content).toMatch(/export (function|const|type|interface)/);

        // Check balanced brackets
        const openBraces = (file.content.match(/{/g) || []).length;
        const closeBraces = (file.content.match(/}/g) || []).length;
        expect(openBraces).toBe(closeBraces);

        // Check balanced parentheses
        const openParens = (file.content.match(/\(/g) || []).length;
        const closeParens = (file.content.match(/\)/g) || []).length;
        expect(openParens).toBe(closeParens);
      }
    }
  });

  it('should handle specs with multiple onboarding steps', async () => {
    const multiStepSpec = `${sampleSpec}

### Step 2

- Title: Second Step
- Headline: Advanced Features
- Subtext: Learn more advanced features
- Image: step2

### Step 3

- Title: Third Step
- Headline: Expert Mode
- Subtext: Become an expert
- Image: step3
`;

    const parsed = await parseMarkdownSpec(multiStepSpec);
    const validated = validateSpec(parsed);

    if (!validated.success) {
      throw new Error('Validation failed');
    }

    const result = await renderTemplates(validated.data);

    // Should have 3 onboarding step screens
    expect(result.files.find((f) => f.path === 'screens/OnboardingStep1Screen.tsx')).toBeDefined();
    expect(result.files.find((f) => f.path === 'screens/OnboardingStep2Screen.tsx')).toBeDefined();
    expect(result.files.find((f) => f.path === 'screens/OnboardingStep3Screen.tsx')).toBeDefined();
  });

  it('should use theme colors in generated code', async () => {
    const parsed = await parseMarkdownSpec(sampleSpec);
    const validated = validateSpec(parsed);

    if (!validated.success) {
      throw new Error('Validation failed');
    }

    const result = await renderTemplates(validated.data);

    // Check that screens import theme
    const welcomeFile = result.files.find((f) => f.path === 'screens/WelcomeScreen.tsx');
    expect(welcomeFile?.content).toContain("from '../theme'");
    expect(welcomeFile?.content).toContain('colors.');

    // Check that components import theme
    const buttonFile = result.files.find((f) => f.path === 'components/Button.tsx');
    expect(buttonFile?.content).toContain("from '../theme'");
  });

  it('should generate navigation with all screens', async () => {
    const parsed = await parseMarkdownSpec(sampleSpec);
    const validated = validateSpec(parsed);

    if (!validated.success) {
      throw new Error('Validation failed');
    }

    const result = await renderTemplates(validated.data);

    const navFile = result.files.find((f) => f.path === 'navigation/stack.tsx');
    expect(navFile).toBeDefined();
    expect(navFile?.content).toContain('WelcomeScreen');
    expect(navFile?.content).toContain('LoginScreen');
    expect(navFile?.content).toContain('NameCaptureScreen');
    expect(navFile?.content).toContain('OnboardingStep1Screen');

    const typesFile = result.files.find((f) => f.path === 'navigation/types.ts');
    expect(typesFile).toBeDefined();
    expect(typesFile?.content).toContain('RootStackParamList');
  });
});
