/**
 * Tests for phase execution
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCheckpoint } from '../checkpoint.js';
import { WorkflowPhase } from '../types.js';
import {
  executeAuthCheck,
  executeSpecCheck,
  executeRepair,
  executeEnhancement,
  executeGeneration,
  executeRefinement,
  executeFinalize,
} from '../phases.js';

// Mock all dependencies
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
      { headline: 'Step 1', subtext: 'Test', image: 'step1.png' },
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
        { headline: 'Step 1', subtext: 'Test', image: 'step1.png' },
      ],
      softPaywall: null,
      hardPaywall: null,
      login: { methods: ['email'] },
    },
  }),
  formatValidationErrors: vi.fn().mockReturnValue('Validation errors'),
}));

vi.mock('../../spec/hash.js', () => ({
  computeSpecHash: vi.fn().mockResolvedValue('abc123'),
}));

vi.mock('../../ai/operations/repair.js', () => ({
  repairSpec: vi.fn().mockResolvedValue({
    repair: {
      repairedSpec: { projectName: 'TestApp' },
      explanation: 'Fixed issues',
      changes: [{ path: 'theme.primary', before: 'invalid', after: '#007AFF', reason: 'Fixed' }],
    },
  }),
}));

vi.mock('../../ai/operations/enhance.js', () => ({
  enhanceSpec: vi.fn().mockResolvedValue({
    enhancement: {
      enhancedSpec: { projectName: 'TestApp Enhanced' },
      explanation: 'Enhanced copy',
      enhancements: [
        { type: 'headline', path: 'step1.headline', before: 'Old', after: 'New' },
      ],
    },
  }),
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

// Mock fs for spec reading
vi.mock('node:fs', () => ({
  existsSync: vi.fn().mockReturnValue(true),
  readFile: vi.fn((path, encoding, callback) => {
    callback(null, '# Test Spec');
  }),
}));

describe('phases', () => {
  let checkpoint: any;

  beforeEach(() => {
    checkpoint = createCheckpoint(
      WorkflowPhase.AUTH_CHECK,
      'abc123',
      '/test/spec.md',
      '/test/output'
    );
    vi.clearAllMocks();
  });

  describe('executeAuthCheck', () => {
    it('should succeed with valid credentials', async () => {
      const result = await executeAuthCheck(checkpoint, {});

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should fail if no providers authenticated', async () => {
      const { listStoredProviders } = await import('../../oauth/index.js');
      vi.mocked(listStoredProviders).mockResolvedValueOnce([]);

      const result = await executeAuthCheck(checkpoint, {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('No authentication found');
    });
  });

  describe('executeSpecCheck', () => {
    it('should succeed with valid spec', async () => {
      const result = await executeSpecCheck(checkpoint, {});

      expect(result.success).toBe(true);
      expect(result.data?.hasErrors).toBe(false);
      expect(checkpoint.data.validatedSpec).toBeTruthy();
    });

    it('should fail if spec file does not exist', async () => {
      const { existsSync } = await import('node:fs');
      vi.mocked(existsSync).mockReturnValueOnce(false);

      const result = await executeSpecCheck(checkpoint, {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('Spec file not found');
    });

    it('should continue to repair if validation fails but aiRepair enabled', async () => {
      const { validateSpec } = await import('../../spec/validator.js');
      vi.mocked(validateSpec).mockReturnValueOnce({
        success: false,
        errors: [{ path: 'theme.primary', message: 'Invalid color' }],
      });

      const result = await executeSpecCheck(checkpoint, { aiRepair: true });

      expect(result.success).toBe(true);
      expect(result.data?.hasErrors).toBe(true);
    });
  });

  describe('executeRepair', () => {
    it('should skip if no validation errors', async () => {
      checkpoint.data.validationErrors = [];
      checkpoint.data.validatedSpec = { projectName: 'Test' };

      const result = await executeRepair(checkpoint, { aiRepair: true });

      expect(result.success).toBe(true);
    });

    it('should skip if aiRepair not enabled', async () => {
      checkpoint.data.validationErrors = [{ path: 'test', message: 'error' }];

      const result = await executeRepair(checkpoint, { aiRepair: false });

      expect(result.success).toBe(true);
    });

    it('should repair spec with AI', async () => {
      checkpoint.data.validationErrors = [{ path: 'test', message: 'error' }];

      const result = await executeRepair(checkpoint, { aiRepair: true });

      expect(result.success).toBe(true);
      expect(checkpoint.data.repairedSpec).toBeTruthy();
    });
  });

  describe('executeEnhancement', () => {
    it('should skip if aiEnhance not enabled', async () => {
      checkpoint.data.validatedSpec = { projectName: 'Test' };

      const result = await executeEnhancement(checkpoint, { aiEnhance: false });

      expect(result.success).toBe(true);
      expect(result.data?.spec).toBeTruthy();
    });

    it('should enhance spec with AI', async () => {
      checkpoint.data.validatedSpec = { projectName: 'Test' };

      const result = await executeEnhancement(checkpoint, { aiEnhance: true });

      expect(result.success).toBe(true);
      expect(checkpoint.data.enhancedSpec).toBeTruthy();
    });

    it('should fail if no valid spec available', async () => {
      const result = await executeEnhancement(checkpoint, { aiEnhance: true });

      expect(result.success).toBe(false);
      expect(result.error).toContain('No valid spec');
    });
  });

  describe('executeGeneration', () => {
    it('should generate files from spec', async () => {
      checkpoint.data.validatedSpec = { projectName: 'Test' };

      const result = await executeGeneration(checkpoint, {});

      expect(result.success).toBe(true);
      expect(checkpoint.data.generatedFiles).toBeTruthy();
    });

    it('should use enhanced spec if available', async () => {
      checkpoint.data.enhancedSpec = { projectName: 'Enhanced' };

      const result = await executeGeneration(checkpoint, {});

      expect(result.success).toBe(true);
    });

    it('should fail if no valid spec available', async () => {
      const result = await executeGeneration(checkpoint, {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('No valid spec');
    });
  });

  describe('executeRefinement', () => {
    it('should skip refinement phase', async () => {
      const result = await executeRefinement(checkpoint, { skipRefinement: true });

      expect(result.success).toBe(true);
    });
  });

  describe('executeFinalize', () => {
    it('should write files to disk', async () => {
      checkpoint.data.generatedFiles = {
        'theme/colors.ts': 'export const colors = {};',
      };
      checkpoint.data.validatedSpec = { projectName: 'Test' };

      const result = await executeFinalize(checkpoint, {});

      expect(result.success).toBe(true);
      expect(result.data?.fileCount).toBeGreaterThan(0);
    });

    it('should fail if no files to write', async () => {
      const result = await executeFinalize(checkpoint, {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('No files to write');
    });

    it('should handle dry run', async () => {
      checkpoint.data.generatedFiles = {
        'theme/colors.ts': 'export const colors = {};',
      };

      const result = await executeFinalize(checkpoint, { dryRun: true });

      expect(result.success).toBe(true);
    });
  });
});
