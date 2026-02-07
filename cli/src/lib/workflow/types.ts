/**
 * Workflow types and interfaces
 */

import type { OnboardingSpec, ValidationError } from '../spec/schema.js';
import type { AIRepairResult, AIEnhancementResult } from '../ai/types.js';

/**
 * Checkpoint phase numbers
 */
export enum WorkflowPhase {
  AUTH_CHECK = 1,
  SPEC_CHECK = 2,
  REPAIR = 3,
  ENHANCEMENT = 4,
  GENERATION = 5,
  REFINEMENT = 6,
  FINALIZE = 7,
}

/**
 * Checkpoint data structure
 */
export interface Checkpoint {
  phase: WorkflowPhase;
  specHash: string;
  timestamp: string;
  specPath: string;
  outputPath: string;
  data: CheckpointData;
}

/**
 * Data stored at each checkpoint
 */
export interface CheckpointData {
  validatedSpec?: OnboardingSpec;
  validationErrors?: ValidationError[];
  repairedSpec?: OnboardingSpec;
  repairResult?: AIRepairResult;
  enhancedSpec?: OnboardingSpec;
  enhancementResult?: AIEnhancementResult;
  generatedFiles?: Record<string, string>;
  metadata?: Record<string, any>;
}

/**
 * Workflow options
 */
export interface WorkflowOptions {
  spec?: string;
  output?: string;
  aiRepair?: boolean;
  aiEnhance?: boolean;
  skipRefinement?: boolean;
  verbose?: boolean;
  dryRun?: boolean;
  overwrite?: boolean;
}

/**
 * Phase execution result
 */
export interface PhaseResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  skipNextPhase?: boolean;
}

/**
 * Workflow state
 */
export interface WorkflowState {
  currentPhase: WorkflowPhase;
  checkpoint: Checkpoint | null;
  options: WorkflowOptions;
  startTime: number;
}

/**
 * Phase summary for progress display
 */
export interface PhaseSummary {
  phase: WorkflowPhase;
  name: string;
  description: string;
  completed: boolean;
  skipped: boolean;
  duration?: number;
}
