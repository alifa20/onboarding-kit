import { AIProvider, AIMessage, AIRequestOptions, AIResponse } from '../types.js';

/**
 * Mock AI provider for testing
 */
export class MockAIProvider implements AIProvider {
  public readonly name = 'mock';
  public readonly displayName = 'Mock Provider';

  private mockResponses: Map<string, string> = new Map();
  private callHistory: Array<{ messages: AIMessage[]; options?: AIRequestOptions }> = [];

  /**
   * Set a mock response for a specific operation
   */
  setMockResponse(key: string, response: string): void {
    this.mockResponses.set(key, response);
  }

  /**
   * Get call history
   */
  getCallHistory(): Array<{ messages: AIMessage[]; options?: AIRequestOptions }> {
    return this.callHistory;
  }

  /**
   * Clear call history
   */
  clearHistory(): void {
    this.callHistory = [];
  }

  /**
   * Check if provider is available
   */
  async isAvailable(): Promise<boolean> {
    return true;
  }

  /**
   * Send message (returns mock response)
   */
  async sendMessage(
    messages: AIMessage[],
    options?: AIRequestOptions
  ): Promise<AIResponse> {
    // Record call
    this.callHistory.push({ messages, options });

    // Find appropriate mock response
    let response: string | undefined;

    // Try to find based on last user message content
    const lastUserMessage = messages.filter((m) => m.role === 'user').pop();
    if (lastUserMessage) {
      // Check for validation request
      if (lastUserMessage.content.includes('validate')) {
        response = this.mockResponses.get('validation');
      }
      // Check for repair request
      else if (lastUserMessage.content.includes('repair')) {
        response = this.mockResponses.get('repair');
      }
      // Check for enhancement request
      else if (lastUserMessage.content.includes('enhance')) {
        response = this.mockResponses.get('enhancement');
      }
    }

    // Fallback to default response
    if (!response) {
      response = this.mockResponses.get('default') || '{"result": "ok"}';
    }

    return {
      content: response,
      model: 'mock-model',
      stopReason: 'end_turn',
      usage: {
        inputTokens: 100,
        outputTokens: 200,
      },
    };
  }
}

/**
 * Create a mock validation response
 */
export function createMockValidationResponse(isValid: boolean = true): string {
  return JSON.stringify({
    isValid,
    issues: isValid
      ? []
      : [
          {
            severity: 'error',
            path: 'test.field',
            message: 'Test error',
            suggestion: 'Fix it',
          },
        ],
    suggestions: isValid ? ['Looks good!'] : [],
  });
}

/**
 * Create a mock repair response
 */
export function createMockRepairResponse(): string {
  return JSON.stringify({
    repairedSpec: {
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
        headline: 'Welcome Fixed',
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
    },
    changes: [
      {
        path: 'welcome.headline',
        before: 'Welcome',
        after: 'Welcome Fixed',
        reason: 'Made it better',
      },
    ],
    explanation: 'Fixed the headline',
  });
}

/**
 * Create a mock enhancement response
 */
export function createMockEnhancementResponse(): string {
  return JSON.stringify({
    enhancedSpec: {
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
        headline: 'Welcome to Your Amazing Journey',
        subtext: 'Discover incredible features that will transform your experience',
        image: 'welcome.png',
        cta: 'Start Your Journey Now',
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
    },
    enhancements: [
      {
        path: 'welcome.headline',
        before: 'Welcome',
        after: 'Welcome to Your Amazing Journey',
        type: 'headline',
      },
      {
        path: 'welcome.subtext',
        before: 'Get started',
        after: 'Discover incredible features that will transform your experience',
        type: 'subtext',
      },
      {
        path: 'welcome.cta',
        before: 'Continue',
        after: 'Start Your Journey Now',
        type: 'cta',
      },
    ],
    explanation: 'Enhanced headlines, subtext, and CTAs to be more engaging',
  });
}
