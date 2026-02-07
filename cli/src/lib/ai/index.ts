/**
 * AI Integration Module
 *
 * Provides AI-powered spec validation, repair, and enhancement
 * using Anthropic Claude via OAuth authentication.
 */

// Types
export type {
  AIProvider,
  AIMessage,
  AIRequestOptions,
  AIResponse,
  AIValidationResult,
  AIValidationIssue,
  AIRepairResult,
  AIRepairChange,
  AIEnhancementResult,
  AIEnhancement,
  ConversationContext,
} from './types.js';

// Errors
export {
  AIError,
  AIRateLimitError,
  AIAuthenticationError,
  AINetworkError,
  AIParseError,
  AITimeoutError,
  isRetryableError,
  withRetry,
  type RetryStrategy,
  DEFAULT_RETRY_STRATEGY,
} from './errors.js';

// Provider
export { createProvider, getDefaultProvider, isProviderConfigured } from './providers/factory.js';
export { AnthropicProvider, createAnthropicProvider } from './providers/anthropic.js';

// Operations
export {
  validateSpecWithAI,
  quickValidate,
  formatValidationResult,
  type ValidateSpecOptions,
  type ValidateSpecResult,
} from './operations/validate.js';

export {
  repairSpec,
  quickRepair,
  formatRepairResult,
  getRepairSummary,
  type RepairSpecOptions,
  type RepairSpecResult,
} from './operations/repair.js';

export {
  enhanceSpec,
  quickEnhance,
  formatEnhancementResult,
  getEnhancementSummary,
  type EnhanceSpecOptions,
  type EnhanceSpecResult,
} from './operations/enhance.js';

// Context management
export {
  createContext,
  addMessage,
  addSystemMessage,
  addUserMessage,
  addAssistantMessage,
  isContextValid,
  updateOperation,
  clearMessages,
  getContextSummary,
  buildMessagesForRequest,
} from './context.js';

// Parser utilities
export {
  parseValidationResponse,
  parseRepairResponse,
  parseEnhancementResponse,
  safeParseResponse,
} from './parser.js';

// Prompts (if needed for customization)
export {
  getSystemPrompt,
  createValidationPrompt,
  createRepairPrompt,
  createEnhancementPrompt,
} from './prompts/index.js';
