import { intro, outro, spinner, log } from '@clack/prompts';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import pc from 'picocolors';
import { parseMarkdown } from '../lib/spec/parser.js';
import { validateSpec, formatValidationErrors, getSpecFeatures } from '../lib/spec/validator.js';
import { computeSpecHash } from '../lib/spec/hash.js';
import { FileSystemError, ValidationError, ErrorCode, withFileSystemErrors } from '../lib/errors/index.js';

/**
 * Validate command options
 */
interface ValidateOptions {
  spec?: string;
  verbose?: boolean;
}

/**
 * Validate command: Parse and validate a spec file
 */
export async function validateCommand(options: ValidateOptions = {}): Promise<void> {
  intro(pc.bgBlue(pc.black(' OnboardKit Validate ')));

  // Determine spec file path
  const specPath = options.spec ? join(process.cwd(), options.spec) : join(process.cwd(), 'spec.md');

  // Check if spec file exists
  if (!existsSync(specPath)) {
    throw new FileSystemError('Spec file not found', specPath, {
      code: ErrorCode.SPEC_NOT_FOUND,
    });
  }

  const s = spinner();
  s.start('Parsing spec file...');

  try {
    // Read spec file with error handling
    const content = await withFileSystemErrors(
      async () => readFile(specPath, 'utf-8'),
      specPath
    );

    // Parse markdown
    const parsed = await parseMarkdown(content);

    if (options.verbose) {
      s.stop('Parsed spec data:');
      console.log(JSON.stringify(parsed, null, 2));
      s.start('Validating spec...');
    } else {
      s.message('Validating spec...');
    }

    // Validate against schema
    const result = validateSpec(parsed);

    if (!result.success) {
      s.stop(pc.red('✗ Validation failed'));
      console.log('\n' + formatValidationErrors(result.errors));
      throw new ValidationError('Spec validation failed', {
        code: ErrorCode.SPEC_VALIDATION_ERROR,
        contextData: {
          errorCount: result.errors.length,
          errors: result.errors,
        },
      });
    }

    // Compute hash
    const hash = await computeSpecHash(specPath);

    s.stop(pc.green('✓ Spec is valid!'));

    // Display spec summary
    const features = getSpecFeatures(result.data);
    const summary = [
      '',
      pc.bold('Spec Summary:'),
      pc.dim('─'.repeat(50)),
      `  ${pc.cyan('Project:')} ${result.data.projectName}`,
      `  ${pc.cyan('Platform:')} ${result.data.config.platform}`,
      `  ${pc.cyan('Primary Color:')} ${result.data.theme.primary}`,
      `  ${pc.cyan('Onboarding Steps:')} ${features.stepCount}`,
      `  ${pc.cyan('Soft Paywall:')} ${features.hasSoftPaywall ? '✓' : '✗'}`,
      `  ${pc.cyan('Hard Paywall:')} ${features.hasHardPaywall ? '✓' : '✗'}`,
      `  ${pc.cyan('Login Methods:')} ${result.data.login.methods.join(', ')}`,
      pc.dim('─'.repeat(50)),
      `  ${pc.dim('Spec Hash:')} ${pc.dim(hash.substring(0, 16))}...`,
      '',
    ];

    console.log(summary.join('\n'));

    outro(
      pc.green('Ready to generate! ') +
        pc.dim('Run ') +
        pc.cyan('onboardkit generate') +
        pc.dim(' to create your screens.')
    );

    process.exit(0);
  } catch (error) {
    s.stop(pc.red('✗ Error'));

    if (error instanceof Error) {
      log.error(pc.red(error.message));

      if (options.verbose && error.stack) {
        console.log('\n' + pc.dim(error.stack));
      }
    } else {
      log.error(pc.red('An unknown error occurred'));
    }

    process.exit(1);
  }
}
