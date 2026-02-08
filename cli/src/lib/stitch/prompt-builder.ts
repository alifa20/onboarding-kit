/**
 * Stitch prompt builder
 * Generates Stitch-compatible prompts for each screen
 */

import type { OnboardingSpec } from '../spec/schema.js';
import type { StitchPrompt } from './types.js';

/**
 * Build Stitch prompts from validated spec
 */
export function buildStitchPrompts(spec: OnboardingSpec): StitchPrompt[] {
  const prompts: StitchPrompt[] = [];

  // Welcome screen
  prompts.push(buildWelcomePrompt(spec));

  // Onboarding steps
  spec.onboardingSteps.forEach((step, index) => {
    prompts.push(buildOnboardingStepPrompt(spec, step, index));
  });

  // Soft paywall (if exists)
  if (spec.softPaywall) {
    prompts.push(buildSoftPaywallPrompt(spec));
  }

  // Login screen
  prompts.push(buildLoginPrompt(spec));

  // Name capture screen
  prompts.push(buildNameCapturePrompt(spec));

  // Hard paywall (if exists)
  if (spec.hardPaywall) {
    prompts.push(buildHardPaywallPrompt(spec));
  }

  // Home screen
  prompts.push(buildHomePrompt(spec));

  return prompts;
}

/**
 * Build welcome screen prompt
 */
function buildWelcomePrompt(spec: OnboardingSpec): StitchPrompt {
  const { welcome, theme, projectName } = spec;

  const prompt = `Create a mobile welcome screen for "${projectName}".

**Layout:**
- Full-screen design with the following elements arranged vertically:
  1. Hero image or illustration at the top (${welcome.image})
  2. Large headline in the middle: "${welcome.headline}"
  3. Supporting subtext below: "${welcome.subtext}"
  4. Primary CTA button at the bottom: "${welcome.cta}"
  ${welcome.skip ? `5. "Skip" text link below the CTA: "${welcome.skip}"` : ''}

**Visual Style:**
- Primary brand color: ${theme.primary}
- Background color: ${theme.background}
- Text color: ${theme.text}
- Button: use primary color with white text
- Font: ${theme.font}
- Border radius: ${theme.borderRadius}px for rounded corners
- Generous padding and spacing for a clean, premium feel

**Design Guidelines:**
- Modern, minimal aesthetic
- High contrast for readability
- Professional illustration style for the hero image
- Center-aligned content
- Mobile-first design (portrait orientation)`;

  return {
    screenId: 'welcome',
    screenName: 'Welcome Screen',
    prompt,
    deviceType: 'MOBILE',
  };
}

/**
 * Build onboarding step prompt
 */
function buildOnboardingStepPrompt(
  spec: OnboardingSpec,
  step: (typeof spec.onboardingSteps)[0],
  index: number
): StitchPrompt {
  const { theme } = spec;
  const stepNumber = index + 1;
  const totalSteps = spec.onboardingSteps.length;

  const prompt = `Create an onboarding step screen (${stepNumber} of ${totalSteps}).

**Layout:**
- Progress indicator at the top showing step ${stepNumber} of ${totalSteps}
- Hero image or illustration: ${step.image}
- Headline: "${step.headline}"
- Subtext: "${step.subtext}"
- "Next" button at the bottom
- "Back" or "Skip" link (secondary action)

**Visual Style:**
- Primary color: ${theme.primary}
- Secondary color: ${theme.secondary}
- Background: ${theme.background}
- Text color: ${theme.text}
- Font: ${theme.font}
- Border radius: ${theme.borderRadius}px
- Progress indicator uses primary color for active steps

**Design Guidelines:**
- Educational and engaging tone
- Clear visual hierarchy
- Smooth, friendly illustrations
- Easy-to-scan content
- Swipeable feel (even though navigation is via buttons)`;

  return {
    screenId: `onboarding-step-${index}`,
    screenName: `${step.title}`,
    prompt,
    deviceType: 'MOBILE',
  };
}

/**
 * Build soft paywall prompt
 */
function buildSoftPaywallPrompt(spec: OnboardingSpec): StitchPrompt {
  const { softPaywall, theme } = spec;
  if (!softPaywall) {
    throw new Error('Soft paywall not defined in spec');
  }

  const featuresText = softPaywall.features.map((f) => `  - ${f}`).join('\n');

  const prompt = `Create a soft paywall screen (skippable premium offer).

**Layout:**
- Header with value proposition: "${softPaywall.headline}"
- Supporting text: "${softPaywall.subtext}"
- Feature list (with checkmarks):
${featuresText}
- Pricing display: ${softPaywall.price}
- Primary CTA button: "${softPaywall.cta}"
${softPaywall.skip ? `- Skip link: "${softPaywall.skip}"` : ''}

**Visual Style:**
- Primary color: ${theme.primary}
- Success color for checkmarks: ${theme.success}
- Background: ${theme.surface}
- Text: ${theme.text}
- Font: ${theme.font}
- Border radius: ${theme.borderRadius}px

**Design Guidelines:**
- Premium, high-value aesthetic
- Clear benefit-driven copy
- Non-aggressive (user can skip)
- Checkmarks should be prominent and use success color
- Pricing should be clear and upfront`;

  return {
    screenId: 'soft-paywall',
    screenName: 'Soft Paywall',
    prompt,
    deviceType: 'MOBILE',
  };
}

/**
 * Build login screen prompt
 */
function buildLoginPrompt(spec: OnboardingSpec): StitchPrompt {
  const { login, theme } = spec;

  const methodsText = login.methods
    .map((method) => {
      switch (method) {
        case 'email':
          return '- Email input field with "Continue with Email" button';
        case 'google':
          return '- "Continue with Google" button (with Google logo)';
        case 'apple':
          return '- "Continue with Apple" button (with Apple logo)';
        case 'phone':
          return '- Phone number input with country code picker';
        default:
          return '';
      }
    })
    .join('\n');

  const prompt = `Create a login/authentication screen.

**Layout:**
- Headline at top: "${login.headline}"
- Authentication options:
${methodsText}
- Terms of service text/link at bottom

**Visual Style:**
- Primary color: ${theme.primary}
- Background: ${theme.background}
- Text: ${theme.text}
- Font: ${theme.font}
- Border radius: ${theme.borderRadius}px
- Social login buttons should include brand logos

**Design Guidelines:**
- Clean, trustworthy design
- Clear visual separation between login methods
- Proper spacing between interactive elements (touch targets)
- Professional authentication UI patterns
- Terms/privacy text in small, secondary text color`;

  return {
    screenId: 'login',
    screenName: 'Login Screen',
    prompt,
    deviceType: 'MOBILE',
  };
}

/**
 * Build name capture screen prompt
 */
function buildNameCapturePrompt(spec: OnboardingSpec): StitchPrompt {
  const { nameCapture, theme } = spec;

  const fieldsText = nameCapture.fields
    .map((field) => {
      const label = field.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      return `  - ${label} input field`;
    })
    .join('\n');

  const prompt = `Create a name/profile capture screen (signup form).

**Layout:**
- Headline: "${nameCapture.headline}"
- Form fields:
${fieldsText}
- Submit button: "${nameCapture.cta}"

**Visual Style:**
- Primary color: ${theme.primary}
- Background: ${theme.background}
- Text: ${theme.text}
- Error color: ${theme.error}
- Font: ${theme.font}
- Border radius: ${theme.borderRadius}px
- Input fields with subtle borders and focus states

**Design Guidelines:**
- Clean, minimal form design
- Clear field labels
- Proper input types (email keyboard, capitalization)
- Validation hints below fields
- Large touch targets for mobile
- Professional form UI patterns`;

  return {
    screenId: 'name-capture',
    screenName: 'Signup Screen',
    prompt,
    deviceType: 'MOBILE',
  };
}

/**
 * Build hard paywall prompt
 */
function buildHardPaywallPrompt(spec: OnboardingSpec): StitchPrompt {
  const { hardPaywall, theme } = spec;
  if (!hardPaywall) {
    throw new Error('Hard paywall not defined in spec');
  }

  const plansText = hardPaywall.plans
    .map((plan) => {
      const featuresText = plan.features.map((f) => `    - ${f}`).join('\n');
      return `  **${plan.name}** - ${plan.price}/${plan.interval}
${featuresText}`;
    })
    .join('\n\n');

  const prompt = `Create a hard paywall screen (required subscription to continue).

**Layout:**
- Header: "${hardPaywall.headline}"
- Subtext: "${hardPaywall.subtext}"
- Subscription plan cards:
${plansText}
- Primary CTA: "${hardPaywall.cta}"
- Restore purchases link at bottom

**Visual Style:**
- Primary color: ${theme.primary}
- Secondary color: ${theme.secondary}
- Background: ${theme.background}
- Surface: ${theme.surface}
- Text: ${theme.text}
- Font: ${theme.font}
- Border radius: ${theme.borderRadius}px

**Design Guidelines:**
- Premium, high-value presentation
- Clear plan comparison
- Highlight recommended/popular plan
- Professional pricing UI
- Clear benefit communication
- Non-aggressive but required (no skip option)`;

  return {
    screenId: 'hard-paywall',
    screenName: 'Hard Paywall',
    prompt,
    deviceType: 'MOBILE',
  };
}

/**
 * Build home screen prompt
 */
function buildHomePrompt(spec: OnboardingSpec): StitchPrompt {
  const { theme, projectName } = spec;

  const prompt = `Create a home screen placeholder for "${projectName}".

**Layout:**
- App header/navigation bar at top
- Main content area with welcome message
- Bottom navigation bar (if applicable)
- Placeholder content showing the app is ready

**Visual Style:**
- Primary color: ${theme.primary}
- Background: ${theme.background}
- Surface: ${theme.surface}
- Text: ${theme.text}
- Font: ${theme.font}
- Border radius: ${theme.borderRadius}px

**Design Guidelines:**
- Clean, modern app interface
- Professional navigation patterns
- Placeholder content that suggests a functional app
- Tab bar or drawer navigation as appropriate
- Consistent with the onboarding flow's visual style`;

  return {
    screenId: 'home',
    screenName: 'Home Screen',
    prompt,
    deviceType: 'MOBILE',
  };
}

/**
 * Format prompts as markdown files for manual review
 */
export function formatPromptsAsMarkdown(prompts: StitchPrompt[]): Map<string, string> {
  const files = new Map<string, string>();

  prompts.forEach((prompt) => {
    const filename = `${prompt.screenId}.md`;
    const content = `# ${prompt.screenName}

**Screen ID:** \`${prompt.screenId}\`
**Device Type:** ${prompt.deviceType}

---

${prompt.prompt}
`;
    files.set(filename, content);
  });

  return files;
}
