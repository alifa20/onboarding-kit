/**
 * Tests for output directory structure
 */

import { describe, it, expect } from 'vitest';
import {
  getOutputStructure,
  getAllDirectories,
  getScreenFileName,
  getComponentFileName,
  DIRECTORY_NAMES,
} from '../structure.js';

describe('Output Structure', () => {
  describe('getOutputStructure', () => {
    it('should create correct structure for given root', () => {
      const structure = getOutputStructure('/test/output');

      expect(structure.root).toBe('/test/output');
      expect(structure.screens).toBe('/test/output/screens');
      expect(structure.theme).toBe('/test/output/theme');
      expect(structure.components).toBe('/test/output/components');
      expect(structure.navigation).toBe('/test/output/navigation');
      expect(structure.metadata).toBe('/test/output/.onboardkit');
    });
  });

  describe('getAllDirectories', () => {
    it('should return all directories in structure', () => {
      const structure = getOutputStructure('/test/output');
      const dirs = getAllDirectories(structure);

      expect(dirs).toHaveLength(6);
      expect(dirs).toContain('/test/output');
      expect(dirs).toContain('/test/output/screens');
      expect(dirs).toContain('/test/output/theme');
      expect(dirs).toContain('/test/output/components');
      expect(dirs).toContain('/test/output/navigation');
      expect(dirs).toContain('/test/output/.onboardkit');
    });
  });

  describe('getScreenFileName', () => {
    it('should generate correct screen file names', () => {
      expect(getScreenFileName('welcome')).toBe('WelcomeScreen.tsx');
      expect(getScreenFileName('login')).toBe('LoginScreen.tsx');
      expect(getScreenFileName('name-capture')).toBe('NameCaptureScreen.tsx');
    });

    it('should handle indexed screens', () => {
      expect(getScreenFileName('onboarding-step', 1)).toBe('OnboardingStep1Screen.tsx');
      expect(getScreenFileName('onboarding-step', 2)).toBe('OnboardingStep2Screen.tsx');
    });
  });

  describe('getComponentFileName', () => {
    it('should generate correct component file names', () => {
      expect(getComponentFileName('button')).toBe('Button.tsx');
      expect(getComponentFileName('input')).toBe('Input.tsx');
      expect(getComponentFileName('text-input')).toBe('TextInput.tsx');
    });
  });

  describe('DIRECTORY_NAMES', () => {
    it('should have correct directory names', () => {
      expect(DIRECTORY_NAMES.SCREENS).toBe('screens');
      expect(DIRECTORY_NAMES.THEME).toBe('theme');
      expect(DIRECTORY_NAMES.COMPONENTS).toBe('components');
      expect(DIRECTORY_NAMES.NAVIGATION).toBe('navigation');
      expect(DIRECTORY_NAMES.METADATA).toBe('.onboardkit');
    });
  });
});
