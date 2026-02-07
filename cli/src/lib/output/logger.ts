/**
 * Detailed logging for verbose mode
 */

import pc from 'picocolors';

/**
 * Log level enumeration
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  verbose: boolean;
  minLevel: LogLevel;
  timestamps: boolean;
}

/**
 * Output logger for verbose mode
 */
export class OutputLogger {
  private config: LoggerConfig;
  private startTime: number;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      verbose: config.verbose ?? false,
      minLevel: config.minLevel ?? LogLevel.INFO,
      timestamps: config.timestamps ?? true,
    };
    this.startTime = Date.now();
  }

  /**
   * Get timestamp string
   */
  private getTimestamp(): string {
    if (!this.config.timestamps) {
      return '';
    }

    const elapsed = Date.now() - this.startTime;
    const seconds = (elapsed / 1000).toFixed(3);
    return pc.dim(`[${seconds}s]`);
  }

  /**
   * Log debug message
   */
  debug(message: string, ...args: unknown[]): void {
    if (!this.config.verbose || this.config.minLevel > LogLevel.DEBUG) {
      return;
    }

    console.log(`${this.getTimestamp()} ${pc.dim('DEBUG')} ${message}`, ...args);
  }

  /**
   * Log info message
   */
  info(message: string, ...args: unknown[]): void {
    if (this.config.minLevel > LogLevel.INFO) {
      return;
    }

    console.log(`${this.getTimestamp()} ${pc.cyan('INFO')}  ${message}`, ...args);
  }

  /**
   * Log warning message
   */
  warn(message: string, ...args: unknown[]): void {
    if (this.config.minLevel > LogLevel.WARN) {
      return;
    }

    console.warn(`${this.getTimestamp()} ${pc.yellow('WARN')}  ${message}`, ...args);
  }

  /**
   * Log error message
   */
  error(message: string, ...args: unknown[]): void {
    console.error(`${this.getTimestamp()} ${pc.red('ERROR')} ${message}`, ...args);
  }

  /**
   * Log file write operation
   */
  fileWrite(filePath: string, size: number): void {
    if (!this.config.verbose) {
      return;
    }

    const sizeKB = (size / 1024).toFixed(2);
    this.debug(`Writing file: ${pc.cyan(filePath)} ${pc.dim(`(${sizeKB} KB)`)}`);
  }

  /**
   * Log directory creation
   */
  directoryCreate(dirPath: string): void {
    if (!this.config.verbose) {
      return;
    }

    this.debug(`Creating directory: ${pc.cyan(dirPath)}`);
  }

  /**
   * Log permission change
   */
  permissionChange(filePath: string, mode: number): void {
    if (!this.config.verbose) {
      return;
    }

    const modeStr = mode.toString(8);
    this.debug(`Setting permissions: ${pc.cyan(filePath)} ${pc.dim(`(${modeStr})`)}`);
  }

  /**
   * Log validation step
   */
  validation(message: string, success: boolean): void {
    if (!this.config.verbose) {
      return;
    }

    const status = success ? pc.green('✓') : pc.red('✗');
    this.debug(`${status} ${message}`);
  }

  /**
   * Log operation start
   */
  operationStart(operation: string): void {
    if (!this.config.verbose) {
      return;
    }

    this.info(`${pc.bold('Starting:')} ${operation}`);
  }

  /**
   * Log operation complete
   */
  operationComplete(operation: string, duration?: number): void {
    if (!this.config.verbose) {
      return;
    }

    const durationStr = duration ? pc.dim(` (${(duration / 1000).toFixed(2)}s)`) : '';
    this.info(`${pc.green('✓')} ${pc.bold('Completed:')} ${operation}${durationStr}`);
  }

  /**
   * Log operation error
   */
  operationError(operation: string, error: Error): void {
    this.error(`${pc.red('✗')} ${pc.bold('Failed:')} ${operation}`);
    this.error(`  ${error.message}`);

    if (this.config.verbose && error.stack) {
      console.error(pc.dim(error.stack));
    }
  }

  /**
   * Log JSON data (formatted)
   */
  json(label: string, data: unknown): void {
    if (!this.config.verbose) {
      return;
    }

    this.debug(`${label}:`);
    console.log(pc.dim(JSON.stringify(data, null, 2)));
  }

  /**
   * Create a child logger with additional context
   */
  child(context: string): OutputLogger {
    const logger = new OutputLogger(this.config);
    logger.startTime = this.startTime;
    return logger;
  }

  /**
   * Reset start time
   */
  resetTimer(): void {
    this.startTime = Date.now();
  }

  /**
   * Get elapsed time
   */
  getElapsed(): number {
    return Date.now() - this.startTime;
  }
}

/**
 * Create a logger instance
 */
export function createLogger(verbose: boolean = false): OutputLogger {
  return new OutputLogger({ verbose, timestamps: true });
}

/**
 * Format duration in milliseconds to human-readable string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }

  const seconds = ms / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(2)}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
}
