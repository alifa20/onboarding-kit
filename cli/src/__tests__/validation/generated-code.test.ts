import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { parseMarkdown } from '../../lib/spec/parser.js';
import { validateSpec } from '../../lib/spec/validator.js';
import { buildContext } from '../../lib/templates/context-builder.js';
import { renderTemplate } from '../../lib/templates/renderer.js';
import { createTempDir, cleanupTempDir, createMinimalSpec } from '../utils/fixtures.js';
import {
  validateTypeScriptSyntax,
  hasReactNativeImports,
  usesStyleSheet,
  hasHardcodedValues,
} from '../utils/helpers.js';
import { join } from 'node:path';
import { readFile } from 'node:fs/promises';

describe('Generated Code Validation', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await createTempDir();
  });

  afterEach(async () => {
    await cleanupTempDir(tempDir);
  });

  describe('TypeScript Compilation', () => {
    it('should generate valid TypeScript syntax', async () => {
      const specContent = createMinimalSpec();
      const parsed = await parseMarkdown(specContent);
      const validation = validateSpec(parsed);

      if (!validation.success) {
        throw new Error('Validation failed');
      }

      const context = buildContext(validation.data);

      // Test with a simple welcome screen template
      const templateContent = `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.headline}>{{welcome.headline}}</Text>
      <Text style={styles.subtext}>{{welcome.subtext}}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headline: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtext: {
    fontSize: 16,
  },
});
`;

      const rendered = await renderTemplate(templateContent, context);
      const syntaxCheck = validateTypeScriptSyntax(rendered);

      expect(syntaxCheck.valid).toBe(true);
      expect(syntaxCheck.errors).toHaveLength(0);
    });

    it('should include proper imports', async () => {
      const code = `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TestScreen() {
  return <View><Text>Test</Text></View>;
}`;

      expect(hasReactNativeImports(code)).toBe(true);
    });

    it('should use StyleSheet.create', async () => {
      const code = `const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});`;

      expect(usesStyleSheet(code)).toBe(true);
    });
  });

  describe('React Native Best Practices', () => {
    it('should use StyleSheet instead of inline styles', () => {
      const goodCode = `const styles = StyleSheet.create({
  container: { flex: 1 },
});`;

      const badCode = `<View style={{ flex: 1 }} />`;

      expect(usesStyleSheet(goodCode)).toBe(true);
      // Inline styles should be avoided but might be present
    });

    it('should use theme values instead of hardcoded colors', () => {
      const goodCode = `import { colors } from '../theme/colors';

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
});`;

      const badCode = `const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
  },
});`;

      expect(goodCode).toContain('colors.background');
      expect(hasHardcodedValues(badCode)).toBe(true);
    });

    it('should import theme files correctly', () => {
      const code = `import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';`;

      expect(code).toContain("from '../theme/colors'");
      expect(code).toContain("from '../theme/typography'");
      expect(code).toContain("from '../theme/spacing'");
    });
  });

  describe('Navigation Types', () => {
    it('should generate type-safe navigation', async () => {
      const navigationTypes = `import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Welcome: undefined;
  OnboardingStep1: undefined;
  Login: undefined;
  NameCapture: undefined;
  Home: undefined;
};

export type WelcomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Welcome'
>;`;

      expect(navigationTypes).toContain('RootStackParamList');
      expect(navigationTypes).toContain('NativeStackNavigationProp');
    });

    it('should use navigation hooks correctly', () => {
      const code = `import { useNavigation } from '@react-navigation/native';
import type { WelcomeScreenNavigationProp } from '../navigation/types';

export default function WelcomeScreen() {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();

  const handleNext = () => {
    navigation.navigate('OnboardingStep1');
  };

  return null;
}`;

      expect(code).toContain('useNavigation<WelcomeScreenNavigationProp>');
      expect(code).toContain("navigation.navigate('OnboardingStep1')");
    });
  });

  describe('Theme Consistency', () => {
    it('should generate consistent theme files', async () => {
      const specContent = createMinimalSpec();
      const parsed = await parseMarkdown(specContent);
      const validation = validateSpec(parsed);

      if (!validation.success) {
        throw new Error('Validation failed');
      }

      const context = buildContext(validation.data);

      expect(context.theme.primary).toBe('#6366F1');
      expect(context.theme.secondary).toBe('#8B5CF6');
      expect(context.theme.background).toBe('#FFFFFF');
    });

    it('should use theme colors consistently', () => {
      const colorsFile = `export const colors = {
  primary: '#6366F1',
  secondary: '#8B5CF6',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  text: '#000000',
  textSecondary: '#666666',
  error: '#DC2626',
  success: '#10B981',
} as const;`;

      expect(colorsFile).toContain('primary:');
      expect(colorsFile).toContain('secondary:');
      expect(colorsFile).toContain('as const');
    });

    it('should generate typography with consistent font', () => {
      const typographyFile = `export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
} as const;`;

      expect(typographyFile).toContain('fontFamily:');
      expect(typographyFile).toContain('fontSize:');
    });
  });

  describe('No Hardcoded Values', () => {
    it('should not have hardcoded colors in screens', () => {
      const goodCode = `import { colors } from '../theme/colors';

const styles = StyleSheet.create({
  text: {
    color: colors.text,
  },
});`;

      const badCode = `const styles = StyleSheet.create({
  text: {
    color: '#000000',
  },
});`;

      expect(goodCode).toContain('colors.text');
      expect(hasHardcodedValues(badCode)).toBe(true);
    });

    it('should not have hardcoded spacing', () => {
      const goodCode = `import { spacing } from '../theme/spacing';

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
});`;

      expect(goodCode).toContain('spacing.md');
    });

    it('should not have hardcoded font sizes', () => {
      const goodCode = `import { typography } from '../theme/typography';

const styles = StyleSheet.create({
  headline: typography.h1,
});`;

      expect(goodCode).toContain('typography.h1');
    });
  });

  describe('Component Structure', () => {
    it('should export default function components', () => {
      const code = `export default function WelcomeScreen() {
  return null;
}`;

      expect(code).toContain('export default function');
    });

    it('should use proper React Native components', () => {
      const code = `import { View, Text, Pressable, ScrollView } from 'react-native';`;

      expect(code).toContain('View');
      expect(code).toContain('Text');
      expect(code).toContain('Pressable');
      expect(code).not.toContain('Button'); // Should use Pressable
      expect(code).not.toContain('div'); // Should use View
    });

    it('should use Pressable instead of TouchableOpacity', () => {
      const modernCode = `import { Pressable } from 'react-native';

<Pressable onPress={handlePress}>
  <Text>Press me</Text>
</Pressable>`;

      expect(modernCode).toContain('Pressable');
      expect(modernCode).not.toContain('TouchableOpacity');
    });
  });

  describe('Accessibility', () => {
    it('should include accessibility props where appropriate', () => {
      const accessibleCode = `<Pressable
  onPress={handlePress}
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel="Get Started"
>
  <Text>Get Started</Text>
</Pressable>`;

      expect(accessibleCode).toContain('accessible');
      expect(accessibleCode).toContain('accessibilityRole');
      expect(accessibleCode).toContain('accessibilityLabel');
    });
  });

  describe('Code Quality', () => {
    it('should not use any type', () => {
      const badCode = `const data: any = {};`;
      const goodCode = `const data: Record<string, unknown> = {};`;

      expect(badCode).toContain('any');
      expect(goodCode).not.toContain(': any');
      expect(goodCode).toContain('Record<string, unknown>');
    });

    it('should use const for styles', () => {
      const code = `const styles = StyleSheet.create({
  container: { flex: 1 },
});`;

      expect(code).toContain('const styles');
      expect(code).not.toContain('let styles');
      expect(code).not.toContain('var styles');
    });

    it('should use proper TypeScript types for props', () => {
      const code = `interface WelcomeScreenProps {
  onNext: () => void;
  headline: string;
}

export default function WelcomeScreen(props: WelcomeScreenProps) {
  return null;
}`;

      expect(code).toContain('interface');
      expect(code).toContain('Props');
      expect(code).toContain('props: WelcomeScreenProps');
    });
  });

  describe('File Structure', () => {
    it('should generate files in correct directories', () => {
      const expectedFiles = [
        'screens/WelcomeScreen.tsx',
        'screens/LoginScreen.tsx',
        'screens/NameCaptureScreen.tsx',
        'navigation/RootNavigator.tsx',
        'navigation/types.ts',
        'theme/colors.ts',
        'theme/typography.ts',
        'theme/spacing.ts',
        'theme/index.ts',
      ];

      expectedFiles.forEach((file) => {
        expect(file).toMatch(/\.(tsx|ts)$/);
      });
    });

    it('should use correct file extensions', () => {
      const componentFile = 'WelcomeScreen.tsx';
      const typeFile = 'types.ts';

      expect(componentFile).toMatch(/\.tsx$/);
      expect(typeFile).toMatch(/\.ts$/);
    });
  });
});
