/**
 * Authentication module
 * Handles both API key and OAuth authentication
 */

export {
  saveApiKey,
  loadApiKey,
  hasApiKey,
  isValidApiKey,
  testApiKey,
  removeApiKey,
} from './api-key.js';
