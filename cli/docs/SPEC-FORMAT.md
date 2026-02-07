# Spec Format Guide

Complete documentation for OnboardKit's markdown specification format.

## Overview

OnboardKit specs are markdown files that define your onboarding flow. The spec is parsed into a typed object, validated against a schema, and used to generate React Native/Expo code.

## File Structure

```markdown
# Project Name

## Config
...

## Theme
...

## Welcome Screen
...

## Onboarding Steps
### Step 1
...
### Step 2
...

## Soft Paywall (optional)
...

## Login
...

## Name Capture
...

## Hard Paywall (optional)
...
```

## Sections

### Project Name (Required)

The first H1 heading defines your project name.

**Syntax:**
```markdown
# ProjectName
```

**Example:**
```markdown
# FitTrack Pro
```

**Constraints:**
- Must be a level 1 heading (`#`)
- Used as project identifier
- Must be non-empty

---

### Config (Required)

Platform, navigation, and styling configuration.

**Syntax:**
```markdown
## Config

- Platform: expo
- Navigation: react-navigation
- Styling: stylesheet
```

**Fields:**

| Field | Type | Options | Description |
|-------|------|---------|-------------|
| Platform | literal | `expo` | Target platform (only Expo supported in v1.0) |
| Navigation | literal | `react-navigation` | Navigation library |
| Styling | literal | `stylesheet` | Styling approach |

**Constraints:**
- All fields required
- Values are case-sensitive
- Only listed options are valid

**Example:**
```markdown
## Config

- Platform: expo
- Navigation: react-navigation
- Styling: stylesheet
```

---

### Theme (Required)

Color palette, typography, and spacing configuration.

**Syntax:**
```markdown
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
```

**Fields:**

| Field | Type | Format | Description |
|-------|------|--------|-------------|
| Primary | string | `#RRGGBB` or `#RGB` | Primary brand color |
| Secondary | string | `#RRGGBB` or `#RGB` | Secondary brand color |
| Background | string | `#RRGGBB` or `#RGB` | Main background color |
| Surface | string | `#RRGGBB` or `#RGB` | Card/surface background |
| Text | string | `#RRGGBB` or `#RGB` | Primary text color |
| Text Secondary | string | `#RRGGBB` or `#RGB` | Secondary/muted text |
| Error | string | `#RRGGBB` or `#RGB` | Error state color |
| Success | string | `#RRGGBB` or `#RGB` | Success state color |
| Font | string | Any | Font family name |
| Border Radius | number | 0+ | Default border radius in pixels |

**Color Format:**
- Full hex: `#FF5733`
- Short hex: `#F53`
- Must include `#` prefix
- Case-insensitive (A-F or a-f)

**Font Values:**
- `System` - Platform default
- `Inter` - Custom font (must be loaded in app)
- Any font family string

**Example:**
```markdown
## Theme

- Primary: #F59E0B
- Secondary: #EF4444
- Background: #FAFAFA
- Surface: #FFFFFF
- Text: #1F2937
- Text Secondary: #9CA3AF
- Error: #DC2626
- Success: #059669
- Font: Inter
- Border Radius: 16
```

---

### Welcome Screen (Required)

First screen users see when launching the app.

**Syntax:**
```markdown
## Welcome Screen

- Headline: Your main headline
- Subtext: Supporting text
- Image: image-identifier
- CTA: Button text
- Skip: Skip button text (optional)
```

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Headline | string | Yes | Main heading |
| Subtext | string | Yes | Supporting description |
| Image | string | Yes | Image identifier/placeholder |
| CTA | string | Yes | Primary button text |
| Skip | string | No | Skip button text |

**Example:**
```markdown
## Welcome Screen

- Headline: Welcome to FitTrack Pro
- Subtext: Your fitness journey starts here
- Image: welcome-hero
- CTA: Get Started
- Skip: Browse First
```

**Generated Navigation:**
- CTA button → First onboarding step
- Skip button (if present) → Login screen

---

### Onboarding Steps (Required, 1+)

Tutorial/feature highlight steps shown after welcome.

**Syntax:**
```markdown
## Onboarding Steps

### Step 1

- Title: Step title
- Headline: Main headline
- Subtext: Description
- Image: image-identifier

### Step 2

- Title: Step title
- Headline: Main headline
- Subtext: Description
- Image: image-identifier
```

**Fields (per step):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Title | string | Yes | Step title (for progress indicator) |
| Headline | string | Yes | Main heading |
| Subtext | string | Yes | Description |
| Image | string | Yes | Image identifier |

**Constraints:**
- Must have at least 1 step
- Steps numbered automatically (Step 1, Step 2, etc.)
- Step order determines display order

**Example:**
```markdown
## Onboarding Steps

### Step 1

- Title: Track Workouts
- Headline: Log Every Rep
- Subtext: Record your workouts with our easy-to-use library
- Image: workout-tracking

### Step 2

- Title: Set Goals
- Headline: Define Your Targets
- Subtext: Set personalized goals and track progress
- Image: goal-setting

### Step 3

- Title: Stay Motivated
- Headline: Join the Community
- Subtext: Connect with others and share achievements
- Image: community
```

**Generated Navigation:**
- Next button → Next step or Soft Paywall/Login
- Back button → Previous step or Welcome
- Progress indicator showing current step

---

### Soft Paywall (Optional)

Optional paywall shown before login to highlight premium features.

**Syntax:**
```markdown
## Soft Paywall

- Headline: Unlock Premium
- Subtext: Get full access
- Features:
  - Feature 1
  - Feature 2
  - Feature 3
- CTA: Start Free Trial
- Skip: Maybe Later
- Price: $9.99/month
```

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Headline | string | Yes | Main heading |
| Subtext | string | Yes | Supporting text |
| Features | array | Yes | List of premium features |
| CTA | string | Yes | Primary button text |
| Skip | string | No | Skip button text |
| Price | string | Yes | Pricing display |

**Features Format:**
- Nested list items under `Features:`
- Each item on new line with `  -` prefix
- Minimum 1 feature required

**Example:**
```markdown
## Soft Paywall

- Headline: Unlock Your Full Potential
- Subtext: Get personalized workout plans and advanced tracking
- Features:
  - Custom workout plans
  - Video exercise guides
  - Nutrition tracking
  - Progress photos
  - Advanced analytics
- CTA: Start 14-Day Free Trial
- Skip: Maybe Later
- Price: $9.99/month
```

**Generated Navigation:**
- CTA button → Login or signup
- Skip button → Login screen

---

### Login (Required)

Authentication screen with multiple login methods.

**Syntax:**
```markdown
## Login

- Methods: [email, google, apple]
- Headline: Welcome back!
```

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Methods | array | Yes | Available login methods |
| Headline | string | Yes | Screen headline |

**Login Methods:**
- `email` - Email/password login
- `google` - Google Sign-In
- `apple` - Sign in with Apple
- `phone` - Phone number login

**Methods Format:**
- Inline array: `[method1, method2, method3]`
- At least 1 method required
- Order determines button order

**Example:**
```markdown
## Login

- Methods: [email, google, apple]
- Headline: Welcome back, athlete!
```

**Generated Screen:**
- Input fields for email (if email method)
- Social login buttons (if google/apple)
- "Create account" link → Name Capture
- "Forgot password" link (if email method)

---

### Name Capture (Required)

User information collection screen (signup flow).

**Syntax:**
```markdown
## Name Capture

- Headline: What should we call you?
- Fields: [first_name, last_name]
- CTA: Continue
```

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Headline | string | Yes | Screen headline |
| Fields | array | Yes | Form fields to collect |
| CTA | string | Yes | Submit button text |

**Field Types:**
- `first_name` - First name input
- `last_name` - Last name input
- `full_name` - Full name (single input)
- `email` - Email address
- `username` - Username

**Example:**
```markdown
## Name Capture

- Headline: Let's get to know you
- Fields: [first_name, last_name, email]
- CTA: Create Account
```

**Generated Screen:**
- Text input for each field
- Validation for email format
- Terms acceptance checkbox
- Submit button → Home or Hard Paywall

---

### Hard Paywall (Optional)

Subscription tier selection screen (gate before app access).

**Syntax:**
```markdown
## Hard Paywall

- Headline: Choose Your Plan
- CTA: Subscribe Now
- Restore: Restore Purchase
- Plans:
  - Name: Basic
    Price: $4.99
    Period: /month
    Features:
      - Feature 1
      - Feature 2
    Highlighted: false
  - Name: Pro
    Price: $9.99
    Period: /month
    Features:
      - Feature 1
      - Feature 2
      - Feature 3
    Highlighted: true
```

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Headline | string | Yes | Screen headline |
| CTA | string | Yes | Subscribe button text |
| Restore | string | Yes | Restore purchase button text |
| Plans | array | Yes | Subscription plans (1+) |

**Plan Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Name | string | Yes | Plan name |
| Price | string | Yes | Price amount |
| Period | string | Yes | Billing period |
| Features | array | Yes | Plan features (1+) |
| Highlighted | boolean | No | Highlight this plan |

**Example:**
```markdown
## Hard Paywall

- Headline: Choose Your Training Plan
- CTA: Subscribe Now
- Restore: Restore Purchase
- Plans:
  - Name: Starter
    Price: $4.99
    Period: /month
    Features:
      - Basic workout tracking
      - Exercise library
      - Progress charts
    Highlighted: false
  - Name: Pro
    Price: $9.99
    Period: /month
    Features:
      - Everything in Starter
      - Custom workout plans
      - Nutrition tracking
      - Video guides
    Highlighted: true
  - Name: Elite
    Price: $19.99
    Period: /month
    Features:
      - Everything in Pro
      - 1-on-1 coaching
      - Meal plans
      - Live sessions
    Highlighted: false
```

**Generated Screen:**
- Plan cards with pricing
- Feature comparison
- Visual highlight for recommended plan
- Subscribe button
- Restore purchases button

---

## Syntax Rules

### List Items

Key-value pairs using colon separator:

```markdown
- Key: value
- Another Key: another value
```

**Rules:**
- Split on first colon only
- Trim whitespace
- Remove surrounding quotes from values

### Arrays

**Inline format:**
```markdown
- Methods: [email, google, apple]
```

**Nested list format:**
```markdown
- Features:
  - Feature 1
  - Feature 2
  - Feature 3
```

### Numbers

```markdown
- Border Radius: 12
```

Numbers are parsed automatically (no quotes needed).

### Booleans

```markdown
- Highlighted: true
- Enabled: false
```

Must be lowercase `true` or `false`.

### Comments

```markdown
<!-- This is a comment -->
<!-- Comments are ignored by the parser -->
```

### Optional Sections

Sections can be commented out:

```markdown
<!-- ## Soft Paywall

- Headline: Unlock Premium
- ... -->
```

---

## Complete Example

```markdown
# FitTrack Pro

<!-- Complete example: Fitness tracking app -->

## Config

- Platform: expo
- Navigation: react-navigation
- Styling: stylesheet

## Theme

- Primary: #F59E0B
- Secondary: #EF4444
- Background: #FAFAFA
- Surface: #FFFFFF
- Text: #1F2937
- Text Secondary: #9CA3AF
- Error: #DC2626
- Success: #059669
- Font: System
- Border Radius: 12

## Welcome Screen

- Headline: Your Fitness Journey Starts Here
- Subtext: Track workouts, monitor progress, achieve goals
- Image: fitness-welcome
- CTA: Start Training
- Skip: Browse First

## Onboarding Steps

### Step 1

- Title: Track Workouts
- Headline: Log Every Rep, Every Set
- Subtext: Record workouts with our easy-to-use library
- Image: workout-logging

### Step 2

- Title: Set Goals
- Headline: Define Your Targets
- Subtext: Set personalized goals and track progress
- Image: goal-setting

### Step 3

- Title: Join Community
- Headline: Train Together
- Subtext: Connect with friends and stay motivated
- Image: community

## Soft Paywall

- Headline: Unlock Your Full Potential
- Subtext: Get personalized plans and advanced tracking
- Features:
  - Custom workout plans
  - Video exercise guides
  - Nutrition tracking
  - Progress photos
  - Advanced analytics
- CTA: Start 14-Day Free Trial
- Skip: Maybe Later
- Price: $9.99/month

## Login

- Methods: [email, google, apple]
- Headline: Welcome back, athlete!

## Name Capture

- Headline: What should we call you?
- Fields: [first_name, last_name]
- CTA: Continue

## Hard Paywall

- Headline: Choose Your Training Plan
- CTA: Subscribe Now
- Restore: Restore Purchase
- Plans:
  - Name: Starter
    Price: $4.99
    Period: /month
    Features:
      - Basic workout tracking
      - Exercise library
      - Progress charts
    Highlighted: false
  - Name: Pro
    Price: $9.99
    Period: /month
    Features:
      - Everything in Starter
      - Custom workout plans
      - Nutrition tracking
      - Video guides
      - Priority support
    Highlighted: true
  - Name: Elite
    Price: $19.99
    Period: /month
    Features:
      - Everything in Pro
      - 1-on-1 coaching
      - Personalized meal plans
      - Live workout sessions
    Highlighted: false
```

---

## Validation

Run validation to check your spec:

```bash
npx onboardkit validate
```

**Common validation errors:**

### Invalid hex color
```
Error: Theme.primary - Must be a valid hex color
Fix: Use format #RRGGBB or #RGB (e.g., #FF5733)
```

### Missing required field
```
Error: Welcome Screen missing required field: headline
Fix: Add "- Headline: Your headline text"
```

### Invalid enum value
```
Error: Config.platform - Invalid literal value, expected "expo"
Fix: Use exact value: Platform: expo
```

### Empty array
```
Error: Onboarding Steps must have at least 1 step
Fix: Add at least one ### Step 1 section
```

### Invalid array format
```
Error: Login.methods - Expected array
Fix: Use format: Methods: [email, google]
```

---

## Best Practices

### Color Selection

- **Use brand colors** for Primary and Secondary
- **High contrast** between Text and Background
- **Accessibility** - ensure WCAG AA compliance
- **Consistent palette** - use online tools like Coolors

### Content Writing

- **Headlines** - Short (3-7 words), action-oriented
- **Subtext** - One sentence, clear value proposition
- **Features** - Benefits not features (e.g., "Save 10 hours/week" not "Automation")
- **CTAs** - Action verbs (Start, Get, Unlock, Join)

### Navigation Flow

**Recommended flow:**
```
Welcome → Onboarding Steps → Soft Paywall (optional) →
Login → Name Capture → Hard Paywall (optional) → Home
```

### Onboarding Steps

- **3 steps ideal** - Don't overwhelm users
- **Progressive disclosure** - Start simple, add complexity
- **Show value** - Each step should highlight a benefit
- **Visual consistency** - Similar image style across steps

### Paywalls

**Soft Paywall:**
- Before login
- Skippable
- 3-5 features max
- Price displayed clearly

**Hard Paywall:**
- After signup
- Not skippable
- 2-3 plans ideal
- Highlight recommended plan

---

## TypeScript Types

The spec is validated against these Zod schemas:

```typescript
type OnboardingSpec = {
  projectName: string;
  config: {
    platform: 'expo';
    navigation: 'react-navigation';
    styling: 'stylesheet';
  };
  theme: {
    primary: string;        // hex color
    secondary: string;      // hex color
    background: string;     // hex color
    surface: string;        // hex color
    text: string;          // hex color
    textSecondary: string; // hex color
    error: string;         // hex color
    success: string;       // hex color
    font: string;
    borderRadius: number;
  };
  welcome: {
    headline: string;
    subtext: string;
    image: string;
    cta: string;
    skip?: string;
  };
  onboardingSteps: Array<{
    title: string;
    headline: string;
    subtext: string;
    image: string;
  }>;
  softPaywall?: {
    headline: string;
    subtext: string;
    features: string[];
    cta: string;
    skip?: string;
    price: string;
  };
  login: {
    methods: ('email' | 'google' | 'apple' | 'phone')[];
    headline: string;
  };
  nameCapture: {
    headline: string;
    fields: ('first_name' | 'last_name' | 'full_name' | 'email' | 'username')[];
    cta: string;
  };
  hardPaywall?: {
    headline: string;
    plans: Array<{
      name: string;
      price: string;
      period: string;
      features: string[];
      highlighted?: boolean;
    }>;
    cta: string;
    restore: string;
  };
};
```

---

## See Also

- [CLI Reference](CLI-REFERENCE.md) - All CLI commands
- [User Guide](USER-GUIDE.md) - Step-by-step tutorial
- [Examples](/examples/) - Complete example specs
