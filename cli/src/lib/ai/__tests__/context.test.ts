import { describe, it, expect } from 'vitest';
import {
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
} from '../context.js';
import { OnboardingSpec } from '../../spec/schema.js';

const mockSpec: OnboardingSpec = {
  projectName: 'Test App',
  config: {
    platform: 'expo',
    navigation: 'react-navigation',
    styling: 'stylesheet',
  },
  theme: {
    primary: '#FF5733',
    secondary: '#33FF57',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#000000',
    textSecondary: '#666666',
    error: '#FF0000',
    success: '#00FF00',
    font: 'System',
    borderRadius: 8,
  },
  welcome: {
    headline: 'Welcome',
    subtext: 'Get started',
    image: 'welcome.png',
    cta: 'Continue',
  },
  onboardingSteps: [
    {
      title: 'Step 1',
      headline: 'First Step',
      subtext: 'Description',
      image: 'step1.png',
    },
  ],
  login: {
    methods: ['email'],
    headline: 'Login',
  },
  nameCapture: {
    headline: 'Your Name',
    fields: ['first_name'],
    cta: 'Continue',
  },
};

describe('Context Management', () => {
  describe('createContext', () => {
    it('should create empty context', () => {
      const context = createContext();

      expect(context.messages).toEqual([]);
      expect(context.metadata.specHash).toBeUndefined();
      expect(context.metadata.lastOperation).toBeUndefined();
      expect(context.metadata.timestamp).toBeGreaterThan(0);
    });

    it('should create context with spec', () => {
      const context = createContext(mockSpec);

      expect(context.metadata.specHash).toBeDefined();
      expect(context.metadata.specHash).toHaveLength(64); // SHA-256 hash
    });

    it('should create context with operation', () => {
      const context = createContext(mockSpec, 'validate');

      expect(context.metadata.lastOperation).toBe('validate');
    });
  });

  describe('addMessage', () => {
    it('should add message to context', () => {
      let context = createContext();

      context = addMessage(context, {
        role: 'user',
        content: 'Test message',
      });

      expect(context.messages).toHaveLength(1);
      expect(context.messages[0].role).toBe('user');
      expect(context.messages[0].content).toBe('Test message');
    });

    it('should update timestamp', () => {
      let context = createContext();
      const originalTimestamp = context.metadata.timestamp;

      // Wait a bit to ensure timestamp changes
      const start = Date.now();
      while (Date.now() === start) {
        // Busy wait
      }

      context = addMessage(context, {
        role: 'user',
        content: 'Test',
      });

      expect(context.metadata.timestamp).toBeGreaterThan(originalTimestamp);
    });
  });

  describe('addSystemMessage', () => {
    it('should add system message', () => {
      let context = createContext();

      context = addSystemMessage(context, 'System prompt');

      expect(context.messages).toHaveLength(1);
      expect(context.messages[0].role).toBe('system');
      expect(context.messages[0].content).toBe('System prompt');
    });
  });

  describe('addUserMessage', () => {
    it('should add user message', () => {
      let context = createContext();

      context = addUserMessage(context, 'User message');

      expect(context.messages).toHaveLength(1);
      expect(context.messages[0].role).toBe('user');
      expect(context.messages[0].content).toBe('User message');
    });
  });

  describe('addAssistantMessage', () => {
    it('should add assistant message', () => {
      let context = createContext();

      context = addAssistantMessage(context, 'Assistant response');

      expect(context.messages).toHaveLength(1);
      expect(context.messages[0].role).toBe('assistant');
      expect(context.messages[0].content).toBe('Assistant response');
    });
  });

  describe('isContextValid', () => {
    it('should return true for fresh context', () => {
      const context = createContext(mockSpec);

      expect(isContextValid(context, mockSpec)).toBe(true);
    });

    it('should return false for old context', () => {
      const context = createContext(mockSpec);
      // Manually set old timestamp (31 minutes ago)
      context.metadata.timestamp = Date.now() - 31 * 60 * 1000;

      expect(isContextValid(context, mockSpec)).toBe(false);
    });

    it('should return false if spec changed', () => {
      const context = createContext(mockSpec);

      const modifiedSpec = {
        ...mockSpec,
        projectName: 'Different App',
      };

      expect(isContextValid(context, modifiedSpec)).toBe(false);
    });

    it('should return true if no spec provided', () => {
      const context = createContext();

      expect(isContextValid(context)).toBe(true);
    });
  });

  describe('updateOperation', () => {
    it('should update operation', () => {
      let context = createContext();

      context = updateOperation(context, 'validate', mockSpec);

      expect(context.metadata.lastOperation).toBe('validate');
      expect(context.metadata.specHash).toBeDefined();
    });

    it('should update timestamp', () => {
      let context = createContext();
      const originalTimestamp = context.metadata.timestamp;

      // Wait a bit
      const start = Date.now();
      while (Date.now() === start) {
        // Busy wait
      }

      context = updateOperation(context, 'enhance');

      expect(context.metadata.timestamp).toBeGreaterThan(originalTimestamp);
    });
  });

  describe('clearMessages', () => {
    it('should clear messages but preserve metadata', () => {
      let context = createContext(mockSpec, 'validate');
      context = addUserMessage(context, 'Test');
      context = addAssistantMessage(context, 'Response');

      expect(context.messages).toHaveLength(2);

      context = clearMessages(context);

      expect(context.messages).toHaveLength(0);
      expect(context.metadata.specHash).toBeDefined();
      expect(context.metadata.lastOperation).toBe('validate');
    });
  });

  describe('getContextSummary', () => {
    it('should return summary string', () => {
      let context = createContext(mockSpec, 'validate');
      context = addUserMessage(context, 'Test');

      const summary = getContextSummary(context);

      expect(summary).toContain('1 messages');
      expect(summary).toContain('validate');
      expect(summary).toMatch(/age: \d+s/);
    });

    it('should handle no operation', () => {
      const context = createContext();
      const summary = getContextSummary(context);

      expect(summary).toContain('none');
    });
  });

  describe('buildMessagesForRequest', () => {
    it('should build messages with system prompt', () => {
      const context = createContext();
      const messages = buildMessagesForRequest(
        context,
        'System prompt',
        'User prompt'
      );

      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe('system');
      expect(messages[0].content).toBe('System prompt');
      expect(messages[1].role).toBe('user');
      expect(messages[1].content).toBe('User prompt');
    });

    it('should include conversation history', () => {
      let context = createContext();
      context = addUserMessage(context, 'Previous user message');
      context = addAssistantMessage(context, 'Previous assistant message');

      const messages = buildMessagesForRequest(
        context,
        'System prompt',
        'New user message'
      );

      expect(messages).toHaveLength(4);
      expect(messages[0].role).toBe('system');
      expect(messages[1].role).toBe('user');
      expect(messages[1].content).toBe('Previous user message');
      expect(messages[2].role).toBe('assistant');
      expect(messages[2].content).toBe('Previous assistant message');
      expect(messages[3].role).toBe('user');
      expect(messages[3].content).toBe('New user message');
    });

    it('should exclude old system messages from history', () => {
      let context = createContext();
      context = addSystemMessage(context, 'Old system message');
      context = addUserMessage(context, 'User message');

      const messages = buildMessagesForRequest(
        context,
        'New system prompt',
        'New user message'
      );

      // Should have new system message + user history + new user message
      expect(messages).toHaveLength(3);
      expect(messages[0].content).toBe('New system prompt');
      expect(messages[1].content).toBe('User message');
      expect(messages[2].content).toBe('New user message');
    });
  });
});
