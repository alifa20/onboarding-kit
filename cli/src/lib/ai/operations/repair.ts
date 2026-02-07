import { OnboardingSpec, ValidationError } from '../../spec/schema.js';
import { AIProvider, AIRepairResult, ConversationContext } from '../types.js';
import { createProvider } from '../providers/factory.js';
import { parseRepairResponse, safeParseResponse } from '../parser.js';
import {
  REPAIR_SYSTEM_PROMPT,
  createRepairPrompt,
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
 * Options for spec repair
 */
export interface RepairSpecOptions {
  provider?: AIProvider;
  context?: ConversationContext;
}

/**
 * Result of spec repair operation
 */
export interface RepairSpecResult {
  repair: AIRepairResult;
  context: ConversationContext;
}

/**
 * Repair invalid specification using AI
 *
 * This sends the invalid spec along with validation errors to the AI,
 * which will attempt to fix the issues while preserving user intent.
 */
export async function repairSpec(
  invalidSpec: unknown,
  validationErrors: ValidationError[],
  options: RepairSpecOptions = {}
): Promise<RepairSpecResult> {
  // Get or create provider
  const provider = options.provider || (await createProvider());

  // Get or create context
  let context = options.context || createContext(undefined, 'repair');

  // Update context with current operation
  context = updateOperation(context, 'repair');

  // Add system prompt if not in context
  if (context.messages.length === 0) {
    context = addSystemMessage(context, REPAIR_SYSTEM_PROMPT);
  }

  // Create user prompt
  const userPrompt = createRepairPrompt(invalidSpec, validationErrors);

  // Add user message to context
  context = addUserMessage(context, userPrompt);

  // Send request to AI with retry logic
  const response = await withRetry(() =>
    provider.sendMessage(context.messages, {
      maxTokens: 4096,
      temperature: 0.3, // Lower temperature for more predictable repairs
    })
  );

  // Add assistant response to context
  context = addAssistantMessage(context, response.content);

  // Parse repair result
  const repair = safeParseResponse(
    response.content,
    parseRepairResponse,
    'repair'
  );

  return {
    repair,
    context,
  };
}

/**
 * Quick repair (without context)
 */
export async function quickRepair(
  invalidSpec: unknown,
  validationErrors: ValidationError[]
): Promise<OnboardingSpec> {
  const result = await repairSpec(invalidSpec, validationErrors);
  return result.repair.repairedSpec;
}

/**
 * Format repair result for display
 */
export function formatRepairResult(result: AIRepairResult): string {
  const lines: string[] = [];

  lines.push('✓ Specification repaired successfully!\n');
  lines.push(`Summary: ${result.explanation}\n`);

  if (result.changes.length > 0) {
    lines.push('Changes made:');
    for (const change of result.changes) {
      lines.push(`\n  Field: ${change.path}`);
      lines.push(`  Before: "${change.before}"`);
      lines.push(`  After:  "${change.after}"`);
      lines.push(`  Reason: ${change.reason}`);
    }
  }

  return lines.join('\n');
}

/**
 * Get repair summary (brief version)
 */
export function getRepairSummary(result: AIRepairResult): string {
  const changeCount = result.changes.length;
  const fields = result.changes.map((c) => c.path).join(', ');

  if (changeCount === 0) {
    return 'No changes needed';
  } else if (changeCount === 1) {
    return `Fixed 1 field: ${fields}`;
  } else {
    return `Fixed ${changeCount} fields: ${fields}`;
  }
}
