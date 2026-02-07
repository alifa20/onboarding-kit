import { AIMessage, ConversationContext } from './types.js';
import { createHash } from '../spec/hash.js';
import { OnboardingSpec } from '../spec/schema.js';

/**
 * Maximum number of messages to keep in context
 */
const MAX_CONTEXT_MESSAGES = 10;

/**
 * Maximum age of context in milliseconds (30 minutes)
 */
const MAX_CONTEXT_AGE_MS = 30 * 60 * 1000;

/**
 * Create a new conversation context
 */
export function createContext(
  spec?: OnboardingSpec,
  operation?: 'validate' | 'repair' | 'enhance'
): ConversationContext {
  return {
    messages: [],
    metadata: {
      specHash: spec ? createHash(JSON.stringify(spec)) : undefined,
      lastOperation: operation,
      timestamp: Date.now(),
    },
  };
}

/**
 * Add a message to the conversation context
 */
export function addMessage(
  context: ConversationContext,
  message: AIMessage
): ConversationContext {
  const messages = [...context.messages, message];

  // Truncate if too many messages (keep system message + last N messages)
  const truncatedMessages = truncateMessages(messages);

  return {
    ...context,
    messages: truncatedMessages,
    metadata: {
      ...context.metadata,
      timestamp: Date.now(),
    },
  };
}

/**
 * Add system message to context
 */
export function addSystemMessage(
  context: ConversationContext,
  content: string
): ConversationContext {
  return addMessage(context, {
    role: 'system',
    content,
  });
}

/**
 * Add user message to context
 */
export function addUserMessage(
  context: ConversationContext,
  content: string
): ConversationContext {
  return addMessage(context, {
    role: 'user',
    content,
  });
}

/**
 * Add assistant message to context
 */
export function addAssistantMessage(
  context: ConversationContext,
  content: string
): ConversationContext {
  return addMessage(context, {
    role: 'assistant',
    content,
  });
}

/**
 * Truncate messages to keep context size manageable
 * Preserves system message + most recent messages
 */
function truncateMessages(messages: AIMessage[]): AIMessage[] {
  if (messages.length <= MAX_CONTEXT_MESSAGES) {
    return messages;
  }

  // Find system messages
  const systemMessages = messages.filter((m) => m.role === 'system');
  const nonSystemMessages = messages.filter((m) => m.role !== 'system');

  // Keep system messages + last N non-system messages
  const keepCount = MAX_CONTEXT_MESSAGES - systemMessages.length;
  const recentMessages = nonSystemMessages.slice(-keepCount);

  return [...systemMessages, ...recentMessages];
}

/**
 * Check if context is still valid (not too old, spec hasn't changed)
 */
export function isContextValid(
  context: ConversationContext,
  currentSpec?: OnboardingSpec
): boolean {
  // Check age
  const age = Date.now() - context.metadata.timestamp;
  if (age > MAX_CONTEXT_AGE_MS) {
    return false;
  }

  // Check if spec has changed (if spec is provided)
  if (currentSpec && context.metadata.specHash) {
    const currentHash = createHash(JSON.stringify(currentSpec));
    if (currentHash !== context.metadata.specHash) {
      return false;
    }
  }

  return true;
}

/**
 * Update context metadata with new operation
 */
export function updateOperation(
  context: ConversationContext,
  operation: 'validate' | 'repair' | 'enhance',
  spec?: OnboardingSpec
): ConversationContext {
  return {
    ...context,
    metadata: {
      ...context.metadata,
      lastOperation: operation,
      specHash: spec ? createHash(JSON.stringify(spec)) : context.metadata.specHash,
      timestamp: Date.now(),
    },
  };
}

/**
 * Clear context messages while preserving metadata
 */
export function clearMessages(context: ConversationContext): ConversationContext {
  return {
    ...context,
    messages: [],
    metadata: {
      ...context.metadata,
      timestamp: Date.now(),
    },
  };
}

/**
 * Get context summary for logging
 */
export function getContextSummary(context: ConversationContext): string {
  const messageCount = context.messages.length;
  const lastOp = context.metadata.lastOperation || 'none';
  const age = Math.floor((Date.now() - context.metadata.timestamp) / 1000);

  return `Context: ${messageCount} messages, last operation: ${lastOp}, age: ${age}s`;
}

/**
 * Build messages array for AI request from context
 */
export function buildMessagesForRequest(
  context: ConversationContext,
  systemPrompt: string,
  userPrompt: string
): AIMessage[] {
  const messages: AIMessage[] = [];

  // Add system message
  messages.push({
    role: 'system',
    content: systemPrompt,
  });

  // Add conversation history (excluding old system messages)
  const historyMessages = context.messages.filter((m) => m.role !== 'system');
  messages.push(...historyMessages);

  // Add current user message
  messages.push({
    role: 'user',
    content: userPrompt,
  });

  return messages;
}
