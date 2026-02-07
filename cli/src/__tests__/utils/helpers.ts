import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { expect } from 'vitest';

/**
 * Recursively gets all files in a directory
 */
export async function getAllFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stats = await stat(fullPath);

    if (stats.isDirectory()) {
      const subFiles = await getAllFiles(fullPath);
      files.push(...subFiles);
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Checks if a file exists
 */
export async function fileExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Reads a file and returns its content
 */
export async function readFileContent(path: string): Promise<string> {
  return readFile(path, 'utf-8');
}

/**
 * Asserts that a file exists
 */
export async function expectFileExists(path: string): Promise<void> {
  const exists = await fileExists(path);
  expect(exists).toBe(true);
}

/**
 * Asserts that a file contains specific content
 */
export async function expectFileContains(path: string, content: string): Promise<void> {
  const fileContent = await readFileContent(path);
  expect(fileContent).toContain(content);
}

/**
 * Asserts that multiple files exist
 */
export async function expectFilesExist(paths: string[]): Promise<void> {
  for (const path of paths) {
    await expectFileExists(path);
  }
}

/**
 * Validates TypeScript code syntax (basic check)
 */
export function validateTypeScriptSyntax(code: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for basic syntax issues
  const openBraces = (code.match(/{/g) || []).length;
  const closeBraces = (code.match(/}/g) || []).length;
  if (openBraces !== closeBraces) {
    errors.push(`Mismatched braces: ${openBraces} open, ${closeBraces} close`);
  }

  const openParens = (code.match(/\(/g) || []).length;
  const closeParens = (code.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    errors.push(`Mismatched parentheses: ${openParens} open, ${closeParens} close`);
  }

  // Check for import statements
  if (!code.includes('import')) {
    errors.push('No import statements found');
  }

  // Check for export statements
  if (!code.includes('export')) {
    errors.push('No export statements found');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Checks if generated code uses React Native imports
 */
export function hasReactNativeImports(code: string): boolean {
  return (
    code.includes("from 'react-native'") ||
    code.includes('from "react-native"') ||
    code.includes("from 'react'") ||
    code.includes('from "react"')
  );
}

/**
 * Checks if code uses StyleSheet
 */
export function usesStyleSheet(code: string): boolean {
  return code.includes('StyleSheet.create') || code.includes('StyleSheet.');
}

/**
 * Checks for hardcoded values (anti-pattern)
 */
export function hasHardcodedValues(code: string): boolean {
  // Check for common hardcoded patterns
  const hardcodedPatterns = [
    /#[0-9A-Fa-f]{6}\b/g, // Hex colors
    /\bwidth:\s*\d+/g, // Fixed widths
    /\bheight:\s*\d+/g, // Fixed heights
    /\bfontSize:\s*\d+/g, // Fixed font sizes
  ];

  // Only consider it hardcoded if it's not in a theme file
  if (code.includes('// theme file') || code.includes('export const colors')) {
    return false;
  }

  return hardcodedPatterns.some((pattern) => pattern.test(code));
}

/**
 * Sleep utility for async tests
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries an async function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: { maxAttempts?: number; delayMs?: number } = {},
): Promise<T> {
  const { maxAttempts = 3, delayMs = 100 } = options;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }
      await sleep(delayMs * attempt);
    }
  }

  throw new Error('Retry failed');
}

/**
 * Measures execution time of a function
 */
export async function measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; durationMs: number }> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  return { result, durationMs: end - start };
}
