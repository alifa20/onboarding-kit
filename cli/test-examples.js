#!/usr/bin/env node

/**
 * Manual test script to validate example specs
 * Run with: node test-examples.js
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseMarkdown } from './src/lib/spec/parser.js';
import { validateSpec, formatValidationErrors } from './src/lib/spec/validator.js';

const EXAMPLES = ['finance-app.md', 'fitness-app.md', 'saas-app.md'];

async function testExample(filename) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${filename}`);
  console.log('='.repeat(60));

  try {
    const path = join('examples', filename);
    const content = await readFile(path, 'utf-8');

    console.log('✓ File read successfully');

    const parsed = await parseMarkdown(content);
    console.log('✓ Markdown parsed successfully');

    const result = validateSpec(parsed);

    if (result.success) {
      console.log('✓ Validation passed');
      console.log(`  Project: ${result.data.projectName}`);
      console.log(`  Steps: ${result.data.onboardingSteps.length}`);
      console.log(`  Soft Paywall: ${result.data.softPaywall ? 'Yes' : 'No'}`);
      console.log(`  Hard Paywall: ${result.data.hardPaywall ? 'Yes' : 'No'}`);
    } else {
      console.log('✗ Validation failed');
      console.log(formatValidationErrors(result.errors));
    }
  } catch (error) {
    console.log('✗ Error:', error.message);
    if (error.stack) {
      console.log(error.stack);
    }
  }
}

async function main() {
  console.log('OnboardKit Example Specs Test');
  console.log('Testing parser and validator with example specs\n');

  for (const example of EXAMPLES) {
    await testExample(example);
  }

  console.log('\n' + '='.repeat(60));
  console.log('Testing complete!');
  console.log('='.repeat(60) + '\n');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
