import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { parseMarkdown } from '../../lib/spec/parser.js';
import { validateSpec } from '../../lib/spec/validator.js';
import { computeSpecHash } from '../../lib/spec/hash.js';
import { createTempDir, cleanupTempDir, createMinimalSpec, createCompleteSpec } from '../utils/fixtures.js';

describe('Spec Validation Pipeline', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await createTempDir();
  });

  afterEach(async () => {
    await cleanupTempDir(tempDir);
  });

  describe('Valid Specs', () => {
    it('should validate minimal spec', async () => {
      const specContent = createMinimalSpec();
      const parsed = await parseMarkdown(specContent);
      const validation = validateSpec(parsed);

      expect(validation.success).toBe(true);
      if (validation.success) {
        expect(validation.data.projectName).toBe('TestApp');
        expect(validation.data.config.platform).toBe('expo');
        expect(validation.data.onboardingSteps.length).toBeGreaterThan(0);
      }
    });

    it('should validate complete spec with all sections', async () => {
      const specContent = createCompleteSpec();
      const parsed = await parseMarkdown(specContent);
      const validation = validateSpec(parsed);

      expect(validation.success).toBe(true);
      if (validation.success) {
        expect(validation.data.projectName).toBe('CompleteApp');
        expect(validation.data.softPaywall).toBeDefined();
        expect(validation.data.hardPaywall).toBeDefined();
        expect(validation.data.onboardingSteps.length).toBe(3);
      }
    });

    it('should validate spec with different color formats', async () => {
      const specContent = `# ColorApp

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
      if (validation.success) {
        expect(validation.data.theme.primary).toBe('#6366F1');
        expect(validation.data.theme.secondary).toBe('#8B5CF6');
      }
    });
  });

  describe('Invalid Specs', () => {
    it('should reject spec with invalid platform', async () => {
      const specContent = `# InvalidPlatform

## Config

- Platform: flutter
- Navigation: react-navigation
- Styling: stylesheet
`;

      const parsed = await parseMarkdown(specContent);
      const validation = validateSpec(parsed);

      expect(validation.success).toBe(false);
    });

    it('should reject spec with invalid hex color', async () => {
      const specContent = `# InvalidColor

## Config

- Platform: expo
- Navigation: react-navigation
- Styling: stylesheet

## Theme

- Primary: not-a-color
- Secondary: #8B5CF6
- Background: #FFFFFF
- Surface: #F5F5F5
- Text: #000000
- Text Secondary: #666666
- Error: #DC2626
- Success: #10B981
- Font: System
- Border Radius: 12
`;

      const parsed = await parseMarkdown(specContent);
      const validation = validateSpec(parsed);

      expect(validation.success).toBe(false);
    });

    it('should reject spec with missing required fields', async () => {
      const specContent = `# MissingFields

## Config

- Platform: expo
- Navigation: react-navigation
- Styling: stylesheet

## Theme

- Primary: #6366F1
`;

      const parsed = await parseMarkdown(specContent);
      const validation = validateSpec(parsed);

      expect(validation.success).toBe(false);
      if (!validation.success) {
        expect(validation.error.errors.length).toBeGreaterThan(0);
      }
    });

    it('should reject spec with empty onboarding steps', async () => {
      const specContent = `# NoSteps

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

      expect(validation.success).toBe(false);
    });
  });

  describe('Spec Hashing', () => {
    it('should generate consistent hash for same spec', async () => {
      const specContent = createMinimalSpec();
      const hash1 = await computeSpecHash(specContent);
      const hash2 = await computeSpecHash(specContent);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA256 hex string
    });

    it('should generate different hash for different specs', async () => {
      const spec1 = createMinimalSpec();
      const spec2 = createCompleteSpec();

      const hash1 = await computeSpecHash(spec1);
      const hash2 = await computeSpecHash(spec2);

      expect(hash1).not.toBe(hash2);
    });

    it('should detect spec modifications', async () => {
      const originalSpec = createMinimalSpec();
      const modifiedSpec = originalSpec.replace('TestApp', 'ModifiedApp');

      const hash1 = await computeSpecHash(originalSpec);
      const hash2 = await computeSpecHash(modifiedSpec);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle spec with special characters', async () => {
      const specContent = `# TestApp

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

- Headline: Welcome to TestApp! 🎉
- Subtext: Get started & explore
- Image: welcome
- CTA: Let's Go!

## Onboarding Steps

### Step 1

- Title: First
- Headline: Step One
- Subtext: First step
- Image: step1

## Login

- Methods: [email]
- Headline: Sign in

## Name Capture

- Headline: What's your name?
- Fields: [first_name]
- CTA: Continue
`;

      const parsed = await parseMarkdown(specContent);
      const validation = validateSpec(parsed);

      expect(validation.success).toBe(true);
      if (validation.success) {
        expect(validation.data.welcome.headline).toContain('🎉');
        expect(validation.data.welcome.subtext).toContain('&');
      }
    });

    it('should handle very long onboarding steps', async () => {
      let specContent = `# LongApp

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
`;

      // Add 10 steps
      for (let i = 1; i <= 10; i++) {
        specContent += `
### Step ${i}

- Title: Step ${i}
- Headline: Step ${i} Title
- Subtext: This is step ${i}
- Image: step${i}
`;
      }

      specContent += `
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
      if (validation.success) {
        expect(validation.data.onboardingSteps.length).toBe(10);
      }
    });
  });
});
