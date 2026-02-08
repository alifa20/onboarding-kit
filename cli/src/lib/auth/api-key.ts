/**
 * API Key Authentication for Anthropic
 * Simpler alternative to OAuth for CLI usage
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const CONFIG_DIR = join(homedir(), '.onboardkit');
const API_KEY_FILE = join(CONFIG_DIR, 'api-key.txt');

/**
 * Save API key to config file
 */
export async function saveApiKey(apiKey: string): Promise<void> {
  if (!existsSync(CONFIG_DIR)) {
    await mkdir(CONFIG_DIR, { recursive: true });
  }

  await writeFile(API_KEY_FILE, apiKey.trim(), 'utf-8');
}

/**
 * Load API key from config file or environment
 */
export async function loadApiKey(): Promise<string | null> {
  // Check environment variable first
  if (process.env.ANTHROPIC_API_KEY) {
    return process.env.ANTHROPIC_API_KEY;
  }

  // Check config file
  try {
    if (existsSync(API_KEY_FILE)) {
      const apiKey = await readFile(API_KEY_FILE, 'utf-8');
      return apiKey.trim();
    }
  } catch (error) {
    // Ignore read errors
  }

  return null;
}

/**
 * Check if API key exists
 */
export async function hasApiKey(): Promise<boolean> {
  const apiKey = await loadApiKey();
  return apiKey !== null && apiKey.length > 0;
}

/**
 * Validate API key format
 */
export function isValidApiKey(apiKey: string): boolean {
  // Anthropic API keys start with "sk-ant-"
  // Subscription tokens from `claude setup-token` are longer base64 strings
  return (apiKey.startsWith('sk-ant-') || apiKey.length > 50) && apiKey.length > 20;
}

/**
 * Test API key by making a simple API call
 */
export async function testApiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }],
      }),
    });

    return response.ok || response.status === 400; // 400 is ok, means auth worked
  } catch (error) {
    return false;
  }
}

/**
 * Remove saved API key
 */
export async function removeApiKey(): Promise<void> {
  if (existsSync(API_KEY_FILE)) {
    const { unlink } = await import('node:fs/promises');
    await unlink(API_KEY_FILE);
  }
}
