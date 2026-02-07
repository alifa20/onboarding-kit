import Anthropic from '@anthropic-ai/sdk';
import type {
  AIProvider,
  AIMessage,
  AIRequestOptions,
  AIResponse,
} from '../types.js';
import {
  AIError,
  AIRateLimitError,
  AIAuthenticationError,
  AINetworkError,
  AITimeoutError,
  wrapFetchError,
} from '../errors.js';

/**
 * Default model to use for Anthropic requests
 */
const DEFAULT_MODEL = 'claude-3-5-sonnet-20241022';

/**
 * Default request options
 */
const DEFAULT_OPTIONS: Required<AIRequestOptions> = {
  maxTokens: 4096,
  temperature: 0.7,
  stopSequences: [],
  timeout: 60000, // 60 seconds
};

/**
 * Anthropic Claude provider implementation
 */
export class AnthropicProvider implements AIProvider {
  public readonly name = 'anthropic';
  public readonly displayName = 'Anthropic Claude';

  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model: string = DEFAULT_MODEL) {
    this.client = new Anthropic({
      apiKey,
      timeout: DEFAULT_OPTIONS.timeout,
    });
    this.model = model;
  }

  /**
   * Check if provider is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Simple validation - just check if we can create a client
      return !!this.client;
    } catch {
      return false;
    }
  }

  /**
   * Send message to Claude
   */
  async sendMessage(
    messages: AIMessage[],
    options?: AIRequestOptions
  ): Promise<AIResponse> {
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

    try {
      // Convert messages to Anthropic format
      const { system, messages: anthropicMessages } = convertMessages(messages);

      // Create message request
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: mergedOptions.maxTokens,
        temperature: mergedOptions.temperature,
        system,
        messages: anthropicMessages,
        ...(mergedOptions.stopSequences.length > 0 && {
          stop_sequences: mergedOptions.stopSequences,
        }),
      });

      // Extract text content
      const content = extractTextContent(response.content);

      return {
        content,
        model: response.model,
        stopReason: mapStopReason(response.stop_reason),
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
      };
    } catch (error) {
      throw handleAnthropicError(error);
    }
  }
}

/**
 * Convert our message format to Anthropic's format
 */
function convertMessages(messages: AIMessage[]): {
  system?: string;
  messages: Anthropic.MessageParam[];
} {
  const systemMessages = messages.filter((m) => m.role === 'system');
  const conversationMessages = messages.filter((m) => m.role !== 'system');

  // Combine system messages
  const system = systemMessages.length > 0
    ? systemMessages.map((m) => m.content).join('\n\n')
    : undefined;

  // Convert conversation messages
  const anthropicMessages: Anthropic.MessageParam[] = conversationMessages.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  return { system, messages: anthropicMessages };
}

/**
 * Extract text content from Anthropic response
 */
function extractTextContent(
  content: Array<Anthropic.ContentBlock>
): string {
  const textBlocks = content.filter(
    (block): block is Anthropic.TextBlock => block.type === 'text'
  );

  return textBlocks.map((block) => block.text).join('\n');
}

/**
 * Map Anthropic stop reason to our format
 */
function mapStopReason(
  stopReason: string | null
): 'end_turn' | 'max_tokens' | 'stop_sequence' | undefined {
  switch (stopReason) {
    case 'end_turn':
      return 'end_turn';
    case 'max_tokens':
      return 'max_tokens';
    case 'stop_sequence':
      return 'stop_sequence';
    default:
      return undefined;
  }
}

/**
 * Handle Anthropic-specific errors
 */
function handleAnthropicError(error: unknown): AIError {
  // Anthropic SDK errors
  if (error instanceof Anthropic.APIError) {
    const { status, message } = error;

    // Rate limit
    if (status === 429) {
      const retryAfter = extractRetryAfter(error);
      return new AIRateLimitError(
        `Rate limit exceeded. ${retryAfter ? `Retry after ${retryAfter}s.` : 'Please try again later.'}`,
        retryAfter
      );
    }

    // Authentication
    if (status === 401 || status === 403) {
      return new AIAuthenticationError(
        `Authentication failed with Anthropic: ${message}. Please run 'onboardkit auth' to re-authenticate.`
      );
    }

    // Server errors
    if (status && status >= 500) {
      return new AINetworkError(
        `Anthropic server error (${status}): ${message}`
      );
    }

    // Generic API error
    return new AIError(
      `Anthropic API error: ${message}`,
      `HTTP_${status}`,
      'anthropic'
    );
  }

  // Connection/network errors
  if (error instanceof Anthropic.APIConnectionError) {
    return new AINetworkError(
      `Failed to connect to Anthropic: ${error.message}`
    );
  }

  // Timeout errors
  if (error instanceof Anthropic.APIConnectionTimeoutError) {
    return new AITimeoutError(
      `Request to Anthropic timed out: ${error.message}`
    );
  }

  // Wrap other errors
  return wrapFetchError(error, 'Anthropic');
}

/**
 * Extract retry-after value from rate limit error
 */
function extractRetryAfter(error: Anthropic.APIError): number | undefined {
  try {
    // Check for retry-after header in error response
    const retryAfterHeader = error.headers?.['retry-after'];
    if (retryAfterHeader) {
      const seconds = parseInt(retryAfterHeader, 10);
      if (!isNaN(seconds)) {
        return seconds;
      }
    }
  } catch {
    // Ignore parsing errors
  }
  return undefined;
}

/**
 * Create an Anthropic provider instance with access token
 */
export function createAnthropicProvider(
  accessToken: string,
  model?: string
): AnthropicProvider {
  return new AnthropicProvider(accessToken, model);
}
