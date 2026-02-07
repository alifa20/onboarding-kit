/**
 * Handlebars helpers for code generation
 */

import Handlebars from 'handlebars';

/**
 * Register custom Handlebars helpers for code generation
 */
export function registerHelpers(): void {
  // Convert string to PascalCase
  Handlebars.registerHelper('pascalCase', (str: string) => {
    return str
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  });

  // Convert string to camelCase
  Handlebars.registerHelper('camelCase', (str: string) => {
    const pascal = str
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  });

  // Convert string to kebab-case
  Handlebars.registerHelper('kebabCase', (str: string) => {
    return str
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((word) => word.toLowerCase())
      .join('-');
  });

  // Conditional equality check
  Handlebars.registerHelper('eq', (a: unknown, b: unknown) => {
    return a === b;
  });

  // Conditional includes check (array contains)
  Handlebars.registerHelper('includes', (array: unknown[], value: unknown) => {
    return Array.isArray(array) && array.includes(value);
  });

  // JSON stringify for debugging
  Handlebars.registerHelper('json', (context: unknown) => {
    return JSON.stringify(context, null, 2);
  });

  // Join array with separator
  Handlebars.registerHelper('join', (array: string[], separator: string) => {
    return Array.isArray(array) ? array.join(separator) : '';
  });

  // Increment number
  Handlebars.registerHelper('inc', (value: number) => {
    return value + 1;
  });

  // Check if last item in array
  Handlebars.registerHelper('isLast', function (this: unknown, index: number, array: unknown[]) {
    return index === array.length - 1;
  });
}
