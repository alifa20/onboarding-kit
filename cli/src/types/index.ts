/**
 * Core types for OnboardKit CLI
 */

export interface CLIOptions {
  verbose?: boolean;
  output?: string;
}

export interface ProviderConfig {
  name: string;
  enabled: boolean;
  credentials?: Record<string, unknown>;
}

export interface CheckpointData {
  phase: number;
  specHash: string;
  timestamp: string;
  data: Record<string, unknown>;
}
