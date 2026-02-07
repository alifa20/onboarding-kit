import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';

/**
 * Compute SHA-256 hash of file content
 */
export async function computeSpecHash(filePath: string): Promise<string> {
  const content = await readFile(filePath, 'utf-8');
  const hash = createHash('sha256');
  hash.update(content);
  return hash.digest('hex');
}

/**
 * Compute SHA-256 hash of string content
 */
export function computeHash(content: string): string {
  const hash = createHash('sha256');
  hash.update(content);
  return hash.digest('hex');
}

/**
 * Storage location for hash metadata
 */
const HASH_DIR = '.onboardkit';
const HASH_FILE = 'spec-hash.json';

/**
 * Hash metadata structure
 */
interface HashMetadata {
  specPath: string;
  hash: string;
  timestamp: string;
  lastModified?: string;
}

/**
 * Get the hash file path
 */
function getHashFilePath(baseDir: string = process.cwd()): string {
  return join(baseDir, HASH_DIR, HASH_FILE);
}

/**
 * Save spec hash to storage
 */
export async function saveSpecHash(
  specPath: string,
  hash: string,
  baseDir: string = process.cwd()
): Promise<void> {
  const hashDir = join(baseDir, HASH_DIR);
  const hashFilePath = getHashFilePath(baseDir);

  // Create directory if it doesn't exist
  if (!existsSync(hashDir)) {
    await mkdir(hashDir, { recursive: true });
  }

  const metadata: HashMetadata = {
    specPath,
    hash,
    timestamp: new Date().toISOString(),
  };

  await writeFile(hashFilePath, JSON.stringify(metadata, null, 2), 'utf-8');
}

/**
 * Load saved spec hash from storage
 */
export async function loadSpecHash(baseDir: string = process.cwd()): Promise<HashMetadata | null> {
  const hashFilePath = getHashFilePath(baseDir);

  if (!existsSync(hashFilePath)) {
    return null;
  }

  try {
    const content = await readFile(hashFilePath, 'utf-8');
    return JSON.parse(content) as HashMetadata;
  } catch {
    return null;
  }
}

/**
 * Check if spec has been modified since last hash
 */
export async function hasSpecChanged(
  specPath: string,
  baseDir: string = process.cwd()
): Promise<boolean> {
  const savedHash = await loadSpecHash(baseDir);

  if (!savedHash) {
    return true; // No saved hash means it's new
  }

  if (savedHash.specPath !== specPath) {
    return true; // Different spec file
  }

  const currentHash = await computeSpecHash(specPath);
  return currentHash !== savedHash.hash;
}

/**
 * Detect spec modifications and return details
 */
export async function detectSpecModification(
  specPath: string,
  baseDir: string = process.cwd()
): Promise<{
  isModified: boolean;
  currentHash: string;
  savedHash: string | null;
  savedTimestamp: string | null;
}> {
  const currentHash = await computeSpecHash(specPath);
  const savedMetadata = await loadSpecHash(baseDir);

  return {
    isModified: savedMetadata ? currentHash !== savedMetadata.hash : true,
    currentHash,
    savedHash: savedMetadata?.hash ?? null,
    savedTimestamp: savedMetadata?.timestamp ?? null,
  };
}
