# OnboardKit Usage Examples

## Quick Start

### 1. Create a New Spec

```bash
$ npx onboardkit init

┌  OnboardKit Init
│
◆  What is your app name?
│  MyFinanceApp
│
◆  Primary color (hex):
│  #10B981
│
◆  Secondary color (hex):
│  #3B82F6
│
◆  Welcome screen headline:
│  Take Control of Your Finances
│
◆  Welcome screen subtext:
│  Track expenses, set budgets, and achieve your goals
│
└  ✓ Created spec.md successfully!

   Next steps:
     1. Edit spec.md to customize your onboarding flow
     2. Run onboardkit validate to check your spec
     3. Run onboardkit generate to generate code
```

### 2. Validate Your Spec

```bash
$ npx onboardkit validate

┌  OnboardKit Validate
│
◇  Parsing spec file...
│
◇  Validating spec...
│
└  ✓ Spec is valid!

   Spec Summary:
   ──────────────────────────────────────────────────
     Project: MyFinanceApp
     Platform: expo
     Primary Color: #10B981
     Onboarding Steps: 3
     Soft Paywall: ✗
     Hard Paywall: ✗
     Login Methods: email, google, apple
   ──────────────────────────────────────────────────
     Spec Hash: a3f5b2c8d1e9f4a7...

   Ready to generate! Run onboardkit generate to create your screens.
```

### 3. Validation Errors Example

```bash
$ npx onboardkit validate

┌  OnboardKit Validate
│
◇  Parsing spec file...
│
◇  Validating spec...
│
└  ✗ Validation failed

Validation failed with the following errors:

  ❌ theme.primary
     Invalid color format. Please use a valid hex color (e.g., #FF5733 or #F57).

  ❌ onboardingSteps
     This list must have at least 1 item(s). Please add more items.

  ❌ login.methods
     Invalid value "facebook". Valid options are: email, google, apple, phone.

Please fix these errors and try again.
```

## Advanced Usage

### Custom Spec Path

```bash
# Validate custom spec file
$ npx onboardkit validate --spec ./specs/mobile-app.md

# Use relative or absolute paths
$ npx onboardkit validate --spec /Users/ali/project/spec.md
```

### Verbose Mode

```bash
# Show parsed data before validation
$ npx onboardkit validate --verbose

┌  OnboardKit Validate
│
◇  Parsing spec file...
│
└  Parsed spec data:
{
  "projectName": "MyFinanceApp",
  "config": {
    "platform": "expo",
    "navigation": "react-navigation",
    "styling": "stylesheet"
  },
  "theme": {
    "primary": "#10B981",
    "secondary": "#3B82F6",
    ...
  },
  ...
}

◇  Validating spec...
│
└  ✓ Spec is valid!
```

## Example Specs

### Minimal Spec

```markdown
# MinimalApp

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
- Headline: Welcome!
- Subtext: Get started now
- Image: welcome
- CTA: Start

## Onboarding Steps

### Step 1
- Title: First Step
- Headline: Learn the basics
- Subtext: This is your first step
- Image: step1

## Login
- Methods: [email]
- Headline: Sign in

## Name Capture
- Headline: Your name?
- Fields: [first_name]
- CTA: Continue
```

### Finance App (with Soft Paywall)

See: `examples/finance-app.md`

Features:
- 3 onboarding steps
- Soft paywall with 5 features
- Email, Google, Apple login
- Green theme (#10B981)

### Fitness App (with Both Paywalls)

See: `examples/fitness-app.md`

Features:
- 3 onboarding steps
- Soft paywall (trial offer)
- Hard paywall (3 pricing tiers)
- Orange theme (#F59E0B)

### SaaS App (Hard Paywall Only)

See: `examples/saas-app.md`

Features:
- 2 onboarding steps
- Hard paywall (freemium + paid tiers)
- Team/enterprise pricing
- Indigo theme (#6366F1)

## Common Patterns

### Color Schemes

**Material Design**:
```markdown
## Theme
- Primary: #6366F1
- Secondary: #8B5CF6
- Background: #FFFFFF
- Surface: #F5F5F5
- Text: #111827
- Text Secondary: #6B7280
- Error: #EF4444
- Success: #10B981
```

**Dark Mode**:
```markdown
## Theme
- Primary: #60A5FA
- Secondary: #A78BFA
- Background: #111827
- Surface: #1F2937
- Text: #F9FAFB
- Text Secondary: #9CA3AF
- Error: #F87171
- Success: #34D399
```

**Pastel**:
```markdown
## Theme
- Primary: #FCA5A5
- Secondary: #FBBF24
- Background: #FFF7ED
- Surface: #FFFBEB
- Text: #78350F
- Text Secondary: #92400E
- Error: #DC2626
- Success: #10B981
```

### Login Methods

**Email Only**:
```markdown
## Login
- Methods: [email]
- Headline: Sign in with email
```

**Social Login**:
```markdown
## Login
- Methods: [google, apple]
- Headline: Sign in to continue
```

**All Methods**:
```markdown
## Login
- Methods: [email, google, apple, phone]
- Headline: Choose your sign-in method
```

### Name Capture Fields

**Basic**:
```markdown
## Name Capture
- Fields: [first_name]
```

**Full Name**:
```markdown
## Name Capture
- Fields: [first_name, last_name]
```

**With Email**:
```markdown
## Name Capture
- Fields: [first_name, last_name, email]
```

**Username Style**:
```markdown
## Name Capture
- Fields: [username, email]
```

### Soft Paywall Features

**Concise**:
```markdown
## Soft Paywall
- Features:
  - Feature 1
  - Feature 2
  - Feature 3
```

**Descriptive**:
```markdown
## Soft Paywall
- Features:
  - Unlimited budget categories
  - Advanced analytics and insights
  - Priority customer support
  - Export financial reports (PDF, CSV)
  - Automatic bill payment reminders
```

### Hard Paywall Plans

**Simple Tiers**:
```markdown
## Hard Paywall
- Plans:
  - Name: Free
    Price: $0
    Period: /forever
    Features:
      - Basic features
    Highlighted: false
  - Name: Pro
    Price: $9.99
    Period: /month
    Features:
      - Everything in Free
      - Premium features
    Highlighted: true
```

**Complex Pricing**:
```markdown
## Hard Paywall
- Plans:
  - Name: Monthly
    Price: $9.99
    Period: /month
    Features:
      - All features
      - Cancel anytime
    Highlighted: false
  - Name: Yearly
    Price: $99.99
    Period: /year
    Features:
      - All features
      - 2 months free
      - Priority support
    Highlighted: true
  - Name: Lifetime
    Price: $299.99
    Period: one-time
    Features:
      - All features forever
      - Free updates
      - VIP support
    Highlighted: false
```

## Error Messages Reference

### Common Validation Errors

**Missing Required Field**:
```
❌ projectName
   This field cannot be empty. Please provide a value.
```

**Invalid Color**:
```
❌ theme.primary
   Invalid color format. Please use a valid hex color (e.g., #FF5733 or #F57).
```

**Invalid Enum Value**:
```
❌ login.methods[0]
   Invalid value "facebook". Valid options are: email, google, apple, phone.
```

**Empty Array**:
```
❌ onboardingSteps
   This list must have at least 1 item(s). Please add more items.
```

**Wrong Type**:
```
❌ theme.borderRadius
   Expected a number, but got string. Please provide a numeric value.
```

**Invalid Platform**:
```
❌ config.platform
   Expected value "expo", but got "react-native". Please use the correct value.
```

## Tips & Tricks

### Quick Testing

Test a spec without saving:
```bash
# Create test spec
echo "# Test..." > /tmp/test-spec.md

# Validate it
npx onboardkit validate --spec /tmp/test-spec.md
```

### CI/CD Integration

Use in GitHub Actions:
```yaml
- name: Validate onboarding spec
  run: |
    npx onboardkit validate
    if [ $? -ne 0 ]; then
      echo "Spec validation failed"
      exit 1
    fi
```

### Multiple Specs

Organize specs by platform or variant:
```
project/
├── specs/
│   ├── ios-spec.md
│   ├── android-spec.md
│   └── web-spec.md
```

Validate each:
```bash
npx onboardkit validate --spec specs/ios-spec.md
npx onboardkit validate --spec specs/android-spec.md
```

### Version Control

Commit specs but not generated code:
```gitignore
# .gitignore
onboardkit-output/
.onboardkit/
```

Track spec changes:
```bash
git add spec.md
git commit -m "Update onboarding flow: add paywall"
```

### Collaboration

Share specs for review:
```bash
# Generate spec
npx onboardkit init

# Commit to branch
git checkout -b feature/new-onboarding
git add spec.md
git commit -m "Add onboarding spec"
git push

# Team reviews spec.md in PR
# After approval, generate code
npx onboardkit generate
```

## Troubleshooting

### "Spec file not found"

**Problem**: Can't find spec.md
**Solution**:
```bash
# Check current directory
pwd

# Look for spec
ls -la spec.md

# Or specify path
npx onboardkit validate --spec ./path/to/spec.md
```

### "Invalid color format"

**Problem**: Color validation failed
**Solution**:
- Use `#` prefix: `#FF5733` not `FF5733`
- Use valid hex: `#RGB` or `#RRGGBB`
- Valid examples: `#F57`, `#FF5733`, `#000`, `#FFFFFF`

### "This list must have at least 1 item"

**Problem**: Empty array or missing items
**Solution**:
```markdown
# Wrong
- Features:

# Right
- Features:
  - Feature 1
  - Feature 2

# Or inline
- Methods: [email, google]
```

### "Expected value 'expo'"

**Problem**: Platform must be 'expo'
**Solution**:
```markdown
# Wrong
- Platform: react-native

# Right
- Platform: expo
```

---

**See Also**:
- `examples/` directory for complete specs
- `src/lib/spec/README.md` for technical details
- `TASK-3-SUMMARY.md` for implementation notes
