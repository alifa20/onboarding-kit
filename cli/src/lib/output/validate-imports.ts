/**
 * Validation script to ensure all imports work correctly
 * This file is just for compile-time validation - not executed at runtime
 */

// Test all exports from index
import {
  // Structure
  getOutputStructure,
  getAllDirectories,
  getScreenFileName,
  getComponentFileName,
  DIRECTORY_NAMES,
  FILE_NAMES,
  type OutputStructure,

  // Manager
  createOutputDirectory,
  ensureOutputDirectory,
  validateDirectoryPermissions,
  directoryExists,
  getDirectorySize,
  DirectoryExistsError,
  DirectoryPermissionError,
  type OutputManagerOptions,
  type OutputManagerResult,

  // Writer
  writeFileAtomic,
  writeFiles,
  formatFileSize,
  validateContent,
  getFileExtension,
  isTypeScriptFile,
  isJSONFile,
  type WriteOptions,
  type WriteResult,
  type BatchWriteResult,

  // Metadata
  computeChecksum,
  determineFileType,
  createFileMetadata,
  createOutputManifest,
  saveManifest,
  getFileMetadata,
  verifyChecksum,
  groupFilesByType,
  calculateManifestStats,
  type FileMetadata,
  type OutputManifest,
  type ManifestStats,

  // Validator
  validateTypeScriptSyntax,
  validateTypeScriptCompilation,
  validateOutput,
  formatValidationErrors,
  type ValidationError,
  type ValidationResult,
  type ValidationOptions,

  // Summary
  createGenerationSummary,
  saveSummary,
  formatSummaryForTerminal,
  formatFileList,
  createQuickSummary,
  formatErrors,
  createSuccessMessage,
  type GenerationSummary,

  // Logger
  OutputLogger,
  LogLevel,
  createLogger,
  formatDuration,
  type LoggerConfig,
} from './index.js';

// Test that all types are properly exported
export type {
  OutputStructure,
  OutputManagerOptions,
  OutputManagerResult,
  WriteOptions,
  WriteResult,
  BatchWriteResult,
  FileMetadata,
  OutputManifest,
  ManifestStats,
  ValidationError,
  ValidationResult,
  ValidationOptions,
  GenerationSummary,
  LoggerConfig,
};

// Test that all functions are callable
export {
  getOutputStructure,
  getAllDirectories,
  getScreenFileName,
  getComponentFileName,
  DIRECTORY_NAMES,
  FILE_NAMES,
  createOutputDirectory,
  ensureOutputDirectory,
  validateDirectoryPermissions,
  directoryExists,
  getDirectorySize,
  DirectoryExistsError,
  DirectoryPermissionError,
  writeFileAtomic,
  writeFiles,
  formatFileSize,
  validateContent,
  getFileExtension,
  isTypeScriptFile,
  isJSONFile,
  computeChecksum,
  determineFileType,
  createFileMetadata,
  createOutputManifest,
  saveManifest,
  getFileMetadata,
  verifyChecksum,
  groupFilesByType,
  calculateManifestStats,
  validateTypeScriptSyntax,
  validateTypeScriptCompilation,
  validateOutput,
  formatValidationErrors,
  createGenerationSummary,
  saveSummary,
  formatSummaryForTerminal,
  formatFileList,
  createQuickSummary,
  formatErrors,
  createSuccessMessage,
  OutputLogger,
  LogLevel,
  createLogger,
  formatDuration,
};

console.log('✅ All output module imports validated successfully!');
