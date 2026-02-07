import { OnboardingSpec, ValidationError } from '../../spec/schema.js';

/**
 * System prompt for validation operation
 */
export const VALIDATION_SYSTEM_PROMPT = `You are a helpful assistant that validates onboarding screen specifications for React Native/Expo applications.

Your task is to analyze the provided specification and identify any issues with:
- Missing required fields
- Invalid data formats
- Inconsistent styling or theming
- Poor user experience patterns
- Accessibility concerns
- Best practice violations

Respond with a JSON object in this exact format:
{
  "isValid": boolean,
  "issues": [
    {
      "severity": "error" | "warning" | "info",
      "path": "field.path.here",
      "message": "Description of the issue",
      "suggestion": "How to fix it (optional)"
    }
  ],
  "suggestions": ["Overall suggestions for improvement (optional)"]
}

Be thorough but concise. Focus on actionable feedback.`;

/**
 * Create validation user prompt
 */
export function createValidationPrompt(spec: OnboardingSpec, validationErrors?: ValidationError[]): string {
  let prompt = `Please validate this onboarding specification:\n\n`;
  prompt += `\`\`\`json\n${JSON.stringify(spec, null, 2)}\n\`\`\`\n\n`;

  if (validationErrors && validationErrors.length > 0) {
    prompt += `Schema validation detected these errors:\n`;
    for (const error of validationErrors) {
      prompt += `- ${error.path.join('.')}: ${error.message}\n`;
    }
    prompt += `\nPlease identify any additional issues beyond these schema errors.\n`;
  }

  return prompt;
}

/**
 * System prompt for repair operation
 */
export const REPAIR_SYSTEM_PROMPT = `You are a helpful assistant that repairs invalid onboarding screen specifications for React Native/Expo applications.

Your task is to fix the specification based on the validation errors provided. You should:
- Fix all validation errors
- Preserve the user's intent and content as much as possible
- Only change what's necessary to make the spec valid
- Ensure all required fields are present
- Follow React Native/Expo best practices

Respond with a JSON object in this exact format:
{
  "repairedSpec": { /* the complete fixed specification */ },
  "changes": [
    {
      "path": "field.path.here",
      "before": "old value",
      "after": "new value",
      "reason": "Why this change was made"
    }
  ],
  "explanation": "Summary of all changes made"
}

Make minimal changes necessary. Preserve user content whenever possible.`;

/**
 * Create repair user prompt
 */
export function createRepairPrompt(spec: unknown, validationErrors: ValidationError[]): string {
  let prompt = `Please repair this invalid specification:\n\n`;
  prompt += `\`\`\`json\n${JSON.stringify(spec, null, 2)}\n\`\`\`\n\n`;
  prompt += `Validation errors to fix:\n`;

  for (const error of validationErrors) {
    const path = error.path.join('.');
    prompt += `- ${path}: ${error.message}\n`;
  }

  prompt += `\nPlease fix these errors while preserving the original intent as much as possible.\n`;

  return prompt;
}

/**
 * System prompt for enhancement operation
 */
export const ENHANCEMENT_SYSTEM_PROMPT = `You are a helpful assistant that enhances onboarding screen specifications for React Native/Expo applications.

Your task is to improve the specification by:
- Making headlines more engaging and clear
- Improving subtext to be more compelling
- Enhancing CTAs (call-to-action) to be more action-oriented
- Making feature descriptions more benefit-focused
- Ensuring consistent tone and voice
- Improving overall user experience

Respond with a JSON object in this exact format:
{
  "enhancedSpec": { /* the complete enhanced specification */ },
  "enhancements": [
    {
      "path": "field.path.here",
      "before": "old value",
      "after": "new value",
      "type": "headline" | "subtext" | "cta" | "feature" | "general"
    }
  ],
  "explanation": "Summary of enhancements made"
}

Guidelines:
- Keep the same meaning but make it more engaging
- Use active voice
- Be concise but compelling
- Match the app's purpose and target audience
- Maintain brand consistency`;

/**
 * Create enhancement user prompt
 */
export function createEnhancementPrompt(spec: OnboardingSpec): string {
  let prompt = `Please enhance this valid specification to make it more engaging and user-friendly:\n\n`;
  prompt += `\`\`\`json\n${JSON.stringify(spec, null, 2)}\n\`\`\`\n\n`;
  prompt += `Project: ${spec.projectName}\n\n`;
  prompt += `Focus on improving:\n`;
  prompt += `- Headlines: Make them clear and compelling\n`;
  prompt += `- Subtext: Make it engaging and benefit-focused\n`;
  prompt += `- CTAs: Make them action-oriented and enticing\n`;
  prompt += `- Features: Make them benefit-focused, not feature-focused\n\n`;
  prompt += `Keep changes minimal but impactful. Preserve the core message.\n`;

  return prompt;
}

/**
 * Create system prompt for a given operation type
 */
export function getSystemPrompt(operation: 'validate' | 'repair' | 'enhance'): string {
  switch (operation) {
    case 'validate':
      return VALIDATION_SYSTEM_PROMPT;
    case 'repair':
      return REPAIR_SYSTEM_PROMPT;
    case 'enhance':
      return ENHANCEMENT_SYSTEM_PROMPT;
  }
}
