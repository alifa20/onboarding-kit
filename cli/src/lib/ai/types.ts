import { OnboardingSpec, ValidationError } from '../spec/schema.js';

/**
 * AI Provider interface
 */
export interface AIProvider {
  name: string;
  displayName: string;
  isAvailable(): Promise<boolean>;
  sendMessage(messages: AIMessage[], options?: AIRequestOptions): Promise<AIResponse>;
}

/**
 * AI message in conversation
 */
export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * AI request options
 */
export interface AIRequestOptions {
  maxTokens?: number;
  temperature?: number;
  stopSequences?: string[];
  timeout?: number;
}

/**
 * AI response from provider
 */
export interface AIResponse {
  content: string;
  model?: string;
  stopReason?: 'end_turn' | 'max_tokens' | 'stop_sequence';
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Spec validation result from AI
 */
export interface AIValidationResult {
  isValid: boolean;
  issues: AIValidationIssue[];
  suggestions?: string[];
}

/**
 * Validation issue identified by AI
 */
export interface AIValidationIssue {
  severity: 'error' | 'warning' | 'info';
  path: string;
  message: string;
  suggestion?: string;
}

/**
 * Spec repair result from AI
 */
export interface AIRepairResult {
  repairedSpec: OnboardingSpec;
  changes: AIRepairChange[];
  explanation: string;
}

/**
 * Individual repair change
 */
export interface AIRepairChange {
  path: string;
  before: string;
  after: string;
  reason: string;
}

/**
 * Spec enhancement result from AI
 */
export interface AIEnhancementResult {
  enhancedSpec: OnboardingSpec;
  enhancements: AIEnhancement[];
  explanation: string;
}

/**
 * Individual enhancement
 */
export interface AIEnhancement {
  path: string;
  before: string;
  after: string;
  type: 'headline' | 'subtext' | 'cta' | 'feature' | 'general';
}

/**
 * Conversation context for multi-turn interactions
 */
export interface ConversationContext {
  messages: AIMessage[];
  metadata: {
    specHash?: string;
    lastOperation?: 'validate' | 'repair' | 'enhance';
    timestamp: number;
  };
}

/**
 * AI error types
 */
export class AIError extends Error {
  constructor(
    message: string,
    public code?: string,
    public provider?: string
  ) {
    super(message);
    this.name = 'AIError';
  }
}

export class AIRateLimitError extends AIError {
  constructor(
    message: string,
    public retryAfter?: number
  ) {
    super(message, 'RATE_LIMIT');
    this.name = 'AIRateLimitError';
  }
}

export class AIAuthenticationError extends AIError {
  constructor(message: string) {
    super(message, 'AUTHENTICATION');
    this.name = 'AIAuthenticationError';
  }
}

export class AINetworkError extends AIError {
  constructor(message: string) {
    super(message, 'NETWORK');
    this.name = 'AINetworkError';
  }
}

export class AIParseError extends AIError {
  constructor(message: string) {
    super(message, 'PARSE');
    this.name = 'AIParseError';
  }
}

export class AITimeoutError extends AIError {
  constructor(message: string) {
    super(message, 'TIMEOUT');
    this.name = 'AITimeoutError';
  }
}
