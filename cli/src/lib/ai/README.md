# AI Integration Module

This module provides AI-powered spec validation, repair, and enhancement using Anthropic Claude via OAuth authentication.

## Overview

The AI module integrates with the OnboardKit CLI to provide intelligent assistance for onboarding spec creation:

- **Validation**: Analyzes specs for issues beyond schema validation (UX, accessibility, best practices)
- **Repair**: Automatically fixes validation errors while preserving user intent
- **Enhancement**: Improves copy to be more engaging (headlines, subtext, CTAs)

## Architecture

```
ai/
├── types.ts              # Type definitions and interfaces
├── errors.ts             # Error classes and retry logic
├── context.ts            # Conversation context management
├── parser.ts             # AI response parsing
├── prompts/              # Prompt templates
│   └── index.ts
├── providers/            # AI provider implementations
│   ├── anthropic.ts      # Anthropic Claude adapter
│   └── factory.ts        # Provider factory
├── operations/           # AI operations
│   ├── validate.ts       # Spec validation
│   ├── repair.ts         # Spec repair
│   └── enhance.ts        # Spec enhancement
└── index.ts              # Public API
```

## Usage

### Basic Validation

```typescript
import { validateSpecWithAI } from './lib/ai/index.js';

const result = await validateSpecWithAI(spec);

if (result.validation.isValid) {
  console.log('Spec is valid!');
} else {
  console.log('Issues found:', result.validation.issues);
}
```

### Repair Invalid Spec

```typescript
import { repairSpec } from './lib/ai/index.js';

const result = await repairSpec(invalidSpec, validationErrors);
const fixedSpec = result.repair.repairedSpec;

console.log('Changes made:', result.repair.changes);
```

### Enhance Spec

```typescript
import { enhanceSpec } from './lib/ai/index.js';

const result = await enhanceSpec(validSpec);
const enhancedSpec = result.enhancement.enhancedSpec;

console.log('Enhancements:', result.enhancement.enhancements);
```

### With Custom Provider

```typescript
import { createProvider, validateSpecWithAI } from './lib/ai/index.js';

const provider = await createProvider('anthropic');
const result = await validateSpecWithAI(spec, { provider });
```

### With Context (Multi-turn)

```typescript
import { validateSpecWithAI, createContext } from './lib/ai/index.js';

let context = createContext(spec, 'validate');

// First validation
const result1 = await validateSpecWithAI(spec, { context });
context = result1.context;

// Second validation (maintains conversation history)
const result2 = await validateSpecWithAI(updatedSpec, { context });
```

## Error Handling

All AI operations can throw the following errors:

- `AIAuthenticationError`: OAuth authentication failed
- `AIRateLimitError`: Rate limit exceeded (includes retry-after)
- `AINetworkError`: Network or server errors
- `AITimeoutError`: Request timed out
- `AIParseError`: Failed to parse AI response
- `AIError`: Generic AI error

### Automatic Retry

Operations automatically retry on retryable errors (rate limits, network errors, timeouts) with exponential backoff:

```typescript
import { withRetry, DEFAULT_RETRY_STRATEGY } from './lib/ai/index.js';

// Custom retry strategy
const result = await withRetry(
  () => validateSpecWithAI(spec),
  {
    maxRetries: 5,
    initialDelayMs: 2000,
    maxDelayMs: 16000,
    backoffMultiplier: 2,
  }
);
```

## Provider System

### Supported Providers

- **Anthropic Claude** (MVP): Via OAuth 2.0 + PKCE
- *Google Gemini* (Post-MVP): Planned
- *GitHub Models* (Post-MVP): Planned
- *Ollama* (Post-MVP): Planned

### Creating a Provider

Implement the `AIProvider` interface:

```typescript
interface AIProvider {
  name: string;
  displayName: string;
  isAvailable(): Promise<boolean>;
  sendMessage(messages: AIMessage[], options?: AIRequestOptions): Promise<AIResponse>;
}
```

### Using a Provider

```typescript
import { createProvider } from './lib/ai/index.js';

// Get default provider (Anthropic)
const provider = await createProvider();

// Or specify provider by name
const anthropic = await createProvider('anthropic');
const claude = await createProvider('claude'); // Alias for anthropic
```

## Prompts

The module uses structured prompts for each operation:

- **Validation**: Comprehensive analysis with severity levels (error/warning/info)
- **Repair**: Minimal changes to fix errors while preserving intent
- **Enhancement**: Creative improvements to copy (higher temperature)

### Customizing Prompts

```typescript
import { getSystemPrompt, createValidationPrompt } from './lib/ai/index.js';

const systemPrompt = getSystemPrompt('validate');
const userPrompt = createValidationPrompt(spec, validationErrors);
```

## Context Management

Context maintains conversation history for multi-turn interactions:

```typescript
import {
  createContext,
  addUserMessage,
  addAssistantMessage,
  isContextValid,
} from './lib/ai/index.js';

// Create context
let context = createContext(spec, 'validate');

// Add messages
context = addUserMessage(context, 'Validate this spec');
context = addAssistantMessage(context, 'Spec looks good!');

// Check if context is still valid (not too old, spec hasn't changed)
if (isContextValid(context, spec)) {
  // Continue conversation
}
```

Context features:
- Automatic message truncation (keeps last 10 messages + system message)
- Timestamp tracking (context expires after 30 minutes)
- Spec hash validation (detects spec modifications)
- Operation tracking (last operation performed)

## Response Parsing

AI responses are parsed and validated:

```typescript
import { parseValidationResponse, safeParseResponse } from './lib/ai/index.js';

// Parse validation response
const validation = parseValidationResponse(aiResponse);

// Safe parsing with error handling
const validation = safeParseResponse(
  aiResponse,
  parseValidationResponse,
  'validation'
);
```

Parser features:
- Extracts JSON from markdown code blocks
- Validates response structure
- Validates against Zod schemas (for repair/enhancement)
- Throws `AIParseError` on malformed responses

## Testing

The module includes comprehensive tests:

```bash
npm test src/lib/ai
```

Test coverage includes:
- Error handling and retry logic
- Response parsing (valid and invalid cases)
- Context management
- Prompt generation
- Operations (with mock provider)

### Mock Provider

For testing, use the `MockAIProvider`:

```typescript
import { MockAIProvider, createMockValidationResponse } from './lib/ai/__tests__/mock-provider.js';

const mockProvider = new MockAIProvider();
mockProvider.setMockResponse('validation', createMockValidationResponse(true));

const result = await validateSpecWithAI(spec, { provider: mockProvider });
```

## Performance

- **Startup**: ~100ms (module load)
- **Validation**: ~2-5s (depends on spec size and AI latency)
- **Repair**: ~3-8s (more complex operation)
- **Enhancement**: ~3-8s (higher temperature, more creative)

Rate limits (Anthropic):
- Tier 1: 50 requests/minute, 40,000 tokens/minute
- Tier 2: 1,000 requests/minute, 80,000 tokens/minute

## Security

- OAuth tokens stored securely via OS keychain
- No API keys in source code
- All requests over HTTPS
- Token expiration checked before each request
- Automatic token refresh on expiry

## Future Enhancements

- [ ] Streaming responses for real-time feedback
- [ ] Caching of validation results (by spec hash)
- [ ] Multi-provider fallback (if one fails, try another)
- [ ] Cost tracking (token usage per operation)
- [ ] Verbose logging mode (debug AI interactions)
- [ ] Custom system prompts (user-configurable)
