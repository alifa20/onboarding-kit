/**
 * Atomic file writing with proper error handling
 */

import { writeFile, rename, unlink, chmod } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { randomBytes } from 'node:crypto';
import { mkdir } from 'node:fs/promises';

/**
 * File write options
 */
export interface WriteOptions {
  dryRun?: boolean;
  mode?: number;
  encoding?: BufferEncoding;
}

/**
 * File write result
 */
export interface WriteResult {
  path: string;
  size: number;
  success: boolean;
  error?: string;
}

/**
 * Batch write result
 */
export interface BatchWriteResult {
  files: WriteResult[];
  totalSize: number;
  successCount: number;
  failureCount: number;
}

/**
 * Write a file atomically using temp file + rename
 */
export async function writeFileAtomic(
  filePath: string,
  content: string,
  options: WriteOptions = {}
): Promise<WriteResult> {
  const { dryRun = false, mode = 0o644, encoding = 'utf-8' } = options;

  const result: WriteResult = {
    path: filePath,
    size: Buffer.byteLength(content, encoding),
    success: false,
  };

  if (dryRun) {
    result.success = true;
    return result;
  }

  // Generate temporary file name
  const tmpPath = `${filePath}.tmp-${randomBytes(6).toString('hex')}`;

  try {
    // Ensure directory exists
    const dir = dirname(filePath);
    await mkdir(dir, { recursive: true, mode: 0o755 });

    // Write to temporary file
    await writeFile(tmpPath, content, { encoding, mode });

    // Set proper permissions
    await chmod(tmpPath, mode);

    // Atomic rename
    await rename(tmpPath, filePath);

    result.success = true;
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error';

    // Clean up temp file if it exists
    try {
      await unlink(tmpPath);
    } catch {
      // Ignore cleanup errors
    }
  }

  return result;
}

/**
 * Write multiple files atomically
 */
export async function writeFiles(
  files: Record<string, string>,
  baseDir: string,
  options: WriteOptions = {}
): Promise<BatchWriteResult> {
  const results: WriteResult[] = [];
  let totalSize = 0;
  let successCount = 0;
  let failureCount = 0;

  for (const [relativePath, content] of Object.entries(files)) {
    const fullPath = join(baseDir, relativePath);
    const result = await writeFileAtomic(fullPath, content, options);

    results.push(result);
    totalSize += result.size;

    if (result.success) {
      successCount++;
    } else {
      failureCount++;
    }
  }

  return {
    files: results,
    totalSize,
    successCount,
    failureCount,
  };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Validate file content before writing
 */
export function validateContent(content: string, maxSize: number = 10 * 1024 * 1024): boolean {
  // Check content is not empty
  if (!content || content.trim().length === 0) {
    return false;
  }

  // Check size limit (default 10MB)
  if (Buffer.byteLength(content, 'utf-8') > maxSize) {
    return false;
  }

  return true;
}

/**
 * Get file extension from path
 */
export function getFileExtension(filePath: string): string {
  const parts = filePath.split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

/**
 * Check if file is a TypeScript file
 */
export function isTypeScriptFile(filePath: string): boolean {
  const ext = getFileExtension(filePath);
  return ext === 'ts' || ext === 'tsx';
}

/**
 * Check if file is a JSON file
 */
export function isJSONFile(filePath: string): boolean {
  return getFileExtension(filePath) === 'json';
}
