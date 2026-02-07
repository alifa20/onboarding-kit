/**
 * Checkpoint management for workflow resumption
 */

import { mkdir, writeFile, readFile, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import type { Checkpoint, WorkflowPhase } from './types.js';

/**
 * Checkpoint directory (relative to project root)
 */
const CHECKPOINT_DIR = '.onboardkit';
const CHECKPOINT_FILE = 'checkpoint.json';

/**
 * Get checkpoint file path for a spec
 */
export function getCheckpointPath(specPath: string): string {
  const dir = dirname(specPath);
  return join(dir, CHECKPOINT_DIR, CHECKPOINT_FILE);
}

/**
 * Ensure checkpoint directory exists
 */
async function ensureCheckpointDir(checkpointPath: string): Promise<void> {
  const dir = dirname(checkpointPath);
  await mkdir(dir, { recursive: true, mode: 0o755 });
}

/**
 * Save checkpoint to disk
 */
export async function saveCheckpoint(checkpoint: Checkpoint): Promise<void> {
  const checkpointPath = getCheckpointPath(checkpoint.specPath);

  await ensureCheckpointDir(checkpointPath);

  const json = JSON.stringify(checkpoint, null, 2);
  await writeFile(checkpointPath, json, 'utf-8');
}

/**
 * Load checkpoint from disk
 */
export async function loadCheckpoint(specPath: string): Promise<Checkpoint | null> {
  const checkpointPath = getCheckpointPath(specPath);

  if (!existsSync(checkpointPath)) {
    return null;
  }

  try {
    const json = await readFile(checkpointPath, 'utf-8');
    const checkpoint = JSON.parse(json) as Checkpoint;

    // Validate checkpoint structure
    if (!isValidCheckpoint(checkpoint)) {
      return null;
    }

    return checkpoint;
  } catch {
    // If checkpoint is corrupted, return null
    return null;
  }
}

/**
 * Clear checkpoint from disk
 */
export async function clearCheckpoint(specPath: string): Promise<void> {
  const checkpointPath = getCheckpointPath(specPath);

  if (existsSync(checkpointPath)) {
    await unlink(checkpointPath);
  }
}

/**
 * Check if checkpoint exists
 */
export function hasCheckpoint(specPath: string): boolean {
  const checkpointPath = getCheckpointPath(specPath);
  return existsSync(checkpointPath);
}

/**
 * Validate checkpoint structure
 */
function isValidCheckpoint(checkpoint: any): checkpoint is Checkpoint {
  return (
    checkpoint &&
    typeof checkpoint.phase === 'number' &&
    typeof checkpoint.specHash === 'string' &&
    typeof checkpoint.timestamp === 'string' &&
    typeof checkpoint.specPath === 'string' &&
    typeof checkpoint.outputPath === 'string' &&
    typeof checkpoint.data === 'object'
  );
}

/**
 * Create a new checkpoint
 */
export function createCheckpoint(
  phase: WorkflowPhase,
  specHash: string,
  specPath: string,
  outputPath: string,
  data: Checkpoint['data'] = {}
): Checkpoint {
  return {
    phase,
    specHash,
    timestamp: new Date().toISOString(),
    specPath,
    outputPath,
    data,
  };
}

/**
 * Update checkpoint with new phase and data
 */
export function updateCheckpoint(
  checkpoint: Checkpoint,
  phase: WorkflowPhase,
  data: Partial<Checkpoint['data']>
): Checkpoint {
  return {
    ...checkpoint,
    phase,
    timestamp: new Date().toISOString(),
    data: {
      ...checkpoint.data,
      ...data,
    },
  };
}

/**
 * Check if checkpoint is valid for current spec
 * (spec hash must match)
 */
export function isCheckpointValid(checkpoint: Checkpoint, currentSpecHash: string): boolean {
  return checkpoint.specHash === currentSpecHash;
}

/**
 * Get checkpoint age in milliseconds
 */
export function getCheckpointAge(checkpoint: Checkpoint): number {
  const checkpointTime = new Date(checkpoint.timestamp).getTime();
  const now = Date.now();
  return now - checkpointTime;
}

/**
 * Format checkpoint age for display
 */
export function formatCheckpointAge(checkpoint: Checkpoint): string {
  const ageMs = getCheckpointAge(checkpoint);
  const ageSec = Math.floor(ageMs / 1000);
  const ageMin = Math.floor(ageSec / 60);
  const ageHour = Math.floor(ageMin / 60);
  const ageDay = Math.floor(ageHour / 24);

  if (ageDay > 0) {
    return `${ageDay} day${ageDay > 1 ? 's' : ''} ago`;
  } else if (ageHour > 0) {
    return `${ageHour} hour${ageHour > 1 ? 's' : ''} ago`;
  } else if (ageMin > 0) {
    return `${ageMin} minute${ageMin > 1 ? 's' : ''} ago`;
  } else {
    return 'just now';
  }
}
