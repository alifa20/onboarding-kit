import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';
import type { Root, Heading, List, ListItem, Paragraph, Text } from 'mdast';

/**
 * Parse markdown content and extract structured data
 */
export async function parseMarkdown(content: string): Promise<unknown> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ['yaml']);

  const tree = processor.parse(content) as Root;
  const result: Record<string, unknown> = {};

  let currentSection: string | null = null;
  let currentSubsection: string | null = null;
  const onboardingSteps: unknown[] = [];

  for (const node of tree.children) {
    // Extract project name from H1
    if (node.type === 'heading' && node.depth === 1) {
      const text = extractText(node);
      result.projectName = text;
    }

    // Extract main sections from H2
    if (node.type === 'heading' && node.depth === 2) {
      currentSection = extractText(node).toLowerCase();
      currentSubsection = null;
    }

    // Extract subsections from H3
    if (node.type === 'heading' && node.depth === 3) {
      currentSubsection = extractText(node);

      // Handle onboarding steps
      if (currentSection === 'onboarding steps') {
        const stepMatch = currentSubsection.match(/step\s+(\d+)/i);
        if (stepMatch) {
          // Will be populated by the next list
          onboardingSteps.push({});
        }
      }
    }

    // Extract list items
    if (node.type === 'list' && currentSection) {
      const data = parseList(node);

      if (currentSection === 'config') {
        result.config = data;
      } else if (currentSection === 'theme') {
        result.theme = data;
      } else if (currentSection === 'welcome screen') {
        result.welcome = data;
      } else if (currentSection === 'onboarding steps') {
        // Add to the last step
        if (onboardingSteps.length > 0) {
          onboardingSteps[onboardingSteps.length - 1] = data;
        }
      } else if (currentSection === 'soft paywall') {
        result.softPaywall = data;
      } else if (currentSection === 'login') {
        result.login = data;
      } else if (currentSection === 'name capture') {
        result.nameCapture = data;
      } else if (currentSection === 'hard paywall') {
        result.hardPaywall = data;
      }
    }
  }

  if (onboardingSteps.length > 0) {
    result.onboardingSteps = onboardingSteps;
  }

  return result;
}

/**
 * Parse a list into key-value pairs
 */
function parseList(list: List): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const item of list.children) {
    if (item.type !== 'listItem') continue;

    const text = extractListItemText(item);
    const colonIndex = text.indexOf(':');

    if (colonIndex === -1) continue;

    const key = text.substring(0, colonIndex).trim();
    let value: unknown = text.substring(colonIndex + 1).trim();

    // Convert key to camelCase
    const camelKey = toCamelCase(key);

    // Strip quotes
    if (typeof value === 'string') {
      value = value.replace(/^["']|["']$/g, '');
    }

    // Parse arrays
    if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
      const arrayContent = value.substring(1, value.length - 1);
      value = arrayContent.split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
    }

    // Handle nested lists (for features, plans, etc.)
    if (item.children.length > 1) {
      const nestedList = item.children.find((child) => child.type === 'list');
      if (nestedList && nestedList.type === 'list') {
        const nestedItems = nestedList.children
          .map((nested) => {
            if (nested.type !== 'listItem') return null;
            const nestedText = extractListItemText(nested);
            return nestedText.replace(/^["']|["']$/g, '');
          })
          .filter((item): item is string => item !== null);

        // Check if it's a features list, plans list, methods list, or fields list
        if (
          camelKey === 'features' ||
          camelKey === 'plans' ||
          camelKey === 'methods' ||
          camelKey === 'fields'
        ) {
          value = nestedItems;
        }
      }
    }

    // Convert numeric strings to numbers
    if (typeof value === 'string' && !isNaN(Number(value))) {
      value = Number(value);
    }

    result[camelKey] = value;
  }

  return result;
}

/**
 * Extract text content from a heading node
 */
function extractText(node: Heading): string {
  const textNodes: string[] = [];

  function walk(n: Heading | Paragraph | Text): void {
    if (n.type === 'text') {
      textNodes.push(n.value);
    } else if ('children' in n) {
      for (const child of n.children) {
        walk(child as Heading | Paragraph | Text);
      }
    }
  }

  walk(node);
  return textNodes.join('');
}

/**
 * Extract text from a list item
 */
function extractListItemText(item: ListItem): string {
  const textNodes: string[] = [];

  function walk(node: ListItem['children'][0]): void {
    if (node.type === 'text') {
      textNodes.push(node.value);
    } else if ('children' in node && node.type !== 'list') {
      for (const child of node.children) {
        walk(child);
      }
    }
  }

  // Only walk the first paragraph, not nested lists
  const firstParagraph = item.children.find((child) => child.type === 'paragraph');
  if (firstParagraph) {
    walk(firstParagraph);
  }

  return textNodes.join('');
}

/**
 * Convert kebab-case or space-separated string to camelCase
 */
function toCamelCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase());
}
