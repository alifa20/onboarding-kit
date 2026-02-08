/**
 * Claude Proxy Client
 * Routes requests to Anthropic API using Claude Code setup tokens
 */

import type {
  ClaudeOAuthTokens,
  ClaudeCodeRequest,
  ClaudeCodeResponse,
  ProxyClientConfig,
} from './types.js';

/**
 * Anthropic API endpoint
 * Works with both OAuth tokens (Authorization: Bearer) and API keys (x-api-key)
 */
const ANTHROPIC_API_ENDPOINT = 'https://api.anthropic.com/v1/messages';

/**
 * Default User-Agent for requests
 */
const DEFAULT_USER_AGENT = 'OnboardKit/1.0';

/**
 * Claude Code Proxy Client
 * Handles authenticated requests to Claude Code API
 */
export class ClaudeProxyClient {
  private tokens: ClaudeOAuthTokens;
  private endpoint: string;
  private userAgent: string;

  constructor(config: ProxyClientConfig) {
    this.tokens = config.tokens;
    this.endpoint = config.endpoint || ANTHROPIC_API_ENDPOINT;
    this.userAgent = config.userAgent || DEFAULT_USER_AGENT;
  }

  /**
   * Send message to Claude via OAuth or API
   */
  async sendMessage(request: ClaudeCodeRequest): Promise<ClaudeCodeResponse> {
    // Detect token type and use appropriate authentication header
    const isOAuthToken = this.tokens.access_token.startsWith('sk-ant-oat');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    };
    
    // OAuth tokens use Authorization: Bearer, API keys use x-api-key
    if (isOAuthToken) {
      headers['Authorization'] = `Bearer ${this.tokens.access_token}`;
    } else {
      headers['x-api-key'] = this.tokens.access_token;
    }

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = errorText;
        try {
          const errorJson = JSON.parse(errorText);
          errorMsg = errorJson.error?.message || errorText;
        } catch {
          // Keep raw error text if not JSON
        }
        throw new Error(
          `Anthropic API error (${response.status}): ${errorMsg}`
        );
      }

      const data = await response.json();
      return data as ClaudeCodeResponse;
    } catch (error) {
      throw new Error(
        `Failed to send message via Anthropic API: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Update OAuth tokens (e.g., after refresh)
   */
  updateTokens(tokens: ClaudeOAuthTokens): void {
    this.tokens = tokens;
  }

  /**
   * Get current tokens
   */
  getTokens(): ClaudeOAuthTokens {
    return { ...this.tokens };
  }

  /**
   * Check if tokens are expired
   */
  isExpired(): boolean {
    if (!this.tokens.expires_at) {
      return false;
    }
    return Date.now() >= this.tokens.expires_at;
  }
}

/**
 * Create a Claude Code proxy client from OAuth tokens
 */
export function createProxyClient(
  tokens: ClaudeOAuthTokens,
  endpoint?: string
): ClaudeProxyClient {
  return new ClaudeProxyClient({
    tokens,
    endpoint,
  });
}
