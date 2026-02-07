/**
 * Standard output directory structure for OnboardKit
 */

export interface OutputStructure {
  root: string;
  screens: string;
  theme: string;
  components: string;
  navigation: string;
  metadata: string;
}

/**
 * Standard directory names
 */
export const DIRECTORY_NAMES = {
  SCREENS: 'screens',
  THEME: 'theme',
  COMPONENTS: 'components',
  NAVIGATION: 'navigation',
  METADATA: '.onboardkit',
} as const;

/**
 * Standard file names
 */
export const FILE_NAMES = {
  INDEX: 'index.ts',
  MANIFEST: 'output-manifest.json',
  SUMMARY: 'generation-summary.json',
  COLORS: 'colors.ts',
  TYPOGRAPHY: 'typography.ts',
  SPACING: 'spacing.ts',
  THEME_INDEX: 'index.ts',
  NAVIGATOR: 'OnboardingNavigator.tsx',
  NAV_TYPES: 'types.ts',
} as const;

/**
 * Get the standard output structure for a given root directory
 */
export function getOutputStructure(rootDir: string): OutputStructure {
  return {
    root: rootDir,
    screens: `${rootDir}/${DIRECTORY_NAMES.SCREENS}`,
    theme: `${rootDir}/${DIRECTORY_NAMES.THEME}`,
    components: `${rootDir}/${DIRECTORY_NAMES.COMPONENTS}`,
    navigation: `${rootDir}/${DIRECTORY_NAMES.NAVIGATION}`,
    metadata: `${rootDir}/${DIRECTORY_NAMES.METADATA}`,
  };
}

/**
 * Get all directories that should be created
 */
export function getAllDirectories(structure: OutputStructure): string[] {
  return [
    structure.root,
    structure.screens,
    structure.theme,
    structure.components,
    structure.navigation,
    structure.metadata,
  ];
}

/**
 * Screen file naming convention
 */
export function getScreenFileName(screenType: string, index?: number): string {
  const baseName = screenType
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  if (index !== undefined) {
    return `${baseName}${index}Screen.tsx`;
  }

  return `${baseName}Screen.tsx`;
}

/**
 * Component file naming convention
 */
export function getComponentFileName(componentName: string): string {
  const pascalCase = componentName
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  return `${pascalCase}.tsx`;
}
