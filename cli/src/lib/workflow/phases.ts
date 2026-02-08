/**
 * Implementation of all 7 workflow phases
 */

import { readFile, existsSync } from 'node:fs';
import { join } from 'node:path';
import * as clack from '@clack/prompts';
import pc from 'picocolors';
import {
  getValidAccessToken,
  listStoredProviders,
  getCredentialStatus,
  getProvider,
} from '../oauth/index.js';
import { parseMarkdown } from '../spec/parser.js';
import { validateSpec, formatValidationErrors } from '../spec/validator.js';
import { computeSpecHash } from '../spec/hash.js';
import { repairSpec } from '../ai/operations/repair.js';
import { enhanceSpec } from '../ai/operations/enhance.js';
import { renderTemplates } from '../templates/renderer.js';
import { ensureOutputDirectory } from '../output/manager.js';
import { writeFiles } from '../output/writer.js';
import { createFileMetadata, createOutputManifest } from '../output/metadata.js';
import { formatGenerationSummary } from '../output/summary.js';
import type {
  Checkpoint,
  WorkflowOptions,
  PhaseResult,
  WorkflowPhase,
} from './types.js';
import type { OnboardingSpec } from '../spec/schema.js';

/**
 * Phase 1: Auth Check
 * Verify OAuth credentials exist and are valid
 */
export async function executeAuthCheck(
  checkpoint: Checkpoint,
  options: WorkflowOptions
): Promise<PhaseResult<void>> {
  try {
    // Check if any providers are authenticated
    const storedProviders = await listStoredProviders();

    if (storedProviders.length === 0) {
      return {
        success: false,
        error: 'No authentication found. Run "onboardkit auth" first.',
      };
    }

    // Get the first provider (for now we only support one)
    const providerName = storedProviders[0];
    const provider = getProvider(providerName);

    if (!provider) {
      return {
        success: false,
        error: `Provider not found: ${providerName}`,
      };
    }

    // Check credential status
    const status = await getCredentialStatus(provider);

    if (status.isExpired && !status.canRefresh) {
      return {
        success: false,
        error: 'Authentication expired. Please re-authenticate with "onboardkit auth".',
      };
    }

    // Try to get a valid access token (will refresh if needed)
    try {
      await getValidAccessToken(provider);
    } catch (error) {
      return {
        success: false,
        error: `Failed to get valid access token: ${error}`,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown auth error',
    };
  }
}

/**
 * Phase 2: Spec Check
 * Load and validate the specification file
 */
export async function executeSpecCheck(
  checkpoint: Checkpoint,
  options: WorkflowOptions
): Promise<PhaseResult<{ spec?: OnboardingSpec; hasErrors: boolean }>> {
  try {
    const specPath = checkpoint.specPath;

    // Check if spec file exists
    if (!existsSync(specPath)) {
      return {
        success: false,
        error: `Spec file not found: ${specPath}`,
      };
    }

    // Read spec file
    const content = await new Promise<string>((resolve, reject) => {
      readFile(specPath, 'utf-8', (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });

    // Parse markdown
    const parsed = await parseMarkdown(content);

    // Validate against schema
    const result = validateSpec(parsed);

    if (result.success) {
      // Save validated spec to checkpoint
      checkpoint.data.validatedSpec = result.data;
      return {
        success: true,
        data: { spec: result.data, hasErrors: false },
      };
    } else {
      // Save validation errors to checkpoint
      checkpoint.data.validationErrors = result.errors;

      if (options.aiRepair) {
        // Continue to repair phase
        return {
          success: true,
          data: { hasErrors: true },
        };
      } else {
        // Validation failed and no repair requested
        const errorMsg = formatValidationErrors(result.errors);
        return {
          success: false,
          error: `Spec validation failed:\n${errorMsg}\n\nUse --ai-repair to fix automatically.`,
        };
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown spec error',
    };
  }
}

/**
 * Phase 3: Repair (AI)
 * Use AI to fix validation errors
 */
export async function executeRepair(
  checkpoint: Checkpoint,
  options: WorkflowOptions
): Promise<PhaseResult<{ spec: OnboardingSpec }>> {
  try {
    // Skip if no validation errors
    if (!checkpoint.data.validationErrors || checkpoint.data.validationErrors.length === 0) {
      return {
        success: true,
        skipNextPhase: false,
        data: { spec: checkpoint.data.validatedSpec! },
      };
    }

    // Skip if repair not requested
    if (!options.aiRepair) {
      return {
        success: true,
        skipNextPhase: false,
      };
    }

    // Read the spec file to get invalid content
    const content = await new Promise<string>((resolve, reject) => {
      readFile(checkpoint.specPath, 'utf-8', (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });

    const parsed = await parseMarkdown(content);

    // Call AI repair
    const repairResult = await repairSpec(parsed, checkpoint.data.validationErrors);

    // Save repaired spec
    checkpoint.data.repairedSpec = repairResult.repair.repairedSpec;
    checkpoint.data.repairResult = repairResult.repair;
    checkpoint.data.validatedSpec = repairResult.repair.repairedSpec;

    return {
      success: true,
      data: { spec: repairResult.repair.repairedSpec },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown repair error',
    };
  }
}

/**
 * Phase 4: Enhancement (AI)
 * Improve copy with AI
 */
export async function executeEnhancement(
  checkpoint: Checkpoint,
  options: WorkflowOptions
): Promise<PhaseResult<{ spec: OnboardingSpec }>> {
  try {
    // Skip if enhancement not requested
    if (!options.aiEnhance) {
      return {
        success: true,
        skipNextPhase: false,
        data: { spec: checkpoint.data.validatedSpec! },
      };
    }

    // Get the spec to enhance (either repaired or validated)
    const specToEnhance = checkpoint.data.repairedSpec || checkpoint.data.validatedSpec;

    if (!specToEnhance) {
      return {
        success: false,
        error: 'No valid spec available for enhancement',
      };
    }

    // Call AI enhancement
    const enhanceResult = await enhanceSpec(specToEnhance);

    // Save enhanced spec
    checkpoint.data.enhancedSpec = enhanceResult.enhancement.enhancedSpec;
    checkpoint.data.enhancementResult = enhanceResult.enhancement;

    return {
      success: true,
      data: { spec: enhanceResult.enhancement.enhancedSpec },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown enhancement error',
    };
  }
}

/**
 * Phase 5: Generation
 * Generate screens and components from spec
 */
export async function executeGeneration(
  checkpoint: Checkpoint,
  options: WorkflowOptions
): Promise<PhaseResult<{ files: Record<string, string> }>> {
  try {
    // Get the final spec (enhanced > repaired > validated)
    const finalSpec =
      checkpoint.data.enhancedSpec ||
      checkpoint.data.repairedSpec ||
      checkpoint.data.validatedSpec;

    if (!finalSpec) {
      return {
        success: false,
        error: 'No valid spec available for generation',
      };
    }

    // Render templates
    const renderResult = await renderTemplates(finalSpec);

    // Convert GeneratedFile[] to Record<string, string>
    const files: Record<string, string> = {};
    for (const file of renderResult.files) {
      files[file.path] = file.content;
    }

    // Save generated files to checkpoint
    checkpoint.data.generatedFiles = files;

    return {
      success: true,
      data: { files },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown generation error',
    };
  }
}

/**
 * Phase 6: Refinement (AI - Optional)
 * Optional AI chat for tweaks
 */
export async function executeRefinement(
  checkpoint: Checkpoint,
  options: WorkflowOptions
): Promise<PhaseResult<void>> {
  // Skip refinement phase for now (can be implemented later)
  // This would involve interactive chat with AI to refine specific screens

  if (options.skipRefinement) {
    return {
      success: true,
      skipNextPhase: false,
    };
  }

  // For MVP, we'll skip this phase
  return {
    success: true,
    skipNextPhase: false,
  };
}

/**
 * Phase 7: Finalize
 * Write all files to disk atomically
 */
export async function executeFinalize(
  checkpoint: Checkpoint,
  options: WorkflowOptions
): Promise<PhaseResult<{ fileCount: number; totalSize: number }>> {
  try {
    const files = checkpoint.data.generatedFiles;

    if (!files || Object.keys(files).length === 0) {
      return {
        success: false,
        error: 'No files to write',
      };
    }

    // Ensure output directory exists
    await ensureOutputDirectory(checkpoint.outputPath, {
      overwrite: options.overwrite,
      dryRun: options.dryRun,
    });

    // Write files
    const writeResult = await writeFiles(files, checkpoint.outputPath, {
      dryRun: options.dryRun,
    });

    if (writeResult.failureCount > 0) {
      const errors = writeResult.files
        .filter((f) => !f.success)
        .map((f) => `  ${f.path}: ${f.error}`)
        .join('\n');

      return {
        success: false,
        error: `Failed to write ${writeResult.failureCount} file(s):\n${errors}`,
      };
    }

    // Get final spec for metadata
    const finalSpec =
      checkpoint.data.enhancedSpec ||
      checkpoint.data.repairedSpec ||
      checkpoint.data.validatedSpec;

    if (finalSpec) {
      // Create metadata
      const metadata = {
        spec: finalSpec,
        specPath: checkpoint.specPath,
        outputPath: checkpoint.outputPath,
        specHash: checkpoint.specHash,
        timestamp: checkpoint.timestamp,
        generated: new Date().toISOString(),
      };

      // Write metadata file
      const metadataPath = join(checkpoint.outputPath, '.onboardkit-metadata.json');
      if (!options.dryRun) {
        await new Promise<void>((resolve, reject) => {
          import('node:fs').then(({ writeFile }) => {
            writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8', (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        });
      }
    }

    return {
      success: true,
      data: {
        fileCount: writeResult.successCount,
        totalSize: writeResult.totalSize,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown finalize error',
    };
  }
}

/**
 * Execute a specific phase
 */
export async function executePhase(
  phase: WorkflowPhase,
  checkpoint: Checkpoint,
  options: WorkflowOptions
): Promise<PhaseResult> {
  switch (phase) {
    case 1:
      return executeAuthCheck(checkpoint, options);
    case 2:
      return executeSpecCheck(checkpoint, options);
    case 3:
      return executeRepair(checkpoint, options);
    case 4:
      return executeEnhancement(checkpoint, options);
    case 5:
      return executeGeneration(checkpoint, options);
    case 6:
      return executeRefinement(checkpoint, options);
    case 7:
      return executeFinalize(checkpoint, options);
    default:
      return {
        success: false,
        error: `Invalid phase: ${phase}`,
      };
  }
}
