/**
 * Validation of generated code (TypeScript compilation, syntax checking)
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFile, unlink, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomBytes } from 'node:crypto';

const execAsync = promisify(exec);

/**
 * Validation error
 */
export interface ValidationError {
  file: string;
  line?: number;
  column?: number;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Validation result
 */
export interface ValidationResult {
  success: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  duration: number;
}

/**
 * Validation options
 */
export interface ValidationOptions {
  skipTypeCheck?: boolean;
  skipSyntaxCheck?: boolean;
  timeout?: number;
}

/**
 * Validate TypeScript syntax (basic check without full compilation)
 */
export function validateTypeScriptSyntax(content: string, filePath: string): ValidationError[] {
  const errors: ValidationError[] = [];

  // Basic syntax checks
  const checks = [
    {
      pattern: /import\s+.*\s+from\s+['"][^'"]*['"]/g,
      validate: (match: string) => {
        // Check for valid import syntax
        return /^import\s+(?:\*\s+as\s+\w+|\{[^}]+\}|\w+)\s+from\s+['"][^'"]+['"]$/.test(
          match.trim()
        );
      },
      message: 'Invalid import syntax',
    },
    {
      pattern: /export\s+(default\s+)?(function|class|const|interface|type)\s+\w+/g,
      validate: (match: string) => {
        return /^export\s+(default\s+)?(function|class|const|interface|type)\s+\w+/.test(
          match.trim()
        );
      },
      message: 'Invalid export syntax',
    },
  ];

  for (const check of checks) {
    const matches = content.match(check.pattern);
    if (matches) {
      for (const match of matches) {
        if (!check.validate(match)) {
          errors.push({
            file: filePath,
            message: check.message,
            severity: 'error',
          });
        }
      }
    }
  }

  // Check for common React Native imports
  if (content.includes('from \'react-native\'') || content.includes('from "react-native"')) {
    // Validate that React Native components are properly imported
    const rnImportMatch = content.match(/import\s+\{([^}]+)\}\s+from\s+['"]react-native['"]/);
    if (rnImportMatch) {
      const imports = rnImportMatch[1].split(',').map((s) => s.trim());
      const validRNComponents = [
        'View',
        'Text',
        'StyleSheet',
        'TouchableOpacity',
        'ScrollView',
        'Image',
        'TextInput',
        'SafeAreaView',
        'StatusBar',
        'Pressable',
        'Button',
      ];

      for (const imp of imports) {
        const componentName = imp.replace(/\s+as\s+\w+/, '').trim();
        if (
          componentName &&
          !validRNComponents.includes(componentName) &&
          componentName !== 'Platform'
        ) {
          errors.push({
            file: filePath,
            message: `Potentially invalid React Native import: ${componentName}`,
            severity: 'warning',
          });
        }
      }
    }
  }

  // Check for balanced braces
  const openBraces = (content.match(/\{/g) || []).length;
  const closeBraces = (content.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) {
    errors.push({
      file: filePath,
      message: `Unbalanced braces: ${openBraces} opening, ${closeBraces} closing`,
      severity: 'error',
    });
  }

  // Check for balanced parentheses
  const openParens = (content.match(/\(/g) || []).length;
  const closeParens = (content.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    errors.push({
      file: filePath,
      message: `Unbalanced parentheses: ${openParens} opening, ${closeParens} closing`,
      severity: 'error',
    });
  }

  return errors;
}

/**
 * Validate TypeScript compilation using tsc
 */
export async function validateTypeScriptCompilation(
  files: Record<string, string>,
  options: ValidationOptions = {}
): Promise<ValidationResult> {
  const { skipTypeCheck = false, timeout = 30000 } = options;
  const startTime = Date.now();

  if (skipTypeCheck) {
    return {
      success: true,
      errors: [],
      warnings: [],
      duration: Date.now() - startTime,
    };
  }

  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Create temp directory for validation
  const tempDir = join(tmpdir(), `onboardkit-validate-${randomBytes(6).toString('hex')}`);

  try {
    await mkdir(tempDir, { recursive: true });

    // Write tsconfig.json
    const tsconfig = {
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'bundler',
        lib: ['ES2022'],
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        jsx: 'react-native',
        noEmit: true,
        types: ['react', 'react-native'],
      },
      include: ['**/*.ts', '**/*.tsx'],
    };

    await writeFile(join(tempDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));

    // Write all TypeScript files
    for (const [filePath, content] of Object.entries(files)) {
      if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
        await writeFile(join(tempDir, filePath), content);
      }
    }

    // Run TypeScript compiler
    try {
      await execAsync(`npx tsc --noEmit`, {
        cwd: tempDir,
        timeout,
      });
    } catch (error) {
      // Parse TypeScript compiler errors
      if (error instanceof Error && 'stdout' in error) {
        const output = (error as { stdout: string }).stdout;
        const errorLines = output.split('\n');

        for (const line of errorLines) {
          const match = line.match(/^(.+)\((\d+),(\d+)\):\s+(error|warning)\s+TS\d+:\s+(.+)$/);
          if (match) {
            const [, file, lineNum, colNum, severity, message] = match;
            const err: ValidationError = {
              file,
              line: parseInt(lineNum, 10),
              column: parseInt(colNum, 10),
              message,
              severity: severity as 'error' | 'warning',
            };

            if (severity === 'error') {
              errors.push(err);
            } else {
              warnings.push(err);
            }
          }
        }
      }
    }
  } finally {
    // Clean up temp directory
    try {
      const filesToDelete = Object.keys(files);
      for (const file of filesToDelete) {
        try {
          await unlink(join(tempDir, file));
        } catch {
          // Ignore
        }
      }
      await unlink(join(tempDir, 'tsconfig.json')).catch(() => {});
    } catch {
      // Ignore cleanup errors
    }
  }

  return {
    success: errors.length === 0,
    errors,
    warnings,
    duration: Date.now() - startTime,
  };
}

/**
 * Validate all generated files
 */
export async function validateOutput(
  files: Record<string, string>,
  options: ValidationOptions = {}
): Promise<ValidationResult> {
  const { skipSyntaxCheck = false } = options;
  const startTime = Date.now();

  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Run syntax validation on each file
  if (!skipSyntaxCheck) {
    for (const [filePath, content] of Object.entries(files)) {
      if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
        const fileErrors = validateTypeScriptSyntax(content, filePath);
        for (const error of fileErrors) {
          if (error.severity === 'error') {
            errors.push(error);
          } else {
            warnings.push(error);
          }
        }
      }
    }
  }

  // If syntax validation failed, skip compilation check
  if (errors.length > 0) {
    return {
      success: false,
      errors,
      warnings,
      duration: Date.now() - startTime,
    };
  }

  // Run TypeScript compilation check
  const compilationResult = await validateTypeScriptCompilation(files, options);

  return {
    success: compilationResult.success && errors.length === 0,
    errors: [...errors, ...compilationResult.errors],
    warnings: [...warnings, ...compilationResult.warnings],
    duration: Date.now() - startTime,
  };
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(result: ValidationResult): string {
  const lines: string[] = [];

  if (result.errors.length > 0) {
    lines.push('Errors:');
    for (const error of result.errors) {
      const location = error.line ? `:${error.line}:${error.column}` : '';
      lines.push(`  ${error.file}${location} - ${error.message}`);
    }
  }

  if (result.warnings.length > 0) {
    lines.push('Warnings:');
    for (const warning of result.warnings) {
      const location = warning.line ? `:${warning.line}:${warning.column}` : '';
      lines.push(`  ${warning.file}${location} - ${warning.message}`);
    }
  }

  if (lines.length === 0) {
    lines.push('All validations passed!');
  }

  return lines.join('\n');
}
