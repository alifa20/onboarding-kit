# Full-Featured Example

Complete onboarding flow with all available features.

## Overview

This example demonstrates the complete OnboardKit feature set:
- Welcome screen
- Multiple onboarding steps
- **Soft paywall** (pre-login upsell)
- Login screen
- Name capture screen
- **Hard paywall** (subscription gate)

Perfect for:
- Subscription-based apps
- Premium apps with multiple tiers
- Apps requiring payment before access
- Learning all OnboardKit features

## Features

- **Both paywall types** - Soft (skippable) and hard (required)
- **Multiple pricing tiers** - Starter, Pro, Enterprise
- **Highlighted plan** - Visual emphasis on recommended tier
- **Complete flow** - Every screen type available

## Usage

### Generate from this spec

```bash
cd your-expo-project

# Copy spec
cp node_modules/onboardkit/examples/full-featured/spec.md ./

# Generate
npx onboardkit generate

# Output in ./onboardkit-output/
```

### What's Generated

**Screens (8):**
- `WelcomeScreen.tsx`
- `OnboardingStep1.tsx`
- `OnboardingStep2.tsx`
- `OnboardingStep3.tsx`
- `OnboardingStep4.tsx`
- `SoftPaywallScreen.tsx` - Skippable feature upsell
- `HardPaywallScreen.tsx` - Required subscription selection
- `LoginScreen.tsx`
- `NameCaptureScreen.tsx`
- `HomeScreen.tsx`

**Navigation Flow:**

```
Welcome
  ↓
Onboarding Steps (4)
  ↓
Soft Paywall → (skip) → Login
  ↓ (subscribe)           ↓
Login                Name Capture
  ↓                       ↓
Name Capture        Hard Paywall
  ↓                       ↓
Hard Paywall            Home
  ↓ (subscribe)
Home
```

## Paywall Strategy

### Soft Paywall (Before Login)

**Purpose:** Educate about premium features

**Characteristics:**
- Skippable
- Feature-focused
- Shown once per install
- Low-pressure

**When to use:**
- User understands app value
- After onboarding steps
- Before commitment (login)

### Hard Paywall (After Signup)

**Purpose:** Require subscription before app access

**Characteristics:**
- Not skippable
- Price-focused
- Multiple tiers
- Highlighted recommended plan

**When to use:**
- Subscription-first business model
- All features are premium
- After user has committed (signed up)

## Pricing Tier Strategy

### 3-Tier Structure

**Starter (Low):**
- Entry-level pricing
- Basic features
- Hook users with low commitment

**Pro (Recommended):**
- Highlighted visually
- Best value
- Most popular features
- Where you want most users

**Elite (High):**
- Premium pricing
- All features
- Anchoring effect (makes Pro look good)

### Customization

Edit the Hard Paywall section:

```markdown
## Hard Paywall

- Headline: Choose Your Plan
- CTA: Subscribe Now
- Restore: Restore Purchase
- Plans:
  - Name: Basic
    Price: $9.99
    Period: /month
    Features:
      - Feature 1
      - Feature 2
      - Feature 3
    Highlighted: false
  - Name: Pro
    Price: $19.99
    Period: /month
    Features:
      - Everything in Basic
      - Feature 4
      - Feature 5
      - Feature 6
    Highlighted: true  # Recommended
  - Name: Enterprise
    Price: $49.99
    Period: /month
    Features:
      - Everything in Pro
      - Feature 7
      - Feature 8
      - Priority support
    Highlighted: false
```

## Implementation Notes

### Subscription Management

Use a subscription SDK like RevenueCat:

```bash
npx expo install @revenuecat/purchases-react-native
```

```typescript
// Initialize in App.tsx
import Purchases from '@revenuecat/purchases-react-native';

useEffect(() => {
  Purchases.configure({
    apiKey: 'your_api_key',
  });
}, []);

// In HardPaywallScreen.tsx
const handleSubscribe = async (plan: Plan) => {
  try {
    const offering = await Purchases.getOfferings();
    const packageToPurchase = offering.current?.availablePackages.find(
      pkg => pkg.identifier === plan.name
    );

    if (packageToPurchase) {
      await Purchases.purchasePackage(packageToPurchase);
      navigation.navigate('Home');
    }
  } catch (error) {
    // Handle error
  }
};
```

### Restore Purchases

```typescript
const handleRestore = async () => {
  try {
    const customerInfo = await Purchases.restorePurchases();

    if (customerInfo.activeSubscriptions.length > 0) {
      navigation.navigate('Home');
    } else {
      Alert.alert('No purchases found');
    }
  } catch (error) {
    // Handle error
  }
};
```

### Check Subscription Status

```typescript
// In App.tsx or Auth Context
const checkSubscriptionStatus = async () => {
  const customerInfo = await Purchases.getCustomerInfo();

  if (customerInfo.activeSubscriptions.length > 0) {
    // User is subscribed - go to Home
    return true;
  } else {
    // User is not subscribed - show Hard Paywall
    return false;
  }
};
```

## Analytics & Metrics

Track these key metrics:

### Soft Paywall
- View rate
- Conversion rate (subscribe)
- Skip rate
- Time on screen

### Hard Paywall
- View rate (should be 100% of signups)
- Conversion rate per tier
- Time to decision
- Restore purchase rate

### Implementation

```typescript
import Analytics from '@segment/analytics-react-native';

// Soft Paywall view
Analytics.track('Soft Paywall Viewed');

// Soft Paywall conversion
Analytics.track('Soft Paywall Subscribed', {
  plan: 'Pro',
  price: 19.99,
});

// Hard Paywall view
Analytics.track('Hard Paywall Viewed');

// Hard Paywall conversion
Analytics.track('Subscription Started', {
  tier: 'Pro',
  price: 19.99,
  billing: 'monthly',
  source: 'hard_paywall',
});
```

## A/B Testing

Test paywall variations:

### Soft Paywall Tests
- Headline copy
- Feature list length (3 vs 5 vs 7)
- Pricing display
- CTA text ("Start Trial" vs "Unlock Features")

### Hard Paywall Tests
- Number of tiers (2 vs 3 vs 4)
- Which tier is highlighted
- Pricing strategy (monthly vs annual)
- Feature display (bullets vs icons)

## Next Steps

After generating:

1. **Configure subscription products**
   - App Store Connect (iOS)
   - Google Play Console (Android)
   - RevenueCat dashboard

2. **Implement subscription logic**
   ```bash
   npx expo install @revenuecat/purchases-react-native
   ```

3. **Add analytics**
   ```bash
   npx expo install @segment/analytics-react-native
   ```

4. **Test thoroughly**
   - Purchase flow
   - Restore purchases
   - Subscription status checking
   - Edge cases (network errors, etc.)

5. **Set up server-side validation**
   - Webhook from RevenueCat
   - Verify purchases server-side
   - Handle refunds/cancellations

## See Also

- [Basic Example](../basic/) - No paywalls
- [With Paywall Example](../with-paywall/) - Soft paywall only
- [Spec Format Guide](../../docs/SPEC-FORMAT.md) - Complete spec documentation
- [User Guide](../../docs/USER-GUIDE.md) - Step-by-step tutorials
