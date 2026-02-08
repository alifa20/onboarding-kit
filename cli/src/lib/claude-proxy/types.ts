/**
 * Types for Claude Code proxy integration
 */

/**
 * OAuth tokens from claude.ai
 */
export interface ClaudeOAuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  expires_at?: number;
  token_type: 'Bearer';
}

/**
 * Claude Code API request
 */
export interface ClaudeCodeRequest {
  model: string;
  max_tokens: number;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  system?: string;
  temperature?: number;
  stop_sequences?: string[];
}

/**
 * Claude Code API response
 */
export interface ClaudeCodeResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: Array<{
    type: 'text';
    text: string;
  }>;
  model: string;
  stop_reason: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * Proxy client configuration
 */
export interface ProxyClientConfig {
  tokens: ClaudeOAuthTokens;
  endpoint?: string;
  userAgent?: string;
}
