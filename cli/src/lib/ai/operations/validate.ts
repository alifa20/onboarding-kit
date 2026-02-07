import { OnboardingSpec, ValidationError } from '../../spec/schema.js';
import { AIProvider, AIValidationResult, ConversationContext } from '../types.js';
import { createProvider } from '../providers/factory.js';
import { parseValidationResponse, safeParseResponse } from '../parser.js';
import {
  VALIDATION_SYSTEM_PROMPT,
  createValidationPrompt,
} from '../prompts/index.js';
import {
  createContext,
  addSystemMessage,
  addUserMessage,
  addAssistantMessage,
  updateOperation,
} from '../context.js';
import { withRetry } from '../errors.js';

/**
 * Options for spec validation
 */
export interface ValidateSpecOptions {
  provider?: AIProvider;
  context?: ConversationContext;
  schemaErrors?: ValidationError[];
}

/**
 * Result of spec validation operation
 */
export interface ValidateSpecResult {
  validation: AIValidationResult;
  context: ConversationContext;
}

/**
 * Validate specification using AI
 *
 * This sends the spec to the AI provider for comprehensive validation,
 * checking for issues beyond schema validation like UX patterns,
 * accessibility, and best practices.
 */
export async function validateSpecWithAI(
  spec: OnboardingSpec,
  options: ValidateSpecOptions = {}
): Promise<ValidateSpecResult> {
  // Get or create provider
  const provider = options.provider || (await createProvider());

  // Get or create context
  let context = options.context || createContext(spec, 'validate');

  // Update context with current operation
  context = updateOperation(context, 'validate', spec);

  // Add system prompt if not in context
  if (context.messages.length === 0) {
    context = addSystemMessage(context, VALIDATION_SYSTEM_PROMPT);
  }

  // Create user prompt
  const userPrompt = createValidationPrompt(spec, options.schemaErrors);

  // Add user message to context
  context = addUserMessage(context, userPrompt);

  // Send request to AI with retry logic
  const response = await withRetry(() =>
    provider.sendMessage(context.messages, {
      maxTokens: 2048,
      temperature: 0.3, // Lower temperature for more consistent validation
    })
  );

  // Add assistant response to context
  context = addAssistantMessage(context, response.content);

  // Parse validation result
  const validation = safeParseResponse(
    response.content,
    parseValidationResponse,
    'validation'
  );

  return {
    validation,
    context,
  };
}

/**
 * Quick validation check (without context)
 */
export async function quickValidate(
  spec: OnboardingSpec,
  schemaErrors?: ValidationError[]
): Promise<AIValidationResult> {
  const result = await validateSpecWithAI(spec, { schemaErrors });
  return result.validation;
}

/**
 * Validate and return human-readable summary
 */
export function formatValidationResult(result: AIValidationResult): string {
  const lines: string[] = [];

  if (result.isValid) {
    lines.push('✓ Specification is valid!');

    if (result.suggestions && result.suggestions.length > 0) {
      lines.push('\nSuggestions for improvement:');
      for (const suggestion of result.suggestions) {
        lines.push(`  • ${suggestion}`);
      }
    }
  } else {
    lines.push('✗ Specification has issues:\n');

    // Group by severity
    const errors = result.issues.filter((i) => i.severity === 'error');
    const warnings = result.issues.filter((i) => i.severity === 'warning');
    const info = result.issues.filter((i) => i.severity === 'info');

    if (errors.length > 0) {
      lines.push('Errors:');
      for (const issue of errors) {
        lines.push(`  ❌ ${issue.path}: ${issue.message}`);
        if (issue.suggestion) {
          lines.push(`     → ${issue.suggestion}`);
        }
      }
      lines.push('');
    }

    if (warnings.length > 0) {
      lines.push('Warnings:');
      for (const issue of warnings) {
        lines.push(`  ⚠️  ${issue.path}: ${issue.message}`);
        if (issue.suggestion) {
          lines.push(`     → ${issue.suggestion}`);
        }
      }
      lines.push('');
    }

    if (info.length > 0) {
      lines.push('Info:');
      for (const issue of info) {
        lines.push(`  ℹ️  ${issue.path}: ${issue.message}`);
        if (issue.suggestion) {
          lines.push(`     → ${issue.suggestion}`);
        }
      }
      lines.push('');
    }

    if (result.suggestions && result.suggestions.length > 0) {
      lines.push('General suggestions:');
      for (const suggestion of result.suggestions) {
        lines.push(`  • ${suggestion}`);
      }
    }
  }

  return lines.join('\n');
}
