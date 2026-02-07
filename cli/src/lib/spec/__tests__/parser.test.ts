import { describe, it, expect } from 'vitest';
import { parseMarkdown } from '../parser.js';

describe('parseMarkdown', () => {
  it('should parse a basic spec', async () => {
    const markdown = `# TestApp

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
- Subtext: Get started now
- Image: welcome
- CTA: Start
- Skip: Skip

## Onboarding Steps

### Step 1

- Title: First
- Headline: Step One
- Subtext: This is step one
- Image: step1

## Login

- Methods: [email, google]
- Headline: Sign in

## Name Capture

- Headline: Your name?
- Fields: [first_name, last_name]
- CTA: Continue
`;

    const result = await parseMarkdown(markdown);

    expect(result).toHaveProperty('projectName', 'TestApp');
    expect(result).toHaveProperty('config');
    expect(result).toHaveProperty('theme');
    expect(result).toHaveProperty('welcome');
    expect(result).toHaveProperty('onboardingSteps');
    expect(result).toHaveProperty('login');
    expect(result).toHaveProperty('nameCapture');
  });

  it('should parse arrays correctly', async () => {
    const markdown = `# TestApp

## Login

- Methods: [email, google, apple]
- Headline: Sign in
`;

    const result = (await parseMarkdown(markdown)) as any;

    expect(result.login.methods).toEqual(['email', 'google', 'apple']);
  });

  it('should convert keys to camelCase', async () => {
    const markdown = `# TestApp

## Theme

- Primary: #FF0000
- Text Secondary: #666666
- Border Radius: 12
`;

    const result = (await parseMarkdown(markdown)) as any;

    expect(result.theme).toHaveProperty('primary');
    expect(result.theme).toHaveProperty('textSecondary');
    expect(result.theme).toHaveProperty('borderRadius');
  });

  it('should parse numbers correctly', async () => {
    const markdown = `# TestApp

## Theme

- Border Radius: 12
`;

    const result = (await parseMarkdown(markdown)) as any;

    expect(result.theme.borderRadius).toBe(12);
    expect(typeof result.theme.borderRadius).toBe('number');
  });

  it('should handle multiple onboarding steps', async () => {
    const markdown = `# TestApp

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
`;

    const result = (await parseMarkdown(markdown)) as any;

    expect(result.onboardingSteps).toHaveLength(3);
    expect(result.onboardingSteps[0].title).toBe('First');
    expect(result.onboardingSteps[1].title).toBe('Second');
    expect(result.onboardingSteps[2].title).toBe('Third');
  });
});
