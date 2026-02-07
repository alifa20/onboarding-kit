import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import {
  computeHash,
  computeSpecHash,
  saveSpecHash,
  loadSpecHash,
  hasSpecChanged,
  detectSpecModification,
} from '../hash.js';

const TEST_DIR = join(process.cwd(), '.test-tmp');
const TEST_SPEC_PATH = join(TEST_DIR, 'test-spec.md');

describe('hash', () => {
  beforeEach(async () => {
    // Create test directory
    if (!existsSync(TEST_DIR)) {
      await mkdir(TEST_DIR, { recursive: true });
    }
  });

  afterEach(async () => {
    // Clean up test directory
    if (existsSync(TEST_DIR)) {
      await rm(TEST_DIR, { recursive: true, force: true });
    }
  });

  it('should compute consistent hash for same content', () => {
    const content = 'Hello, World!';
    const hash1 = computeHash(content);
    const hash2 = computeHash(content);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 produces 64 hex characters
  });

  it('should compute different hash for different content', () => {
    const content1 = 'Hello, World!';
    const content2 = 'Hello, Universe!';
    const hash1 = computeHash(content1);
    const hash2 = computeHash(content2);

    expect(hash1).not.toBe(hash2);
  });

  it('should compute hash from file', async () => {
    const content = 'Test spec content';
    await writeFile(TEST_SPEC_PATH, content, 'utf-8');

    const hash = await computeSpecHash(TEST_SPEC_PATH);

    expect(hash).toHaveLength(64);
    expect(hash).toBe(computeHash(content));
  });

  it('should save and load hash metadata', async () => {
    const specPath = '/path/to/spec.md';
    const hash = 'abc123';

    await saveSpecHash(specPath, hash, TEST_DIR);

    const loaded = await loadSpecHash(TEST_DIR);

    expect(loaded).not.toBeNull();
    expect(loaded?.specPath).toBe(specPath);
    expect(loaded?.hash).toBe(hash);
    expect(loaded?.timestamp).toBeDefined();
  });

  it('should return null when no hash file exists', async () => {
    const loaded = await loadSpecHash(TEST_DIR);

    expect(loaded).toBeNull();
  });

  it('should detect when spec has not changed', async () => {
    const content = 'Test spec content';
    await writeFile(TEST_SPEC_PATH, content, 'utf-8');

    const hash = await computeSpecHash(TEST_SPEC_PATH);
    await saveSpecHash(TEST_SPEC_PATH, hash, TEST_DIR);

    const changed = await hasSpecChanged(TEST_SPEC_PATH, TEST_DIR);

    expect(changed).toBe(false);
  });

  it('should detect when spec has changed', async () => {
    const content1 = 'Original content';
    await writeFile(TEST_SPEC_PATH, content1, 'utf-8');

    const hash1 = await computeSpecHash(TEST_SPEC_PATH);
    await saveSpecHash(TEST_SPEC_PATH, hash1, TEST_DIR);

    // Modify the file
    const content2 = 'Modified content';
    await writeFile(TEST_SPEC_PATH, content2, 'utf-8');

    const changed = await hasSpecChanged(TEST_SPEC_PATH, TEST_DIR);

    expect(changed).toBe(true);
  });

  it('should detect spec modification with details', async () => {
    const content = 'Test spec content';
    await writeFile(TEST_SPEC_PATH, content, 'utf-8');

    const hash = await computeSpecHash(TEST_SPEC_PATH);
    await saveSpecHash(TEST_SPEC_PATH, hash, TEST_DIR);

    const result = await detectSpecModification(TEST_SPEC_PATH, TEST_DIR);

    expect(result.isModified).toBe(false);
    expect(result.currentHash).toBe(hash);
    expect(result.savedHash).toBe(hash);
    expect(result.savedTimestamp).toBeDefined();
  });

  it('should detect new spec file', async () => {
    const content = 'New spec content';
    await writeFile(TEST_SPEC_PATH, content, 'utf-8');

    const result = await detectSpecModification(TEST_SPEC_PATH, TEST_DIR);

    expect(result.isModified).toBe(true);
    expect(result.currentHash).toBeDefined();
    expect(result.savedHash).toBeNull();
    expect(result.savedTimestamp).toBeNull();
  });
});
