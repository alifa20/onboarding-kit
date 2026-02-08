/**
 * Claude Code Proxy Client
 * Routes requests to api.githubcopilot.com with Claude Code headers
 */

import type {
  ClaudeOAuthTokens,
  ClaudeCodeRequest,
  ClaudeCodeResponse,
  ProxyClientConfig,
} from './types.js';

/**
 * Claude Code API endpoint (not standard Anthropic API)
 */
const CLAUDE_CODE_ENDPOINT = 'https://api.githubcopilot.com/v1/messages';

/**
 * Default User-Agent for Claude Code requests
 */
const CLAUDE_CODE_USER_AGENT = 'Claude-Code-CLI/1.0';

/**
 * Required system prompt prefix for Claude Code API
 */
const CLAUDE_CODE_SYSTEM_PREFIX =
  'You are Claude Code, Anthropic\'s official CLI for Claude.';

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
    this.endpoint = config.endpoint || CLAUDE_CODE_ENDPOINT;
    this.userAgent = config.userAgent || CLAUDE_CODE_USER_AGENT;
  }

  /**
   * Send message to Claude via Claude Code API
   */
  async sendMessage(request: ClaudeCodeRequest): Promise<ClaudeCodeResponse> {
    // Ensure system prompt starts with Claude Code prefix
    if (request.system) {
      if (!request.system.startsWith(CLAUDE_CODE_SYSTEM_PREFIX)) {
        request.system = `${CLAUDE_CODE_SYSTEM_PREFIX}\n\n${request.system}`;
      }
    } else {
      request.system = CLAUDE_CODE_SYSTEM_PREFIX;
    }

    // Build headers with OAuth token and Claude Code identification
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.tokens.access_token}`,
      'User-Agent': this.userAgent,
      'anthropic-version': '2023-06-01',
      // Claude Code specific headers
      'X-Claude-Code': 'true',
    };

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Claude Code API error (${response.status}): ${errorText}`
        );
      }

      const data = await response.json();
      return data as ClaudeCodeResponse;
    } catch (error) {
      throw new Error(
        `Failed to send message via Claude Code API: ${error instanceof Error ? error.message : 'Unknown error'}`
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
