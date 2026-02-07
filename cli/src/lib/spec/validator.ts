import { ZodError } from 'zod';
import {
  OnboardingSpecSchema,
  type OnboardingSpec,
  type ValidationResult,
  type ValidationError,
} from './schema.js';

/**
 * Validate parsed spec data against the schema
 */
export function validateSpec(data: unknown): ValidationResult<OnboardingSpec> {
  const result = OnboardingSpecSchema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  return {
    success: false,
    errors: formatZodErrors(result.error),
  };
}

/**
 * Format Zod validation errors into user-friendly messages
 */
function formatZodErrors(error: ZodError): ValidationError[] {
  return error.errors.map((err) => {
    const path = err.path.map((p) => String(p));
    let message = err.message;

    // Enhance error messages with actionable guidance
    if (err.code === 'invalid_type') {
      if (err.expected === 'string') {
        message = `Expected a text value, but got ${err.received}. Please provide a valid string.`;
      } else if (err.expected === 'number') {
        message = `Expected a number, but got ${err.received}. Please provide a numeric value.`;
      } else if (err.expected === 'array') {
        message = `Expected a list, but got ${err.received}. Please provide an array of values.`;
      }
    } else if (err.code === 'invalid_string' && 'validation' in err && err.validation === 'regex') {
      if (path.some((p) => p.toLowerCase().includes('color'))) {
        message = `Invalid color format. Please use a valid hex color (e.g., #FF5733 or #F57).`;
      }
    } else if (err.code === 'too_small') {
      if (err.type === 'string') {
        message = `This field cannot be empty. Please provide a value.`;
      } else if (err.type === 'array') {
        message = `This list must have at least ${err.minimum} item(s). Please add more items.`;
      }
    } else if (err.code === 'invalid_literal') {
      message = `Expected value "${err.expected}", but got "${err.received}". Please use the correct value.`;
    } else if (err.code === 'invalid_enum_value') {
      const options = err.options.join(', ');
      message = `Invalid value "${err.received}". Valid options are: ${options}.`;
    }

    return {
      path,
      message,
      code: err.code,
    };
  });
}

/**
 * Format validation errors for display in terminal
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  const lines: string[] = [];

  lines.push('Validation failed with the following errors:\n');

  for (const error of errors) {
    const pathStr = error.path.length > 0 ? error.path.join('.') : 'root';
    lines.push(`  ❌ ${pathStr}`);
    lines.push(`     ${error.message}\n`);
  }

  lines.push('Please fix these errors and try again.');

  return lines.join('\n');
}

/**
 * Check if a spec has optional sections
 */
export function getSpecFeatures(spec: OnboardingSpec): {
  hasSoftPaywall: boolean;
  hasHardPaywall: boolean;
  stepCount: number;
} {
  return {
    hasSoftPaywall: spec.softPaywall !== undefined,
    hasHardPaywall: spec.hardPaywall !== undefined,
    stepCount: spec.onboardingSteps.length,
  };
}
