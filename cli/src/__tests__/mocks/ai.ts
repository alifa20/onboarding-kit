/**
 * Mock AI response for testing
 */
export function createMockAIResponse(content: string = 'Mock AI response'): string {
  return content;
}

/**
 * Mock streaming AI response
 */
export async function* createMockStreamingResponse(content: string = 'Mock streaming response') {
  const words = content.split(' ');
  for (const word of words) {
    yield word + ' ';
  }
}

/**
 * Mock AI error
 */
export class MockAIError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'MockAIError';
  }
}

/**
 * Mock AI rate limit error
 */
export function createRateLimitError(): MockAIError {
  return new MockAIError('Rate limit exceeded', 'rate_limit_exceeded');
}

/**
 * Mock AI provider
 */
export interface MockAIProvider {
  chat: (messages: Array<{ role: string; content: string }>) => Promise<string>;
  streamChat: (messages: Array<{ role: string; content: string }>) => AsyncIterable<string>;
}

/**
 * Creates a mock AI provider
 */
export function createMockAIProvider(
  responseContent: string = 'Mock AI response',
): MockAIProvider {
  return {
    async chat(messages) {
      return createMockAIResponse(responseContent);
    },
    async *streamChat(messages) {
      yield* createMockStreamingResponse(responseContent);
    },
  };
}

/**
 * Mock AI provider that fails
 */
export function createFailingAIProvider(errorMessage: string = 'AI request failed'): MockAIProvider {
  return {
    async chat(messages) {
      throw new MockAIError(errorMessage);
    },
    async *streamChat(messages) {
      throw new MockAIError(errorMessage);
    },
  };
}

/**
 * Mock spec repair suggestion from AI
 */
export function createMockRepairSuggestion(): string {
  return `Here's the corrected spec:

## Login

- Methods: [email, google, apple]
- Headline: Sign in to your account

The "Methods" field should be an array with valid login methods.`;
}

/**
 * Mock spec enhancement suggestion from AI
 */
export function createMockEnhancementSuggestion(): string {
  return `I suggest the following improvements:

1. Add more descriptive copy: "Welcome to TestApp - Your personal finance companion"
2. Include accessibility labels for images
3. Add a loading state for the login screen

Would you like me to implement these changes?`;
}

/**
 * Mock code refinement from AI
 */
export function createMockRefinement(): string {
  return `I'll update the WelcomeScreen to add the requested animation:

\`\`\`typescript
import { Animated } from 'react-native';

// Add fade-in animation
const fadeAnim = useRef(new Animated.Value(0)).current;

useEffect(() => {
  Animated.timing(fadeAnim, {
    toValue: 1,
    duration: 1000,
    useNativeDriver: true,
  }).start();
}, []);
\`\`\`

This will create a smooth fade-in effect when the screen loads.`;
}
