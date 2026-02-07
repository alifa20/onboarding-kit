# With Paywall Example

Onboarding flow with soft paywall before login.

## Overview

This example demonstrates onboarding with a soft paywall:
- Welcome screen
- 3 onboarding steps
- **Soft paywall** (skippable feature upsell)
- Login screen
- Name capture screen

Perfect for:
- Freemium apps
- Subscription-based apps
- Apps with premium features

## Features

- **Soft paywall** - Highlight premium features before login
- **Skippable** - Users can continue without subscribing
- **Feature-focused** - Clear value proposition

## Usage

### Generate from this spec

```bash
cd your-expo-project

# Copy spec
cp node_modules/onboardkit/examples/with-paywall/spec.md ./

# Generate
npx onboardkit generate

# Output in ./onboardkit-output/
```

### What's Generated

Everything from the basic example, plus:

**Additional Screen:**
- `SoftPaywallScreen.tsx` - Feature upsell with pricing
  - Feature list
  - Pricing display
  - CTA button
  - Skip button

**Navigation Flow:**

```
Welcome → Steps → Soft Paywall → Login → Name Capture → Home
                      ↓ (skip)
                     Login
```

## Soft Paywall Best Practices

### When to Show

Show soft paywall:
- After onboarding steps (user understands value)
- Before login (low commitment point)
- When user hasn't seen it before (track in storage)

Don't show:
- Immediately on app open (no context)
- After every action (annoying)
- To existing subscribers

### What to Include

**Must have:**
- Clear headline (value proposition)
- 3-5 key features (benefits, not features)
- Pricing (transparent)
- Clear CTA ("Start Free Trial")
- Skip option ("Maybe Later")

**Optional:**
- Social proof ("Join 10,000+ users")
- Urgency ("Limited time offer")
- Guarantee ("Cancel anytime")

### Customization

Edit the Soft Paywall section in spec.md:

```markdown
## Soft Paywall

- Headline: Unlock Premium Features
- Subtext: Get unlimited access
- Features:
  - Unlimited projects
  - Priority support
  - Advanced analytics
  - Custom themes
  - Export to PDF
- CTA: Start 14-Day Free Trial
- Skip: Maybe Later
- Price: $9.99/month
```

## Implementation Notes

### Track Paywall Views

```typescript
// SoftPaywallScreen.tsx
useEffect(() => {
  // Track that user saw paywall
  AsyncStorage.setItem('sawPaywall', 'true');
}, []);
```

### Handle Subscription

The generated screen is UI-only. Add subscription logic:

```typescript
import { useRevenueCat } from '@revenuecat/purchases-react-native';

const handleSubscribe = async () => {
  try {
    await Purchases.purchasePackage(selectedPackage);
    navigation.navigate('Home');
  } catch (error) {
    // Handle error
  }
};
```

### Skip Logic

```typescript
const handleSkip = async () => {
  // Track skip
  await Analytics.track('paywall_skipped');

  // Continue to login
  navigation.navigate('Login');
};
```

## Metrics to Track

- **View rate** - % of users who see paywall
- **Conversion rate** - % who subscribe
- **Skip rate** - % who skip
- **Feature engagement** - Which features drive conversions

## Next Steps

After generating:

1. **Integrate subscription SDK**
   ```bash
   npx expo install @revenuecat/purchases-react-native
   # or
   npx expo install react-native-iap
   ```

2. **Add subscription logic**
   - Configure products in App Store Connect / Google Play
   - Implement purchase flow
   - Handle subscription status
   - Restore purchases

3. **Add analytics**
   ```bash
   npx expo install @segment/analytics-react-native
   ```

4. **Test**
   - Test purchase flow
   - Test skip flow
   - Test restoration
   - Test subscription status

## See Also

- [Basic Example](../basic/) - Without paywall
- [Full-Featured Example](../full-featured/) - With hard paywall too
- [Spec Format Guide](../../docs/SPEC-FORMAT.md) - Complete spec documentation
