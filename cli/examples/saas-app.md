# TaskFlow

<!-- Complete example: SaaS productivity app with hard paywall only -->

## Config

- Platform: expo
- Navigation: react-navigation
- Styling: stylesheet

## Theme

- Primary: #6366F1
- Secondary: #8B5CF6
- Background: #FFFFFF
- Surface: #F8FAFC
- Text: #0F172A
- Text Secondary: #64748B
- Error: #DC2626
- Success: #10B981
- Font: System
- Border Radius: 8

## Welcome Screen

- Headline: Welcome to TaskFlow
- Subtext: Streamline your workflow and boost team productivity
- Image: saas-hero
- CTA: Get Started
- Skip: Learn More

## Onboarding Steps

### Step 1

- Title: Workspace Setup
- Headline: Create Your Workspace
- Subtext: Set up your team workspace and invite collaborators
- Image: workspace-setup

### Step 2

- Title: Team Collaboration
- Headline: Work Together Seamlessly
- Subtext: Assign tasks, share files, and communicate in real-time
- Image: collaboration

## Login

- Methods: [email, google]
- Headline: Sign in to TaskFlow

## Name Capture

- Headline: Tell us about yourself
- Fields: [first_name, last_name, email]
- CTA: Create Account

## Hard Paywall

- Headline: Choose the Right Plan for Your Team
- CTA: Start Free Trial
- Restore: Already subscribed?
- Plans:
  - Name: Starter
    Price: $0
    Period: /month
    Features:
      - Up to 3 team members
      - 5 projects
      - Basic task management
      - Email support
    Highlighted: false
  - Name: Professional
    Price: $12
    Period: /user/month
    Features:
      - Unlimited team members
      - Unlimited projects
      - Advanced workflows
      - Priority support
      - Custom integrations
      - Analytics dashboard
    Highlighted: true
  - Name: Enterprise
    Price: Custom
    Period: pricing
    Features:
      - Everything in Professional
      - SSO integration
      - Dedicated account manager
      - Custom training
      - SLA guarantee
      - Advanced security
    Highlighted: false
