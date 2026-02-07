/**
 * Generate output summary and statistics
 */

import pc from 'picocolors';
import { type OutputManifest, type FileMetadata, groupFilesByType } from './metadata.js';
import { formatFileSize } from './writer.js';
import { writeFileAtomic } from './writer.js';

/**
 * Generation summary
 */
export interface GenerationSummary {
  timestamp: string;
  outputDirectory: string;
  totalFiles: number;
  totalSize: number;
  filesByType: {
    screens: number;
    theme: number;
    components: number;
    navigation: number;
    config: number;
    other: number;
  };
  success: boolean;
  errors: string[];
  duration: number;
}

/**
 * Create generation summary from manifest
 */
export function createGenerationSummary(
  manifest: OutputManifest,
  success: boolean,
  errors: string[] = [],
  duration: number = 0
): GenerationSummary {
  const groups = groupFilesByType(manifest.files);

  return {
    timestamp: manifest.generatedAt,
    outputDirectory: manifest.outputDirectory,
    totalFiles: manifest.totalFiles,
    totalSize: manifest.totalSize,
    filesByType: {
      screens: groups.screen.length,
      theme: groups.theme.length,
      components: groups.component.length,
      navigation: groups.navigation.length,
      config: groups.config.length,
      other: groups.other.length,
    },
    success,
    errors,
    duration,
  };
}

/**
 * Save generation summary to disk
 */
export async function saveSummary(summaryPath: string, summary: GenerationSummary): Promise<void> {
  const content = JSON.stringify(summary, null, 2);
  await writeFileAtomic(summaryPath, content);
}

/**
 * Format summary for terminal display
 */
export function formatSummaryForTerminal(summary: GenerationSummary): string {
  const lines: string[] = [];

  lines.push('');
  lines.push(pc.bold(pc.cyan('Generation Summary')));
  lines.push(pc.dim('─'.repeat(60)));

  // Status
  const statusIcon = summary.success ? pc.green('✓') : pc.red('✗');
  const statusText = summary.success ? pc.green('Success') : pc.red('Failed');
  lines.push(`${statusIcon} Status: ${statusText}`);

  // Output directory
  lines.push(`${pc.cyan('📁')} Output: ${pc.dim(summary.outputDirectory)}`);

  // Statistics
  lines.push('');
  lines.push(pc.bold('Files Generated:'));
  lines.push(`  ${pc.cyan('Total Files:')} ${summary.totalFiles}`);
  lines.push(`  ${pc.cyan('Total Size:')} ${formatFileSize(summary.totalSize)}`);

  // Breakdown by type
  if (summary.filesByType.screens > 0) {
    lines.push(`  ${pc.cyan('Screens:')} ${summary.filesByType.screens}`);
  }
  if (summary.filesByType.theme > 0) {
    lines.push(`  ${pc.cyan('Theme Files:')} ${summary.filesByType.theme}`);
  }
  if (summary.filesByType.components > 0) {
    lines.push(`  ${pc.cyan('Components:')} ${summary.filesByType.components}`);
  }
  if (summary.filesByType.navigation > 0) {
    lines.push(`  ${pc.cyan('Navigation:')} ${summary.filesByType.navigation}`);
  }
  if (summary.filesByType.config > 0) {
    lines.push(`  ${pc.cyan('Config Files:')} ${summary.filesByType.config}`);
  }

  // Duration
  if (summary.duration > 0) {
    const durationSeconds = (summary.duration / 1000).toFixed(2);
    lines.push('');
    lines.push(`${pc.cyan('⏱️')}  Duration: ${durationSeconds}s`);
  }

  // Errors
  if (summary.errors.length > 0) {
    lines.push('');
    lines.push(pc.bold(pc.red('Errors:')));
    for (const error of summary.errors) {
      lines.push(`  ${pc.red('•')} ${error}`);
    }
  }

  lines.push(pc.dim('─'.repeat(60)));
  lines.push('');

  return lines.join('\n');
}

/**
 * Format file list for terminal display
 */
export function formatFileList(files: FileMetadata[], verbose: boolean = false): string {
  const lines: string[] = [];

  const groups = groupFilesByType(files);

  // Group files by type
  const sections = [
    { title: 'Screens', files: groups.screen, icon: '📱' },
    { title: 'Theme', files: groups.theme, icon: '🎨' },
    { title: 'Components', files: groups.component, icon: '🧩' },
    { title: 'Navigation', files: groups.navigation, icon: '🧭' },
    { title: 'Configuration', files: groups.config, icon: '⚙️' },
  ];

  for (const section of sections) {
    if (section.files.length === 0) continue;

    lines.push('');
    lines.push(pc.bold(`${section.icon}  ${section.title}:`));

    for (const file of section.files) {
      const sizeStr = verbose ? pc.dim(` (${formatFileSize(file.size)})`) : '';
      lines.push(`  ${pc.green('✓')} ${file.relativePath}${sizeStr}`);

      if (verbose && file.template) {
        lines.push(`    ${pc.dim(`Template: ${file.template}`)}`);
      }
    }
  }

  return lines.join('\n');
}

/**
 * Create a quick summary line
 */
export function createQuickSummary(summary: GenerationSummary): string {
  const statusIcon = summary.success ? pc.green('✓') : pc.red('✗');
  return `${statusIcon} Generated ${summary.totalFiles} files (${formatFileSize(summary.totalSize)}) in ${(summary.duration / 1000).toFixed(2)}s`;
}

/**
 * Format errors for display
 */
export function formatErrors(errors: string[]): string {
  if (errors.length === 0) {
    return '';
  }

  const lines: string[] = [];
  lines.push('');
  lines.push(pc.bold(pc.red('Errors:')));

  for (const error of errors) {
    lines.push(`  ${pc.red('✗')} ${error}`);
  }

  return lines.join('\n');
}

/**
 * Create success message with next steps
 */
export function createSuccessMessage(outputDir: string): string {
  const lines: string[] = [];

  lines.push('');
  lines.push(pc.green('✓ ') + pc.bold('Generation completed successfully!'));
  lines.push('');
  lines.push(pc.dim('Next steps:'));
  lines.push(pc.dim('  1. Review the generated files in ') + pc.cyan(outputDir));
  lines.push(pc.dim('  2. Copy the files to your React Native project'));
  lines.push(pc.dim('  3. Install required dependencies:'));
  lines.push(pc.dim('     ') + pc.cyan('npm install @react-navigation/native'));
  lines.push(pc.dim('  4. Import and use the screens in your app'));
  lines.push('');

  return lines.join('\n');
}
