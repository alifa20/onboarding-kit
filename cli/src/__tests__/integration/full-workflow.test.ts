import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'node:path';
import { parseMarkdown } from '../../lib/spec/parser.js';
import { validateSpec } from '../../lib/spec/validator.js';
import { renderTemplate } from '../../lib/templates/renderer.js';
import { buildContext } from '../../lib/templates/context-builder.js';
import { createTempDir, cleanupTempDir, createSpecFile, createMinimalSpec } from '../utils/fixtures.js';
import { getAllFiles, expectFileExists } from '../utils/helpers.js';

describe('Full Workflow Integration', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await createTempDir();
  });

  afterEach(async () => {
    await cleanupTempDir(tempDir);
  });

  it('should complete full workflow: spec → parse → validate → generate', async () => {
    // Step 1: Create spec file
    const specContent = createMinimalSpec();
    const specPath = await createSpecFile(tempDir, specContent);

    // Step 2: Parse spec
    const parsed = await parseMarkdown(specContent);
    expect(parsed).toBeDefined();
    expect(parsed).toHaveProperty('projectName', 'TestApp');

    // Step 3: Validate spec
    const validation = validateSpec(parsed);
    expect(validation.success).toBe(true);

    if (!validation.success) {
      throw new Error('Validation failed');
    }

    const spec = validation.data;

    // Step 4: Build template context
    const context = buildContext(spec);
    expect(context).toHaveProperty('projectName', 'TestApp');
    expect(context).toHaveProperty('screens');
    expect(context.screens.length).toBeGreaterThan(0);

    // Step 5: Verify context has all required data
    expect(context).toHaveProperty('theme');
    expect(context).toHaveProperty('config');
    expect(context).toHaveProperty('navigation');
  });

  it('should handle multi-step onboarding workflow', async () => {
    const specContent = `# MultiStepApp

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

- Headline: Welcome to MultiStepApp
- Subtext: Get started
- Image: welcome
- CTA: Start
- Skip: Skip

## Onboarding Steps

### Step 1

- Title: First
- Headline: Step One
- Subtext: First step
- Image: step1

### Step 2

- Title: Second
- Headline: Step Two
- Subtext: Second step
- Image: step2

### Step 3

- Title: Third
- Headline: Step Three
- Subtext: Third step
- Image: step3

## Login

- Methods: [email, google]
- Headline: Sign in

## Name Capture

- Headline: Your name?
- Fields: [first_name, last_name]
- CTA: Continue
`;

    const specPath = await createSpecFile(tempDir, specContent);
    const parsed = await parseMarkdown(specContent);
    const validation = validateSpec(parsed);

    expect(validation.success).toBe(true);

    if (!validation.success) {
      throw new Error('Validation failed');
    }

    const spec = validation.data;
    expect(spec.onboardingSteps).toHaveLength(3);

    const context = buildContext(spec);
    const onboardingScreens = context.screens.filter((s) => s.type === 'onboarding-step');
    expect(onboardingScreens).toHaveLength(3);
  });

  it('should handle spec with optional sections', async () => {
    const specContent = `# OptionalApp

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

- Headline: Welcome
- Subtext: Get started
- Image: welcome
- CTA: Start

## Onboarding Steps

### Step 1

- Title: First
- Headline: Step One
- Subtext: First step
- Image: step1

## Soft Paywall

- Headline: Unlock Premium
- Subtext: Get more features
- Features:
  - Feature 1
  - Feature 2
- CTA: Subscribe
- Skip: Later
- Price: $9.99/month

## Login

- Methods: [email]
- Headline: Sign in

## Name Capture

- Headline: Your name?
- Fields: [first_name]
- CTA: Continue
`;

    const parsed = await parseMarkdown(specContent);
    const validation = validateSpec(parsed);

    expect(validation.success).toBe(true);

    if (!validation.success) {
      throw new Error('Validation failed');
    }

    const spec = validation.data;
    expect(spec.softPaywall).toBeDefined();
    expect(spec.softPaywall?.features).toHaveLength(2);
  });

  it('should fail gracefully with invalid spec', async () => {
    const invalidSpec = `# InvalidApp

## Config

- Platform: invalid-platform
- Navigation: react-navigation
- Styling: stylesheet

## Theme

- Primary: not-a-color
`;

    const parsed = await parseMarkdown(invalidSpec);
    const validation = validateSpec(parsed);

    expect(validation.success).toBe(false);
    if (!validation.success) {
      expect(validation.error).toBeDefined();
      expect(validation.error.errors).toBeInstanceOf(Array);
      expect(validation.error.errors.length).toBeGreaterThan(0);
    }
  });

  it('should handle missing required sections', async () => {
    const incompleteSpec = `# IncompleteApp

## Config

- Platform: expo
- Navigation: react-navigation
- Styling: stylesheet

## Theme

- Primary: #6366F1
`;

    const parsed = await parseMarkdown(incompleteSpec);
    const validation = validateSpec(parsed);

    expect(validation.success).toBe(false);
  });
});
