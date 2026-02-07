/**
 * File metadata tracking and manifest generation
 */

import { createHash } from 'node:crypto';
import { stat } from 'node:fs/promises';
import { relative } from 'node:path';
import { writeFileAtomic, type WriteResult } from './writer.js';

/**
 * File metadata
 */
export interface FileMetadata {
  path: string;
  relativePath: string;
  size: number;
  checksum: string;
  timestamp: string;
  template?: string;
  type: 'screen' | 'theme' | 'component' | 'navigation' | 'config' | 'other';
}

/**
 * Output manifest
 */
export interface OutputManifest {
  version: string;
  generatedAt: string;
  outputDirectory: string;
  files: FileMetadata[];
  totalFiles: number;
  totalSize: number;
}

/**
 * Compute SHA-256 checksum of content
 */
export function computeChecksum(content: string): string {
  return createHash('sha256').update(content, 'utf-8').digest('hex');
}

/**
 * Determine file type from path
 */
export function determineFileType(relativePath: string): FileMetadata['type'] {
  if (relativePath.startsWith('screens/')) {
    return 'screen';
  }
  if (relativePath.startsWith('theme/')) {
    return 'theme';
  }
  if (relativePath.startsWith('components/')) {
    return 'component';
  }
  if (relativePath.startsWith('navigation/')) {
    return 'navigation';
  }
  if (relativePath === 'index.ts' || relativePath.endsWith('.json')) {
    return 'config';
  }
  return 'other';
}

/**
 * Create file metadata from content
 */
export function createFileMetadata(
  absolutePath: string,
  content: string,
  baseDir: string,
  template?: string
): FileMetadata {
  const relativePath = relative(baseDir, absolutePath);

  return {
    path: absolutePath,
    relativePath,
    size: Buffer.byteLength(content, 'utf-8'),
    checksum: computeChecksum(content),
    timestamp: new Date().toISOString(),
    template,
    type: determineFileType(relativePath),
  };
}

/**
 * Create output manifest
 */
export function createOutputManifest(
  outputDirectory: string,
  files: FileMetadata[]
): OutputManifest {
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  return {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    outputDirectory,
    files,
    totalFiles: files.length,
    totalSize,
  };
}

/**
 * Save manifest to disk
 */
export async function saveManifest(
  manifestPath: string,
  manifest: OutputManifest
): Promise<WriteResult> {
  const content = JSON.stringify(manifest, null, 2);
  return writeFileAtomic(manifestPath, content);
}

/**
 * Get file metadata from disk
 */
export async function getFileMetadata(filePath: string): Promise<Pick<FileMetadata, 'size'>> {
  const stats = await stat(filePath);
  return {
    size: stats.size,
  };
}

/**
 * Verify file checksum
 */
export function verifyChecksum(content: string, expectedChecksum: string): boolean {
  return computeChecksum(content) === expectedChecksum;
}

/**
 * Group files by type
 */
export function groupFilesByType(files: FileMetadata[]): Record<FileMetadata['type'], FileMetadata[]> {
  const groups: Record<FileMetadata['type'], FileMetadata[]> = {
    screen: [],
    theme: [],
    component: [],
    navigation: [],
    config: [],
    other: [],
  };

  for (const file of files) {
    groups[file.type].push(file);
  }

  return groups;
}

/**
 * Calculate statistics from manifest
 */
export interface ManifestStats {
  totalFiles: number;
  totalSize: number;
  screenCount: number;
  themeCount: number;
  componentCount: number;
  navigationCount: number;
  avgFileSize: number;
}

export function calculateManifestStats(manifest: OutputManifest): ManifestStats {
  const groups = groupFilesByType(manifest.files);

  return {
    totalFiles: manifest.totalFiles,
    totalSize: manifest.totalSize,
    screenCount: groups.screen.length,
    themeCount: groups.theme.length,
    componentCount: groups.component.length,
    navigationCount: groups.navigation.length,
    avgFileSize: manifest.totalFiles > 0 ? manifest.totalSize / manifest.totalFiles : 0,
  };
}
