/**
 * Workflow system public API
 */

// Types
export type {
  Checkpoint,
  CheckpointData,
  WorkflowOptions,
  WorkflowPhase,
  WorkflowState,
  PhaseResult,
  PhaseSummary,
} from './types.js';

export { WorkflowPhase } from './types.js';

// Checkpoint management
export {
  saveCheckpoint,
  loadCheckpoint,
  clearCheckpoint,
  hasCheckpoint,
  createCheckpoint,
  updateCheckpoint,
  isCheckpointValid,
  getCheckpointAge,
  formatCheckpointAge,
  getCheckpointPath,
} from './checkpoint.js';

// Phase execution
export {
  executePhase,
  executeAuthCheck,
  executeSpecCheck,
  executeRepair,
  executeEnhancement,
  executeGeneration,
  executeRefinement,
  executeFinalize,
} from './phases.js';

// Resume logic
export {
  checkResume,
  validateCheckpointData,
  showResumeInfo,
  type ResumeDecision,
} from './resume.js';

// Progress tracking
export {
  ProgressTracker,
  showWorkflowBanner,
  showWorkflowComplete,
  showWorkflowError,
  formatDuration,
} from './progress.js';
