/**
 * Tests for progress tracking
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProgressTracker, formatDuration } from '../progress.js';
import { WorkflowPhase } from '../types.js';

// Mock clack prompts
vi.mock('@clack/prompts', () => ({
  spinner: vi.fn(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    message: vi.fn(),
  })),
  log: {
    info: vi.fn(),
  },
  intro: vi.fn(),
  outro: vi.fn(),
}));

describe('progress', () => {
  let tracker: ProgressTracker;

  beforeEach(() => {
    tracker = new ProgressTracker();
    vi.clearAllMocks();
  });

  describe('ProgressTracker', () => {
    it('should initialize with all phases', () => {
      expect(tracker).toBeTruthy();
      expect(tracker.getProgress()).toBe(0);
    });

    it('should initialize with start phase', () => {
      const tracker = new ProgressTracker(WorkflowPhase.GENERATION);

      // Phases 1-4 should be completed
      expect(tracker.getProgress()).toBeGreaterThan(0);
    });

    it('should update progress when completing phases', () => {
      tracker.startPhase(WorkflowPhase.AUTH_CHECK);
      tracker.completePhase(WorkflowPhase.AUTH_CHECK);

      expect(tracker.getProgress()).toBeGreaterThan(0);
    });

    it('should handle skipped phases', () => {
      tracker.startPhase(WorkflowPhase.REFINEMENT);
      tracker.skipPhase(WorkflowPhase.REFINEMENT, 'Not needed');

      expect(tracker.getProgress()).toBeGreaterThan(0);
    });

    it('should track all 7 phases', () => {
      for (let phase = 1; phase <= 7; phase++) {
        tracker.startPhase(phase as WorkflowPhase);
        tracker.completePhase(phase as WorkflowPhase);
      }

      expect(tracker.getProgress()).toBe(100);
    });

    it('should allow updating phase message', () => {
      tracker.startPhase(WorkflowPhase.GENERATION);
      tracker.updatePhase(WorkflowPhase.GENERATION, 'Generating screens...');

      // Should not throw
      expect(true).toBe(true);
    });

    it('should allow failing a phase', () => {
      tracker.startPhase(WorkflowPhase.SPEC_CHECK);
      tracker.failPhase(WorkflowPhase.SPEC_CHECK, 'Validation error');

      // Should not throw
      expect(true).toBe(true);
    });

    it('should allow stopping spinner', () => {
      tracker.startPhase(WorkflowPhase.AUTH_CHECK);
      tracker.stop();

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('formatDuration', () => {
    it('should format seconds', () => {
      expect(formatDuration(5000)).toBe('5s');
      expect(formatDuration(45000)).toBe('45s');
    });

    it('should format minutes and seconds', () => {
      expect(formatDuration(65000)).toBe('1m 5s');
      expect(formatDuration(125000)).toBe('2m 5s');
    });

    it('should handle zero duration', () => {
      expect(formatDuration(0)).toBe('0s');
    });

    it('should handle milliseconds under 1 second', () => {
      expect(formatDuration(500)).toBe('0s');
    });
  });
});
