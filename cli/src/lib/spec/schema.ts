import { z } from 'zod';

/**
 * Hex color validation regex
 */
const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

/**
 * Configuration schema for platform, navigation, and styling
 */
export const ConfigSchema = z.object({
  platform: z.literal('expo'),
  navigation: z.enum(['react-navigation', 'expo-router']),
  styling: z.literal('stylesheet'),
});

/**
 * Theme schema for colors, typography, and spacing
 */
export const ThemeSchema = z.object({
  primary: z.string().regex(hexColorRegex, 'Must be a valid hex color'),
  secondary: z.string().regex(hexColorRegex, 'Must be a valid hex color'),
  background: z.string().regex(hexColorRegex, 'Must be a valid hex color'),
  surface: z.string().regex(hexColorRegex, 'Must be a valid hex color'),
  text: z.string().regex(hexColorRegex, 'Must be a valid hex color'),
  textSecondary: z.string().regex(hexColorRegex, 'Must be a valid hex color'),
  error: z.string().regex(hexColorRegex, 'Must be a valid hex color'),
  success: z.string().regex(hexColorRegex, 'Must be a valid hex color'),
  font: z.string().min(1),
  borderRadius: z.number().min(0),
});

/**
 * Welcome screen schema
 */
export const WelcomeScreenSchema = z.object({
  headline: z.string().min(1),
  subtext: z.string().min(1),
  image: z.string().min(1),
  cta: z.string().min(1),
  skip: z.string().optional(),
});

/**
 * Onboarding step schema
 */
export const OnboardingStepSchema = z.object({
  title: z.string().min(1),
  headline: z.string().min(1),
  subtext: z.string().min(1),
  image: z.string().min(1),
});

/**
 * Soft paywall schema (optional)
 */
export const SoftPaywallSchema = z.object({
  headline: z.string().min(1),
  subtext: z.string().min(1),
  features: z.array(z.string()).min(1),
  cta: z.string().min(1),
  skip: z.string().optional(),
  price: z.string().min(1),
});

/**
 * Login methods enum
 */
export const LoginMethodSchema = z.enum(['email', 'google', 'apple', 'phone']);

/**
 * Login screen schema
 */
export const LoginSchema = z.object({
  methods: z.array(LoginMethodSchema).min(1),
  headline: z.string().min(1),
});

/**
 * Name capture field types
 */
export const NameCaptureFieldSchema = z.enum([
  'first_name',
  'last_name',
  'full_name',
  'email',
  'username',
]);

/**
 * Name capture screen schema
 */
export const NameCaptureSchema = z.object({
  headline: z.string().min(1),
  fields: z.array(NameCaptureFieldSchema).min(1),
  cta: z.string().min(1),
});

/**
 * Plan schema for hard paywall
 */
export const PlanSchema = z.object({
  name: z.string().min(1),
  price: z.string().min(1),
  period: z.string().min(1),
  features: z.array(z.string()).min(1),
  highlighted: z.boolean().optional(),
});

/**
 * Hard paywall schema (optional)
 */
export const HardPaywallSchema = z.object({
  headline: z.string().min(1),
  plans: z.array(PlanSchema).min(1),
  cta: z.string().min(1),
  restore: z.string().min(1),
});

/**
 * Complete onboarding specification schema
 */
export const OnboardingSpecSchema = z.object({
  projectName: z.string().min(1),
  config: ConfigSchema,
  theme: ThemeSchema,
  welcome: WelcomeScreenSchema,
  onboardingSteps: z.array(OnboardingStepSchema).min(1),
  softPaywall: SoftPaywallSchema.optional(),
  login: LoginSchema,
  nameCapture: NameCaptureSchema,
  hardPaywall: HardPaywallSchema.optional(),
});

/**
 * TypeScript type inference from Zod schemas
 */
export type Config = z.infer<typeof ConfigSchema>;
export type Theme = z.infer<typeof ThemeSchema>;
export type WelcomeScreen = z.infer<typeof WelcomeScreenSchema>;
export type OnboardingStep = z.infer<typeof OnboardingStepSchema>;
export type SoftPaywall = z.infer<typeof SoftPaywallSchema>;
export type LoginMethod = z.infer<typeof LoginMethodSchema>;
export type Login = z.infer<typeof LoginSchema>;
export type NameCaptureField = z.infer<typeof NameCaptureFieldSchema>;
export type NameCapture = z.infer<typeof NameCaptureSchema>;
export type Plan = z.infer<typeof PlanSchema>;
export type HardPaywall = z.infer<typeof HardPaywallSchema>;
export type OnboardingSpec = z.infer<typeof OnboardingSpecSchema>;

/**
 * Screen type enumeration
 */
export type ScreenType =
  | 'welcome'
  | 'onboarding-step'
  | 'soft-paywall'
  | 'login'
  | 'name-capture'
  | 'hard-paywall'
  | 'home';

/**
 * Screen manifest for generation
 */
export interface ScreenManifest {
  type: ScreenType;
  fileName: string;
  templateName: string;
  data: Record<string, unknown>;
}

/**
 * Validation result wrapper
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: ValidationError[] };

/**
 * Validation error details
 */
export interface ValidationError {
  path: string[];
  message: string;
  code: string;
}
