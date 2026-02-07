/**
 * Generate command - Template-only code generation (no AI)
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import { promises as fs } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseMarkdownSpec } from '../lib/spec/parser.js';
import { validateSpec } from '../lib/spec/validator.js';
import { renderTemplates } from '../lib/templates/renderer.js';
import {
  ensureOutputDirectory,
  DirectoryExistsError,
} from '../lib/output/manager.js';
import { writeFiles } from '../lib/output/writer.js';
import {
  createFileMetadata,
  createOutputManifest,
  saveManifest,
} from '../lib/output/metadata.js';
import { saveSummary, createGenerationSummary, formatSummaryForTerminal } from '../lib/output/summary.js';
import { createLogger } from '../lib/output/logger.js';
import { FILE_NAMES } from '../lib/output/structure.js';

interface GenerateOptions {
  spec?: string;
  output?: string;
  verbose?: boolean;
  dryRun?: boolean;
  overwrite?: boolean;
}

/**
 * Generate screens from spec (template-only, no AI)
 */
export async function generateCommand(options: GenerateOptions): Promise<void> {
  const startTime = Date.now();
  p.intro(pc.bgCyan(pc.black(' OnboardKit Generate ')));

  // Initialize logger
  const logger = createLogger(options.verbose);

  try {
    // Determine spec file path
    const specPath = options.spec || 'spec.md';
    const resolvedSpecPath = resolve(process.cwd(), specPath);

    // Check if spec file exists
    try {
      await fs.access(resolvedSpecPath);
    } catch {
      p.outro(pc.red(`✖ Spec file not found: ${specPath}`));
      p.note(
        `Run ${pc.cyan('onboardkit init')} to create a new spec file.`,
        'No spec file found',
      );
      process.exit(1);
    }

    logger.debug(`Reading spec from: ${resolvedSpecPath}`);

    // Parse spec file
    const spinner = p.spinner();
    spinner.start('Parsing spec file');

    let specContent: string;
    try {
      specContent = await fs.readFile(resolvedSpecPath, 'utf-8');
    } catch (error) {
      spinner.stop('Failed to read spec file');
      p.outro(pc.red(`✖ Error reading spec file: ${(error as Error).message}`));
      process.exit(1);
    }

    let parsedSpec;
    try {
      parsedSpec = await parseMarkdownSpec(specContent);
    } catch (error) {
      spinner.stop('Failed to parse spec file');
      p.outro(pc.red(`✖ Error parsing spec: ${(error as Error).message}`));
      process.exit(1);
    }

    spinner.stop('Spec file parsed');

    // Validate spec
    spinner.start('Validating spec');

    const validationResult = validateSpec(parsedSpec);

    if (!validationResult.success) {
      spinner.stop('Validation failed');
      p.log.error('Spec validation errors:');
      for (const error of validationResult.errors) {
        p.log.error(`  ${pc.red('•')} ${error.path.join('.')}: ${error.message}`);
      }
      p.outro(
        pc.red(`✖ Spec validation failed with ${validationResult.errors.length} error(s)`),
      );
      p.note(
        `Run ${pc.cyan('onboardkit validate --verbose')} for detailed validation output.`,
        'Validation failed',
      );
      process.exit(1);
    }

    spinner.stop('Spec validated successfully');

    if (options.verbose) {
      p.log.success(`✓ Project: ${validationResult.data.projectName}`);
      p.log.success(`✓ Screens: ${validationResult.data.onboardingSteps.length + 3} total`);
      p.log.success(`✓ Theme: ${validationResult.data.theme.primary} primary color`);
    }

    // Render templates
    spinner.start('Generating code from templates');

    let renderResult;
    try {
      renderResult = await renderTemplates(validationResult.data);
    } catch (error) {
      spinner.stop('Code generation failed');
      p.outro(pc.red(`✖ Error generating code: ${(error as Error).message}`));
      if (options.verbose) {
        console.error(error);
      }
      process.exit(1);
    }

    spinner.stop(`Generated ${renderResult.summary.totalFiles} files`);

    // Determine output directory
    const outputDir = options.output || 'onboardkit-output';
    const resolvedOutputDir = resolve(process.cwd(), outputDir);

    logger.info(`Output directory: ${resolvedOutputDir}`);

    // Check if output directory exists and handle overwrite
    const outputExists = await fs.access(resolvedOutputDir).then(() => true).catch(() => false);
    if (outputExists && !options.overwrite && !options.dryRun) {
      const overwrite = await p.confirm({
        message: `Output directory already exists: ${pc.cyan(outputDir)}\nOverwrite?`,
        initialValue: false,
      });

      if (!overwrite || typeof overwrite === 'symbol') {
        p.outro(pc.yellow('Generation cancelled.'));
        process.exit(0);
      }
    }

    spinner.start(`Creating output directory structure`);
    logger.operationStart('Create output directory');

    // Create output directory structure using output manager
    let structure;
    try {
      structure = await ensureOutputDirectory(resolvedOutputDir, {
        overwrite: options.overwrite || options.dryRun,
        dryRun: options.dryRun,
      });
      logger.operationComplete('Create output directory');
    } catch (error) {
      if (error instanceof DirectoryExistsError && !options.overwrite) {
        spinner.stop('Directory exists');
        p.outro(pc.red(`✖ Output directory already exists. Use --overwrite flag.`));
        process.exit(1);
      }
      throw error;
    }

    spinner.stop('Output directory ready');

    // Write all generated files using atomic file writer
    if (!options.dryRun) {
      spinner.start(`Writing ${renderResult.summary.totalFiles} files`);
      logger.operationStart('Write files');

      // Convert renderResult files to Record<string, string> format
      const filesToWrite: Record<string, string> = {};
      for (const file of renderResult.files) {
        filesToWrite[file.path] = file.content;
        logger.fileWrite(file.path, Buffer.byteLength(file.content, 'utf-8'));
      }

      const writeResult = await writeFiles(filesToWrite, resolvedOutputDir, {
        dryRun: options.dryRun,
      });

      if (writeResult.failureCount > 0) {
        spinner.stop(`Failed to write ${writeResult.failureCount} files`);
        const failures = writeResult.files.filter((f) => !f.success);
        for (const failure of failures) {
          logger.error(`Failed to write ${failure.path}: ${failure.error}`);
        }
        p.outro(pc.red(`✖ Failed to write ${writeResult.failureCount} file(s)`));
        process.exit(1);
      }

      logger.operationComplete('Write files');
      spinner.stop(`Wrote ${writeResult.successCount} files successfully`);

      // Create and save metadata
      spinner.start('Creating metadata');
      logger.operationStart('Create metadata');

      const metadata = [];
      for (const file of renderResult.files) {
        const absolutePath = join(resolvedOutputDir, file.path);
        const fileMeta = createFileMetadata(absolutePath, file.content, resolvedOutputDir);
        metadata.push(fileMeta);
      }

      // Save manifest
      const manifest = createOutputManifest(resolvedOutputDir, metadata);
      const manifestPath = join(structure.metadata, FILE_NAMES.MANIFEST);
      await saveManifest(manifestPath, manifest);

      // Save summary
      const summary = createGenerationSummary(
        manifest,
        true,
        [],
        Date.now() - startTime
      );
      const summaryPath = join(structure.metadata, FILE_NAMES.SUMMARY);
      await saveSummary(summaryPath, summary);

      logger.operationComplete('Create metadata');
      spinner.stop('Metadata saved');

      // Display summary
      console.log(formatSummaryForTerminal(summary));
    } else {
      // Dry run mode
      p.note(
        `Would generate ${renderResult.summary.totalFiles} files to ${outputDir}`,
        'Dry Run'
      );
    }

    // Show next steps only if not dry run
    if (!options.dryRun) {
      p.note(
        [
          `1. Copy the generated files to your Expo project:`,
          `   ${pc.cyan(`cp -r ${outputDir}/* <your-expo-project>/src/`)}`,
          '',
          `2. Install required dependencies:`,
          `   ${pc.cyan('npm install @react-navigation/native @react-navigation/native-stack')}`,
          `   ${pc.cyan('npx expo install react-native-screens react-native-safe-area-context')}`,
          '',
          `3. Replace placeholder images in ${pc.yellow('assets/')} with your own`,
          '',
          `4. Start your Expo dev server:`,
          `   ${pc.cyan('npx expo start')}`,
        ].join('\n'),
        'Next Steps',
      );

      p.outro(pc.green('✓ Generation complete!'));
    } else {
      p.outro(
        pc.yellow('Dry run complete. ') +
          pc.dim('No files were written.\n') +
          pc.dim('Remove ') +
          pc.cyan('--dry-run') +
          pc.dim(' flag to generate files.')
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.operationError('Generate', error);
      p.log.error(`Unexpected error: ${error.message}`);
      if (options.verbose && error.stack) {
        console.error(pc.dim(error.stack));
      }
    } else {
      p.log.error('An unknown error occurred');
    }
    p.outro(pc.red('✖ Generation failed'));
    process.exit(1);
  }
}
