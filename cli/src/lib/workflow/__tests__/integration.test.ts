/**
 * Integration tests for the complete workflow
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  WorkflowPhase,
  createCheckpoint,
  saveCheckpoint,
  loadCheckpoint,
  executePhase,
  type WorkflowOptions,
} from '../index.js';

// Mock all external dependencies
vi.mock('../../oauth/index.js', () => ({
  listStoredProviders: vi.fn().mockResolvedValue(['anthropic']),
  getProvider: vi.fn().mockReturnValue({
    name: 'anthropic',
    displayName: 'Anthropic',
  }),
  getCredentialStatus: vi.fn().mockResolvedValue({
    isExpired: false,
    canRefresh: true,
  }),
  getValidAccessToken: vi.fn().mockResolvedValue('mock-token'),
}));

vi.mock('../../spec/parser.js', () => ({
  parseMarkdown: vi.fn().mockResolvedValue({
    projectName: 'TestApp',
    config: { platform: 'expo' },
    theme: { primary: '#007AFF' },
    onboardingSteps: [
      { headline: 'Welcome', subtext: 'Get started', image: 'welcome.png' },
    ],
    softPaywall: null,
    hardPaywall: null,
    login: { methods: ['email'] },
  }),
}));

vi.mock('../../spec/validator.js', () => ({
  validateSpec: vi.fn().mockReturnValue({
    success: true,
    data: {
      projectName: 'TestApp',
      config: { platform: 'expo' },
      theme: { primary: '#007AFF' },
      onboardingSteps: [
        { headline: 'Welcome', subtext: 'Get started', image: 'welcome.png' },
      ],
      softPaywall: null,
      hardPaywall: null,
      login: { methods: ['email'] },
    },
  }),
  formatValidationErrors: vi.fn().mockReturnValue(''),
}));

vi.mock('../../templates/renderer.js', () => ({
  renderTemplates: vi.fn().mockResolvedValue({
    files: [
      { path: 'theme/colors.ts', content: 'export const colors = {};' },
      { path: 'screens/WelcomeScreen.tsx', content: 'export const Welcome = () => {};' },
    ],
    summary: {
      totalFiles: 2,
      screens: 1,
      components: 0,
      themeFiles: 1,
      navigationFiles: 0,
    },
  }),
}));

vi.mock('../../output/manager.js', () => ({
  ensureOutputDirectory: vi.fn().mockResolvedValue({
    root: '/output',
    screens: '/output/screens',
    components: '/output/components',
    theme: '/output/theme',
    navigation: '/output/navigation',
    assets: '/output/assets',
  }),
}));

vi.mock('../../output/writer.js', () => ({
  writeFiles: vi.fn().mockResolvedValue({
    files: [
      { path: 'theme/colors.ts', size: 100, success: true },
      { path: 'screens/WelcomeScreen.tsx', size: 200, success: true },
    ],
    totalSize: 300,
    successCount: 2,
    failureCount: 0,
  }),
}));

vi.mock('../../output/metadata.js', () => ({
  createMetadata: vi.fn().mockReturnValue({
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
  }),
}));

vi.mock('node:fs', () => ({
  existsSync: vi.fn().mockReturnValue(true),
  readFile: vi.fn((path, encoding, callback) => {
    callback(null, '# Test Spec');
  }),
}));

describe('workflow integration', () => {
  let tempDir: string;
  let specPath: string;
  let outputPath: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'workflow-integration-'));
    specPath = join(tempDir, 'spec.md');
    outputPath = join(tempDir, 'output');

    await writeFile(specPath, '# Test Spec\n\n## Project Name\nTestApp', 'utf-8');

    vi.clearAllMocks();
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('should execute complete workflow without AI features', async () => {
    const options: WorkflowOptions = {
      spec: specPath,
      output: outputPath,
      aiRepair: false,
      aiEnhance: false,
      skipRefinement: true,
      verbose: false,
      dryRun: false,
      overwrite: true,
    };

    let checkpoint = createCheckpoint(
      WorkflowPhase.AUTH_CHECK,
      'abc123',
      specPath,
      outputPath
    );

    // Phase 1: Auth Check
    let result = await executePhase(WorkflowPhase.AUTH_CHECK, checkpoint, options);
    expect(result.success).toBe(true);

    // Phase 2: Spec Check
    result = await executePhase(WorkflowPhase.SPEC_CHECK, checkpoint, options);
    expect(result.success).toBe(true);
    expect(checkpoint.data.validatedSpec).toBeTruthy();

    // Phase 3: Repair (should skip)
    result = await executePhase(WorkflowPhase.REPAIR, checkpoint, options);
    expect(result.success).toBe(true);

    // Phase 4: Enhancement (should skip)
    result = await executePhase(WorkflowPhase.ENHANCEMENT, checkpoint, options);
    expect(result.success).toBe(true);

    // Phase 5: Generation
    result = await executePhase(WorkflowPhase.GENERATION, checkpoint, options);
    expect(result.success).toBe(true);
    expect(checkpoint.data.generatedFiles).toBeTruthy();

    // Phase 6: Refinement (should skip)
    result = await executePhase(WorkflowPhase.REFINEMENT, checkpoint, options);
    expect(result.success).toBe(true);

    // Phase 7: Finalize
    result = await executePhase(WorkflowPhase.FINALIZE, checkpoint, options);
    expect(result.success).toBe(true);
  });

  it('should save and load checkpoint between phases', async () => {
    const options: WorkflowOptions = {
      spec: specPath,
      output: outputPath,
    };

    let checkpoint = createCheckpoint(
      WorkflowPhase.AUTH_CHECK,
      'abc123',
      specPath,
      outputPath
    );

    // Execute first two phases
    await executePhase(WorkflowPhase.AUTH_CHECK, checkpoint, options);
    await executePhase(WorkflowPhase.SPEC_CHECK, checkpoint, options);

    // Save checkpoint
    await saveCheckpoint(checkpoint);

    // Load checkpoint
    const loaded = await loadCheckpoint(specPath);

    expect(loaded).toBeTruthy();
    expect(loaded?.phase).toBe(checkpoint.phase);
    expect(loaded?.data.validatedSpec).toBeTruthy();
  });

  it('should handle phase failure gracefully', async () => {
    const { validateSpec } = await import('../../spec/validator.js');
    vi.mocked(validateSpec).mockReturnValueOnce({
      success: false,
      errors: [{ path: 'theme.primary', message: 'Invalid color' }],
    });

    const options: WorkflowOptions = {
      spec: specPath,
      output: outputPath,
      aiRepair: false, // No repair, should fail
    };

    const checkpoint = createCheckpoint(
      WorkflowPhase.SPEC_CHECK,
      'abc123',
      specPath,
      outputPath
    );

    const result = await executePhase(WorkflowPhase.SPEC_CHECK, checkpoint, options);

    expect(result.success).toBe(false);
    expect(result.error).toContain('validation failed');
  });

  it('should execute workflow in dry-run mode', async () => {
    const options: WorkflowOptions = {
      spec: specPath,
      output: outputPath,
      dryRun: true,
    };

    let checkpoint = createCheckpoint(
      WorkflowPhase.GENERATION,
      'abc123',
      specPath,
      outputPath
    );

    // Add required data
    checkpoint.data.validatedSpec = {
      projectName: 'TestApp',
      config: { platform: 'expo' },
      theme: { primary: '#007AFF' },
      onboardingSteps: [],
      softPaywall: null,
      hardPaywall: null,
      login: { methods: ['email'] },
    } as any;

    // Execute generation
    let result = await executePhase(WorkflowPhase.GENERATION, checkpoint, options);
    expect(result.success).toBe(true);

    // Execute finalize
    result = await executePhase(WorkflowPhase.FINALIZE, checkpoint, options);
    expect(result.success).toBe(true);

    // Verify dry-run was passed to writers
    const { writeFiles } = await import('../../output/writer.js');
    expect(writeFiles).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ dryRun: true })
    );
  });

  it('should preserve checkpoint data across phases', async () => {
    const options: WorkflowOptions = {
      spec: specPath,
      output: outputPath,
    };

    const checkpoint = createCheckpoint(
      WorkflowPhase.AUTH_CHECK,
      'abc123',
      specPath,
      outputPath
    );

    // Execute phases sequentially
    await executePhase(WorkflowPhase.AUTH_CHECK, checkpoint, options);
    await executePhase(WorkflowPhase.SPEC_CHECK, checkpoint, options);

    const specAfterPhase2 = checkpoint.data.validatedSpec;

    await executePhase(WorkflowPhase.REPAIR, checkpoint, options);
    await executePhase(WorkflowPhase.ENHANCEMENT, checkpoint, options);

    // Validated spec should still be there
    expect(checkpoint.data.validatedSpec).toBe(specAfterPhase2);

    await executePhase(WorkflowPhase.GENERATION, checkpoint, options);

    // All previous data should still be there
    expect(checkpoint.data.validatedSpec).toBe(specAfterPhase2);
    expect(checkpoint.data.generatedFiles).toBeTruthy();
  });
});
