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
import { ClaudeProxyClient, type ClaudeOAuthTokens } from '../claude-proxy/index.js';

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
 * Supports both direct API (with API keys) and proxy mode (with OAuth tokens)
 */
export class AnthropicProvider implements AIProvider {
  public readonly name = 'anthropic';
  public readonly displayName = 'Anthropic Claude';

  private client?: Anthropic;
  private proxyClient?: ClaudeProxyClient;
  private model: string;
  private mode: 'api' | 'proxy';

  constructor(apiKey: string, model: string = DEFAULT_MODEL);
  constructor(tokens: ClaudeOAuthTokens, model?: string);
  constructor(authOrTokens: string | ClaudeOAuthTokens, model: string = DEFAULT_MODEL) {
    this.model = model;

    if (typeof authOrTokens === 'string') {
      // API key mode - use standard Anthropic SDK
      this.mode = 'api';
      this.client = new Anthropic({
        apiKey: authOrTokens,
        timeout: DEFAULT_OPTIONS.timeout,
      });
    } else {
      // OAuth token mode - use Claude Code proxy
      this.mode = 'proxy';
      this.proxyClient = new ClaudeProxyClient({
        tokens: authOrTokens,
      });
    }
  }

  /**
   * Check if provider is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      return !!(this.client || this.proxyClient);
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

    if (this.mode === 'proxy' && this.proxyClient) {
      return this.sendViaProxy(messages, mergedOptions);
    } else if (this.mode === 'api' && this.client) {
      return this.sendViaAPI(messages, mergedOptions);
    } else {
      throw new AIError('Provider not properly initialized', 'INITIALIZATION_ERROR');
    }
  }

  /**
   * Send message via standard Anthropic API
   */
  private async sendViaAPI(
    messages: AIMessage[],
    options: Required<AIRequestOptions>
  ): Promise<AIResponse> {
    if (!this.client) {
      throw new AIError('API client not initialized', 'INITIALIZATION_ERROR');
    }

    try {
      // Convert messages to Anthropic format
      const { system, messages: anthropicMessages } = convertMessages(messages);

      // Create message request
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: options.maxTokens,
        temperature: options.temperature,
        system,
        messages: anthropicMessages,
        ...(options.stopSequences.length > 0 && {
          stop_sequences: options.stopSequences,
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

  /**
   * Send message via Claude Code proxy
   */
  private async sendViaProxy(
    messages: AIMessage[],
    options: Required<AIRequestOptions>
  ): Promise<AIResponse> {
    if (!this.proxyClient) {
      throw new AIError('Proxy client not initialized', 'INITIALIZATION_ERROR');
    }

    try {
      // Convert messages to Claude Code format
      const { system, messages: proxyMessages } = convertMessages(messages);

      // Send via proxy
      const response = await this.proxyClient.sendMessage({
        model: this.model,
        max_tokens: options.maxTokens,
        temperature: options.temperature,
        system,
        messages: proxyMessages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content as string,
        })),
        ...(options.stopSequences.length > 0 && {
          stop_sequences: options.stopSequences,
        }),
      });

      // Extract text from response
      const content = response.content
        .filter((c) => c.type === 'text')
        .map((c) => c.text)
        .join('\n');

      return {
        content,
        model: response.model,
        stopReason: response.stop_reason || 'end_turn',
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
      };
    } catch (error) {
      throw new AIError(
        `Proxy error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PROXY_ERROR'
      );
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
