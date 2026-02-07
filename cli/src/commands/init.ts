import { intro, text, confirm, outro, cancel } from '@clack/prompts';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import pc from 'picocolors';

/**
 * Init command: Create a new onboarding spec from template
 */
export async function initCommand(): Promise<void> {
  intro(pc.bgCyan(pc.black(' OnboardKit Init ')));

  // Check if spec.md already exists
  const specPath = join(process.cwd(), 'spec.md');
  if (existsSync(specPath)) {
    const overwrite = await confirm({
      message: 'spec.md already exists. Overwrite it?',
      initialValue: false,
    });

    if (!overwrite) {
      cancel('Operation cancelled.');
      process.exit(0);
    }
  }

  // Collect project information
  const projectName = await text({
    message: 'What is your app name?',
    placeholder: 'MyAwesomeApp',
    validate: (value) => {
      if (!value || value.trim().length === 0) {
        return 'App name is required';
      }
    },
  });

  if (typeof projectName === 'symbol') {
    cancel('Operation cancelled.');
    process.exit(0);
  }

  const primaryColor = await text({
    message: 'Primary color (hex):',
    placeholder: '#6366F1',
    initialValue: '#6366F1',
    validate: (value) => {
      if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value)) {
        return 'Must be a valid hex color (e.g., #FF5733)';
      }
    },
  });

  if (typeof primaryColor === 'symbol') {
    cancel('Operation cancelled.');
    process.exit(0);
  }

  const secondaryColor = await text({
    message: 'Secondary color (hex):',
    placeholder: '#8B5CF6',
    initialValue: '#8B5CF6',
    validate: (value) => {
      if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value)) {
        return 'Must be a valid hex color (e.g., #FF5733)';
      }
    },
  });

  if (typeof secondaryColor === 'symbol') {
    cancel('Operation cancelled.');
    process.exit(0);
  }

  const welcomeHeadline = await text({
    message: 'Welcome screen headline:',
    placeholder: 'Welcome to ' + projectName,
    initialValue: 'Welcome to ' + projectName,
  });

  if (typeof welcomeHeadline === 'symbol') {
    cancel('Operation cancelled.');
    process.exit(0);
  }

  const welcomeSubtext = await text({
    message: 'Welcome screen subtext:',
    placeholder: 'Get started with the best experience',
    initialValue: 'Get started with the best experience',
  });

  if (typeof welcomeSubtext === 'symbol') {
    cancel('Operation cancelled.');
    process.exit(0);
  }

  // Generate spec content
  const specContent = generateSpecTemplate({
    projectName: projectName as string,
    primaryColor: primaryColor as string,
    secondaryColor: secondaryColor as string,
    welcomeHeadline: welcomeHeadline as string,
    welcomeSubtext: welcomeSubtext as string,
  });

  // Write spec file
  await writeFile(specPath, specContent, 'utf-8');

  outro(
    pc.green('✓ ') +
      'Created spec.md successfully!\n\n' +
      pc.dim('Next steps:\n') +
      pc.dim('  1. Edit spec.md to customize your onboarding flow\n') +
      pc.dim('  2. Run ') +
      pc.cyan('onboardkit validate') +
      pc.dim(' to check your spec\n') +
      pc.dim('  3. Run ') +
      pc.cyan('onboardkit generate') +
      pc.dim(' to generate code')
  );
}

/**
 * Generate spec template with user-provided values
 */
function generateSpecTemplate(data: {
  projectName: string;
  primaryColor: string;
  secondaryColor: string;
  welcomeHeadline: string;
  welcomeSubtext: string;
}): string {
  return `# ${data.projectName}

<!-- OnboardKit Specification -->
<!-- Edit this file to customize your onboarding flow -->

## Config

- Platform: expo
- Navigation: react-navigation
- Styling: stylesheet

## Theme

- Primary: ${data.primaryColor}
- Secondary: ${data.secondaryColor}
- Background: #FFFFFF
- Surface: #F5F5F5
- Text: #000000
- Text Secondary: #666666
- Error: #DC2626
- Success: #10B981
- Font: System
- Border Radius: 12

## Welcome Screen

- Headline: ${data.welcomeHeadline}
- Subtext: ${data.welcomeSubtext}
- Image: welcome-illustration
- CTA: Get Started
- Skip: Skip

## Onboarding Steps

### Step 1

- Title: First Step
- Headline: Discover Amazing Features
- Subtext: Learn how to make the most of ${data.projectName}
- Image: onboarding-1

### Step 2

- Title: Second Step
- Headline: Personalize Your Experience
- Subtext: Customize settings to match your preferences
- Image: onboarding-2

### Step 3

- Title: Third Step
- Headline: You're All Set!
- Subtext: Start exploring and enjoy the journey
- Image: onboarding-3

## Login

- Methods: [email, google, apple]
- Headline: Welcome back!

## Name Capture

- Headline: What should we call you?
- Fields: [first_name, last_name]
- CTA: Continue

<!-- Optional: Uncomment to add a soft paywall -->
<!-- ## Soft Paywall

- Headline: Unlock Premium Features
- Subtext: Get unlimited access to all features
- Features:
  - Unlimited projects
  - Priority support
  - Advanced analytics
  - Custom themes
- CTA: Start Free Trial
- Skip: Maybe Later
- Price: $9.99/month -->

<!-- Optional: Uncomment to add a hard paywall -->
<!-- ## Hard Paywall

- Headline: Choose Your Plan
- CTA: Subscribe Now
- Restore: Restore Purchase
- Plans:
  - Name: Basic
    Price: $4.99
    Period: /month
    Features:
      - 5 projects
      - Email support
      - Basic analytics
    Highlighted: false
  - Name: Pro
    Price: $9.99
    Period: /month
    Features:
      - Unlimited projects
      - Priority support
      - Advanced analytics
    Highlighted: true -->
`;
}
