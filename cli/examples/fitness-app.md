# FitTrack Pro

<!-- Complete example: Fitness tracking app with soft and hard paywalls -->

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
- Subtext: Track workouts, monitor progress, and achieve your fitness goals
- Image: fitness-welcome
- CTA: Start Training
- Skip: Browse First

## Onboarding Steps

### Step 1

- Title: Track Workouts
- Headline: Log Every Rep, Every Set
- Subtext: Record your workouts with our easy-to-use exercise library
- Image: workout-logging

### Step 2

- Title: Set Goals
- Headline: Define Your Targets
- Subtext: Set personalized fitness goals and track your progress over time
- Image: goal-setting

### Step 3

- Title: Join Community
- Headline: Train Together
- Subtext: Connect with friends, share achievements, and stay motivated
- Image: community

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
