import { vi } from 'vitest';

/**
 * Mock user responses for @clack/prompts
 */
export interface MockPromptResponses {
  text?: Record<string, string>;
  select?: Record<string, string | symbol>;
  multiselect?: Record<string, string[]>;
  confirm?: Record<string, boolean>;
}

/**
 * Creates mock prompt functions
 */
export function createMockPrompts(responses: MockPromptResponses = {}) {
  return {
    text: vi.fn(async ({ message }: { message: string }) => {
      const response = responses.text?.[message];
      if (response === undefined) {
        throw new Error(`No mock response configured for text prompt: "${message}"`);
      }
      return response;
    }),
    select: vi.fn(async ({ message }: { message: string }) => {
      const response = responses.select?.[message];
      if (response === undefined) {
        throw new Error(`No mock response configured for select prompt: "${message}"`);
      }
      return response;
    }),
    multiselect: vi.fn(async ({ message }: { message: string }) => {
      const response = responses.multiselect?.[message];
      if (response === undefined) {
        throw new Error(`No mock response configured for multiselect prompt: "${message}"`);
      }
      return response;
    }),
    confirm: vi.fn(async ({ message }: { message: string }) => {
      const response = responses.confirm?.[message];
      if (response === undefined) {
        throw new Error(`No mock response configured for confirm prompt: "${message}"`);
      }
      return response;
    }),
    spinner: vi.fn(() => ({
      start: vi.fn(),
      stop: vi.fn(),
      message: vi.fn(),
    })),
    intro: vi.fn(),
    outro: vi.fn(),
    cancel: vi.fn(),
    isCancel: vi.fn(() => false),
  };
}

/**
 * Mock responses for init command
 */
export function createInitPromptResponses(): MockPromptResponses {
  return {
    text: {
      'What is your app name?': 'TestApp',
      'Primary color (hex):': '#6366F1',
      'Secondary color (hex):': '#8B5CF6',
    },
    select: {
      'How many onboarding steps?': '3',
      'Include paywall?': 'none',
    },
    multiselect: {
      'Login methods:': ['email', 'google'],
    },
  };
}

/**
 * Mock responses for auth command
 */
export function createAuthPromptResponses(): MockPromptResponses {
  return {
    select: {
      'Choose AI provider:': 'anthropic',
    },
    confirm: {
      'Open browser for authentication?': true,
    },
  };
}
