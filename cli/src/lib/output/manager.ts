/**
 * Output directory management
 */

import { mkdir, access, stat } from 'node:fs/promises';
import { constants } from 'node:fs';
import { resolve, join } from 'node:path';
import { getOutputStructure, getAllDirectories, type OutputStructure } from './structure.js';

/**
 * Output manager options
 */
export interface OutputManagerOptions {
  overwrite?: boolean;
  dryRun?: boolean;
}

/**
 * Output manager result
 */
export interface OutputManagerResult {
  structure: OutputStructure;
  created: string[];
  skipped: string[];
  errors: Array<{ path: string; error: string }>;
}

/**
 * Directory permission error details
 */
export class DirectoryPermissionError extends Error {
  constructor(
    public path: string,
    public operation: 'read' | 'write'
  ) {
    super(`No ${operation} permission for directory: ${path}`);
    this.name = 'DirectoryPermissionError';
  }
}

/**
 * Directory already exists error
 */
export class DirectoryExistsError extends Error {
  constructor(public path: string) {
    super(`Directory already exists: ${path}`);
    this.name = 'DirectoryExistsError';
  }
}

/**
 * Create output directory structure
 */
export async function createOutputDirectory(
  outputPath: string,
  options: OutputManagerOptions = {}
): Promise<OutputManagerResult> {
  const { overwrite = false, dryRun = false } = options;

  // Resolve to absolute path
  const absolutePath = resolve(outputPath);

  // Get standard structure
  const structure = getOutputStructure(absolutePath);
  const directories = getAllDirectories(structure);

  const result: OutputManagerResult = {
    structure,
    created: [],
    skipped: [],
    errors: [],
  };

  // Check if root directory exists
  const rootExists = await directoryExists(absolutePath);

  if (rootExists && !overwrite) {
    throw new DirectoryExistsError(absolutePath);
  }

  // Create directories
  for (const dir of directories) {
    try {
      const exists = await directoryExists(dir);

      if (exists) {
        result.skipped.push(dir);
        continue;
      }

      if (!dryRun) {
        await mkdir(dir, { recursive: true, mode: 0o755 });
      }

      result.created.push(dir);
    } catch (error) {
      result.errors.push({
        path: dir,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return result;
}

/**
 * Validate directory permissions
 */
export async function validateDirectoryPermissions(dirPath: string): Promise<void> {
  const absolutePath = resolve(dirPath);

  try {
    // Check read permission
    await access(absolutePath, constants.R_OK);
  } catch {
    throw new DirectoryPermissionError(absolutePath, 'read');
  }

  try {
    // Check write permission
    await access(absolutePath, constants.W_OK);
  } catch {
    throw new DirectoryPermissionError(absolutePath, 'write');
  }
}

/**
 * Check if directory exists
 */
export async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    const stats = await stat(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Get directory size recursively
 */
export async function getDirectorySize(dirPath: string): Promise<number> {
  try {
    const stats = await stat(dirPath);

    if (!stats.isDirectory()) {
      return stats.size;
    }

    // For directories, we'll return 0 for now
    // Full recursive calculation would require fs.readdir which we'll skip for simplicity
    return 0;
  } catch {
    return 0;
  }
}

/**
 * Ensure output directory is ready for writing
 */
export async function ensureOutputDirectory(
  outputPath: string,
  options: OutputManagerOptions = {}
): Promise<OutputStructure> {
  const result = await createOutputDirectory(outputPath, options);

  if (result.errors.length > 0) {
    const errorMessages = result.errors.map((e) => `  ${e.path}: ${e.error}`).join('\n');
    throw new Error(`Failed to create output directories:\n${errorMessages}`);
  }

  // Validate permissions on root directory
  await validateDirectoryPermissions(result.structure.root);

  return result.structure;
}
