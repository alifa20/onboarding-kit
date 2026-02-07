/**
 * Tests for Handlebars helpers
 */

import { describe, it, expect, beforeAll } from 'vitest';
import Handlebars from 'handlebars';
import { registerHelpers } from '../helpers';

describe('Handlebars helpers', () => {
  beforeAll(() => {
    registerHelpers();
  });

  describe('pascalCase', () => {
    it('should convert to PascalCase', () => {
      const template = Handlebars.compile('{{pascalCase str}}');
      expect(template({ str: 'hello world' })).toBe('HelloWorld');
      expect(template({ str: 'first_name' })).toBe('FirstName');
      expect(template({ str: 'my-component' })).toBe('MyComponent');
    });
  });

  describe('camelCase', () => {
    it('should convert to camelCase', () => {
      const template = Handlebars.compile('{{camelCase str}}');
      expect(template({ str: 'hello world' })).toBe('helloWorld');
      expect(template({ str: 'first_name' })).toBe('firstName');
      expect(template({ str: 'my-component' })).toBe('myComponent');
    });
  });

  describe('kebabCase', () => {
    it('should convert to kebab-case', () => {
      const template = Handlebars.compile('{{kebabCase str}}');
      expect(template({ str: 'Hello World' })).toBe('hello-world');
      expect(template({ str: 'firstName' })).toBe('firstname');
      expect(template({ str: 'My Component' })).toBe('my-component');
    });
  });

  describe('eq', () => {
    it('should check equality', () => {
      const template = Handlebars.compile('{{#if (eq a b)}}equal{{else}}not equal{{/if}}');
      expect(template({ a: 'test', b: 'test' })).toBe('equal');
      expect(template({ a: 'test', b: 'other' })).toBe('not equal');
      expect(template({ a: 5, b: 5 })).toBe('equal');
    });
  });

  describe('includes', () => {
    it('should check if array includes value', () => {
      const template = Handlebars.compile(
        '{{#if (includes arr val)}}found{{else}}not found{{/if}}',
      );
      expect(template({ arr: ['a', 'b', 'c'], val: 'b' })).toBe('found');
      expect(template({ arr: ['a', 'b', 'c'], val: 'd' })).toBe('not found');
    });

    it('should handle non-arrays gracefully', () => {
      const template = Handlebars.compile(
        '{{#if (includes arr val)}}found{{else}}not found{{/if}}',
      );
      expect(template({ arr: null, val: 'a' })).toBe('not found');
      expect(template({ arr: undefined, val: 'a' })).toBe('not found');
    });
  });

  describe('json', () => {
    it('should stringify objects', () => {
      const template = Handlebars.compile('{{{json obj}}}');
      const result = template({ obj: { name: 'test', value: 42 } });
      expect(result).toContain('"name": "test"');
      expect(result).toContain('"value": 42');
    });
  });

  describe('join', () => {
    it('should join arrays with separator', () => {
      const template = Handlebars.compile('{{join arr sep}}');
      expect(template({ arr: ['a', 'b', 'c'], sep: ', ' })).toBe('a, b, c');
      expect(template({ arr: ['one', 'two'], sep: ' - ' })).toBe('one - two');
    });

    it('should handle empty arrays', () => {
      const template = Handlebars.compile('{{join arr sep}}');
      expect(template({ arr: [], sep: ', ' })).toBe('');
    });

    it('should handle non-arrays', () => {
      const template = Handlebars.compile('{{join arr sep}}');
      expect(template({ arr: null, sep: ', ' })).toBe('');
    });
  });

  describe('inc', () => {
    it('should increment numbers', () => {
      const template = Handlebars.compile('{{inc num}}');
      expect(template({ num: 5 })).toBe('6');
      expect(template({ num: 0 })).toBe('1');
      expect(template({ num: -1 })).toBe('0');
    });
  });

  describe('isLast', () => {
    it('should identify last item in array', () => {
      const template = Handlebars.compile(
        '{{#each arr}}{{#if (isLast @index ../arr)}}last{{else}}not-last{{/if}} {{/each}}',
      );
      expect(template({ arr: ['a', 'b', 'c'] })).toBe('not-last not-last last ');
    });
  });
});
