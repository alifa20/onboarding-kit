/**
 * Stitch MCP Integration
 * Public exports for Stitch functionality
 */

export { buildStitchPrompts, formatPromptsAsMarkdown } from './prompt-builder.js';

export {
  isStitchMCPAvailable,
  createStitchProject,
  generateStitchScreen,
  getStitchScreen,
  listStitchScreens,
  generateAllScreens,
} from './client.js';

export type {
  StitchPrompt,
  StitchProject,
  StitchScreen,
  StitchGenerationResult,
} from './types.js';
