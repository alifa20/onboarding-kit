import { OnboardingSpec } from '../../spec/schema.js';
import { AIProvider, AIEnhancementResult, ConversationContext } from '../types.js';
import { createProvider } from '../providers/factory.js';
import { parseEnhancementResponse, safeParseResponse } from '../parser.js';
import {
  ENHANCEMENT_SYSTEM_PROMPT,
  createEnhancementPrompt,
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
 * Options for spec enhancement
 */
export interface EnhanceSpecOptions {
  provider?: AIProvider;
  context?: ConversationContext;
}

/**
 * Result of spec enhancement operation
 */
export interface EnhanceSpecResult {
  enhancement: AIEnhancementResult;
  context: ConversationContext;
}

/**
 * Enhance specification using AI
 *
 * This sends a valid spec to the AI for enhancement,
 * improving headlines, subtext, CTAs, and feature descriptions
 * to be more engaging and user-friendly.
 */
export async function enhanceSpec(
  spec: OnboardingSpec,
  options: EnhanceSpecOptions = {}
): Promise<EnhanceSpecResult> {
  // Get or create provider
  const provider = options.provider || (await createProvider());

  // Get or create context
  let context = options.context || createContext(spec, 'enhance');

  // Update context with current operation
  context = updateOperation(context, 'enhance', spec);

  // Add system prompt if not in context
  if (context.messages.length === 0) {
    context = addSystemMessage(context, ENHANCEMENT_SYSTEM_PROMPT);
  }

  // Create user prompt
  const userPrompt = createEnhancementPrompt(spec);

  // Add user message to context
  context = addUserMessage(context, userPrompt);

  // Send request to AI with retry logic
  const response = await withRetry(() =>
    provider.sendMessage(context.messages, {
      maxTokens: 4096,
      temperature: 0.7, // Higher temperature for more creative enhancements
    })
  );

  // Add assistant response to context
  context = addAssistantMessage(context, response.content);

  // Parse enhancement result
  const enhancement = safeParseResponse(
    response.content,
    parseEnhancementResponse,
    'enhancement'
  );

  return {
    enhancement,
    context,
  };
}

/**
 * Quick enhancement (without context)
 */
export async function quickEnhance(spec: OnboardingSpec): Promise<OnboardingSpec> {
  const result = await enhanceSpec(spec);
  return result.enhancement.enhancedSpec;
}

/**
 * Format enhancement result for display
 */
export function formatEnhancementResult(result: AIEnhancementResult): string {
  const lines: string[] = [];

  lines.push('✓ Specification enhanced successfully!\n');
  lines.push(`Summary: ${result.explanation}\n`);

  if (result.enhancements.length > 0) {
    lines.push('Enhancements made:');

    // Group by type
    const byType = groupEnhancementsByType(result.enhancements);

    for (const [type, enhancements] of Object.entries(byType)) {
      if (enhancements.length > 0) {
        lines.push(`\n  ${capitalizeFirst(type)}s:`);
        for (const enhancement of enhancements) {
          lines.push(`    • ${enhancement.path}`);
          lines.push(`      Before: "${enhancement.before}"`);
          lines.push(`      After:  "${enhancement.after}"`);
        }
      }
    }
  }

  return lines.join('\n');
}

/**
 * Get enhancement summary (brief version)
 */
export function getEnhancementSummary(result: AIEnhancementResult): string {
  const count = result.enhancements.length;

  if (count === 0) {
    return 'No enhancements made';
  }

  const byType = groupEnhancementsByType(result.enhancements);
  const typeCounts = Object.entries(byType)
    .filter(([_, items]) => items.length > 0)
    .map(([type, items]) => `${items.length} ${type}${items.length > 1 ? 's' : ''}`)
    .join(', ');

  return `Enhanced ${count} field${count > 1 ? 's' : ''}: ${typeCounts}`;
}

/**
 * Group enhancements by type
 */
function groupEnhancementsByType(
  enhancements: AIEnhancementResult['enhancements']
): Record<string, typeof enhancements> {
  const groups: Record<string, typeof enhancements> = {
    headline: [],
    subtext: [],
    cta: [],
    feature: [],
    general: [],
  };

  for (const enhancement of enhancements) {
    groups[enhancement.type].push(enhancement);
  }

  return groups;
}

/**
 * Capitalize first letter of string
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Compare two specs and highlight differences
 */
export function compareSpecs(
  original: OnboardingSpec,
  enhanced: OnboardingSpec
): string[] {
  const differences: string[] = [];

  // This is a simple comparison - in a real implementation,
  // you might want to do a deep comparison of all fields
  if (JSON.stringify(original) !== JSON.stringify(enhanced)) {
    differences.push('Specifications differ');
  }

  return differences;
}
