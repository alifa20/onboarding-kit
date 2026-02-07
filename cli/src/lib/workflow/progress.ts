/**
 * Progress tracking and display for workflow
 */

import * as clack from '@clack/prompts';
import pc from 'picocolors';
import type { WorkflowPhase, PhaseSummary } from './types.js';

/**
 * Phase metadata
 */
const PHASE_INFO: Record<WorkflowPhase, { name: string; description: string }> = {
  1: {
    name: 'Auth Check',
    description: 'Verifying OAuth credentials',
  },
  2: {
    name: 'Spec Check',
    description: 'Validating specification',
  },
  3: {
    name: 'Repair',
    description: 'Fixing validation errors',
  },
  4: {
    name: 'Enhancement',
    description: 'Improving copy with AI',
  },
  5: {
    name: 'Generation',
    description: 'Generating screens and components',
  },
  6: {
    name: 'Refinement',
    description: 'Optional AI refinement',
  },
  7: {
    name: 'Finalize',
    description: 'Writing files to disk',
  },
};

/**
 * Progress tracker
 */
export class ProgressTracker {
  private phases: Map<WorkflowPhase, PhaseSummary> = new Map();
  private currentSpinner: ReturnType<typeof clack.spinner> | null = null;
  private startTime: number;

  constructor(startPhase: WorkflowPhase = 1) {
    this.startTime = Date.now();
    this.initializePhases(startPhase);
  }

  /**
   * Initialize phase summaries
   */
  private initializePhases(startPhase: WorkflowPhase): void {
    for (let phase = 1; phase <= 7; phase++) {
      const info = PHASE_INFO[phase as WorkflowPhase];
      this.phases.set(phase as WorkflowPhase, {
        phase: phase as WorkflowPhase,
        name: info.name,
        description: info.description,
        completed: phase < startPhase,
        skipped: false,
      });
    }
  }

  /**
   * Start a phase
   */
  startPhase(phase: WorkflowPhase): void {
    const summary = this.phases.get(phase);
    if (!summary) return;

    // Stop previous spinner if any
    if (this.currentSpinner) {
      this.currentSpinner.stop();
    }

    // Start new spinner
    this.currentSpinner = clack.spinner();
    this.currentSpinner.start(
      `${pc.cyan(`[${phase}/7]`)} ${summary.name} - ${summary.description}`
    );
  }

  /**
   * Update phase message
   */
  updatePhase(phase: WorkflowPhase, message: string): void {
    const summary = this.phases.get(phase);
    if (!summary || !this.currentSpinner) return;

    this.currentSpinner.message(
      `${pc.cyan(`[${phase}/7]`)} ${summary.name} - ${message}`
    );
  }

  /**
   * Complete a phase
   */
  completePhase(phase: WorkflowPhase, message?: string): void {
    const summary = this.phases.get(phase);
    if (!summary) return;

    const duration = Date.now() - this.startTime;
    summary.completed = true;
    summary.duration = duration;

    if (this.currentSpinner) {
      this.currentSpinner.stop(
        pc.green('✓') + ` ${summary.name}${message ? ` - ${message}` : ''}`
      );
      this.currentSpinner = null;
    }
  }

  /**
   * Skip a phase
   */
  skipPhase(phase: WorkflowPhase, reason: string): void {
    const summary = this.phases.get(phase);
    if (!summary) return;

    summary.skipped = true;
    summary.completed = true;

    if (this.currentSpinner) {
      this.currentSpinner.stop(pc.dim('○') + ` ${summary.name} - ${pc.dim(reason)}`);
      this.currentSpinner = null;
    }
  }

  /**
   * Fail a phase
   */
  failPhase(phase: WorkflowPhase, error: string): void {
    const summary = this.phases.get(phase);
    if (!summary) return;

    if (this.currentSpinner) {
      this.currentSpinner.stop(pc.red('✗') + ` ${summary.name} - ${error}`);
      this.currentSpinner = null;
    }
  }

  /**
   * Get completion percentage
   */
  getProgress(): number {
    const completed = Array.from(this.phases.values()).filter((p) => p.completed).length;
    return Math.floor((completed / 7) * 100);
  }

  /**
   * Show progress summary
   */
  showSummary(): void {
    const summaries = Array.from(this.phases.values());
    const completed = summaries.filter((p) => p.completed && !p.skipped).length;
    const skipped = summaries.filter((p) => p.skipped).length;

    const lines: string[] = [];
    lines.push('');
    lines.push(pc.bold('Workflow Summary:'));
    lines.push(pc.dim('─'.repeat(50)));

    for (const summary of summaries) {
      let icon = pc.dim('○');
      if (summary.completed && !summary.skipped) {
        icon = pc.green('✓');
      } else if (summary.skipped) {
        icon = pc.dim('○');
      }

      const status = summary.skipped ? pc.dim('(skipped)') : '';
      lines.push(`  ${icon} ${summary.name} ${status}`);
    }

    lines.push(pc.dim('─'.repeat(50)));
    lines.push(
      `  ${pc.cyan('Completed:')} ${completed}/7  ${pc.dim(`(${skipped} skipped)`)}`
    );
    lines.push('');

    console.log(lines.join('\n'));
  }

  /**
   * Show resuming message
   */
  showResuming(phase: WorkflowPhase, age: string): void {
    clack.log.info(
      `${pc.yellow('⚡')} Resuming from phase ${phase} ${pc.dim(`(saved ${age})`)}`
    );
  }

  /**
   * Stop any active spinner
   */
  stop(message?: string): void {
    if (this.currentSpinner) {
      if (message) {
        this.currentSpinner.stop(message);
      } else {
        this.currentSpinner.stop();
      }
      this.currentSpinner = null;
    }
  }
}

/**
 * Show workflow banner
 */
export function showWorkflowBanner(): void {
  clack.intro(pc.bgMagenta(pc.black(' OnboardKit AI Workflow ')));
}

/**
 * Show workflow completion
 */
export function showWorkflowComplete(): void {
  clack.outro(pc.green('✓ Workflow complete!'));
}

/**
 * Show workflow error
 */
export function showWorkflowError(error: string): void {
  clack.outro(pc.red(`✗ Workflow failed: ${error}`));
}

/**
 * Format duration in milliseconds to human readable
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);

  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${seconds}s`;
  }
}
