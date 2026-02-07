import {
  AIValidationResult,
  AIRepairResult,
  AIEnhancementResult,
  AIParseError,
} from './types.js';
import { OnboardingSpec, OnboardingSpecSchema } from '../spec/schema.js';

/**
 * Extract JSON from AI response that might include markdown code blocks
 */
function extractJSON(content: string): string {
  // Try to find JSON in markdown code blocks
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)```/;
  const match = content.match(codeBlockRegex);

  if (match) {
    return match[1].trim();
  }

  // Try to find raw JSON (look for first { to last })
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }

  // Return as-is and let JSON.parse fail with better error
  return content.trim();
}

/**
 * Parse AI validation response
 */
export function parseValidationResponse(content: string): AIValidationResult {
  try {
    const json = extractJSON(content);
    const parsed = JSON.parse(json);

    // Validate structure
    if (typeof parsed.isValid !== 'boolean') {
      throw new AIParseError('Response missing required field: isValid');
    }

    if (!Array.isArray(parsed.issues)) {
      throw new AIParseError('Response missing required field: issues (must be array)');
    }

    // Validate each issue
    for (const issue of parsed.issues) {
      if (!issue.severity || !['error', 'warning', 'info'].includes(issue.severity)) {
        throw new AIParseError('Invalid issue severity');
      }
      if (!issue.path || typeof issue.path !== 'string') {
        throw new AIParseError('Invalid issue path');
      }
      if (!issue.message || typeof issue.message !== 'string') {
        throw new AIParseError('Invalid issue message');
      }
    }

    return {
      isValid: parsed.isValid,
      issues: parsed.issues,
      suggestions: parsed.suggestions || [],
    };
  } catch (error) {
    if (error instanceof AIParseError) {
      throw error;
    }
    throw new AIParseError(
      `Failed to parse validation response: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Parse AI repair response
 */
export function parseRepairResponse(content: string): AIRepairResult {
  try {
    const json = extractJSON(content);
    const parsed = JSON.parse(json);

    // Validate structure
    if (!parsed.repairedSpec) {
      throw new AIParseError('Response missing required field: repairedSpec');
    }

    if (!Array.isArray(parsed.changes)) {
      throw new AIParseError('Response missing required field: changes (must be array)');
    }

    if (!parsed.explanation || typeof parsed.explanation !== 'string') {
      throw new AIParseError('Response missing required field: explanation');
    }

    // Validate repaired spec against schema
    const validationResult = OnboardingSpecSchema.safeParse(parsed.repairedSpec);
    if (!validationResult.success) {
      throw new AIParseError(
        `Repaired spec is invalid: ${validationResult.error.errors.map((e) => e.message).join(', ')}`
      );
    }

    // Validate each change
    for (const change of parsed.changes) {
      if (!change.path || typeof change.path !== 'string') {
        throw new AIParseError('Invalid change path');
      }
      if (typeof change.before !== 'string') {
        throw new AIParseError('Invalid change before value');
      }
      if (typeof change.after !== 'string') {
        throw new AIParseError('Invalid change after value');
      }
      if (!change.reason || typeof change.reason !== 'string') {
        throw new AIParseError('Invalid change reason');
      }
    }

    return {
      repairedSpec: validationResult.data,
      changes: parsed.changes,
      explanation: parsed.explanation,
    };
  } catch (error) {
    if (error instanceof AIParseError) {
      throw error;
    }
    throw new AIParseError(
      `Failed to parse repair response: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Parse AI enhancement response
 */
export function parseEnhancementResponse(content: string): AIEnhancementResult {
  try {
    const json = extractJSON(content);
    const parsed = JSON.parse(json);

    // Validate structure
    if (!parsed.enhancedSpec) {
      throw new AIParseError('Response missing required field: enhancedSpec');
    }

    if (!Array.isArray(parsed.enhancements)) {
      throw new AIParseError('Response missing required field: enhancements (must be array)');
    }

    if (!parsed.explanation || typeof parsed.explanation !== 'string') {
      throw new AIParseError('Response missing required field: explanation');
    }

    // Validate enhanced spec against schema
    const validationResult = OnboardingSpecSchema.safeParse(parsed.enhancedSpec);
    if (!validationResult.success) {
      throw new AIParseError(
        `Enhanced spec is invalid: ${validationResult.error.errors.map((e) => e.message).join(', ')}`
      );
    }

    // Validate each enhancement
    const validTypes = ['headline', 'subtext', 'cta', 'feature', 'general'];
    for (const enhancement of parsed.enhancements) {
      if (!enhancement.path || typeof enhancement.path !== 'string') {
        throw new AIParseError('Invalid enhancement path');
      }
      if (typeof enhancement.before !== 'string') {
        throw new AIParseError('Invalid enhancement before value');
      }
      if (typeof enhancement.after !== 'string') {
        throw new AIParseError('Invalid enhancement after value');
      }
      if (!enhancement.type || !validTypes.includes(enhancement.type)) {
        throw new AIParseError('Invalid enhancement type');
      }
    }

    return {
      enhancedSpec: validationResult.data,
      enhancements: parsed.enhancements,
      explanation: parsed.explanation,
    };
  } catch (error) {
    if (error instanceof AIParseError) {
      throw error;
    }
    throw new AIParseError(
      `Failed to parse enhancement response: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Safely parse any AI response with error handling
 */
export function safeParseResponse<T>(
  content: string,
  parser: (content: string) => T,
  operation: string
): T {
  try {
    return parser(content);
  } catch (error) {
    if (error instanceof AIParseError) {
      throw new AIParseError(
        `Failed to parse ${operation} response from AI. The response may be malformed. Error: ${error.message}`
      );
    }
    throw error;
  }
}
