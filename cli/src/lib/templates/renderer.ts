/**
 * Template rendering engine
 */

import Handlebars from 'handlebars';
import { promises as fs } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import prettier from 'prettier';
import { registerHelpers } from './helpers.js';
import { buildTemplateContext } from './context-builder.js';
import type { OnboardingSpec } from '../spec/schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface RenderResult {
  files: GeneratedFile[];
  summary: {
    totalFiles: number;
    screens: number;
    components: number;
    themeFiles: number;
    navigationFiles: number;
  };
}

/**
 * Load a Handlebars template from the templates directory
 */
async function loadTemplate(templatePath: string): Promise<HandlebarsTemplateDelegate> {
  const fullPath = join(__dirname, 'handlebars', templatePath);
  const content = await fs.readFile(fullPath, 'utf-8');
  return Handlebars.compile(content);
}

/**
 * Format TypeScript code with Prettier
 */
async function formatCode(code: string): Promise<string> {
  try {
    return await prettier.format(code, {
      parser: 'typescript',
      semi: true,
      singleQuote: true,
      trailingComma: 'all',
      printWidth: 100,
      tabWidth: 2,
    });
  } catch (error) {
    console.warn('Warning: Failed to format code with Prettier:', error);
    return code;
  }
}

/**
 * Render all templates from a validated spec
 */
export async function renderTemplates(spec: OnboardingSpec): Promise<RenderResult> {
  // Register Handlebars helpers
  registerHelpers();

  // Build template context
  const context = buildTemplateContext(spec);

  const files: GeneratedFile[] = [];

  // Theme files
  const themeTemplates = ['colors.hbs', 'typography.hbs', 'spacing.hbs', 'index.hbs'];
  for (const template of themeTemplates) {
    const compiled = await loadTemplate(`theme/${template}`);
    const rendered = compiled(context);
    const formatted = await formatCode(rendered);
    const filename = template.replace('.hbs', '');
    files.push({
      path: `theme/${filename}`,
      content: formatted,
    });
  }

  // Component files
  const componentTemplates = ['Button.hbs', 'Input.hbs', 'Card.hbs'];
  for (const template of componentTemplates) {
    const compiled = await loadTemplate(`components/${template}`);
    const rendered = compiled(context);
    const formatted = await formatCode(rendered);
    const filename = template.replace('.hbs', '.tsx');
    files.push({
      path: `components/${filename}`,
      content: formatted,
    });
  }

  // Navigation files (only for React Navigation)
  if (spec.config.navigation === 'react-navigation') {
    const navTemplates = ['stack.hbs', 'types.hbs'];
    for (const template of navTemplates) {
      const compiled = await loadTemplate(`navigation/${template}`);
      const rendered = compiled(context);
      const formatted = await formatCode(rendered);
      const filename = template.replace('.hbs', template.includes('stack') ? '.tsx' : '.ts');
      files.push({
        path: `navigation/${filename}`,
        content: formatted,
      });
    }
  }

  // Expo Router layout file
  if (spec.config.navigation === 'expo-router') {
    const layoutTemplate = await loadTemplate('expo-router/_layout.hbs');
    const layoutRendered = layoutTemplate(context);
    const layoutFormatted = await formatCode(layoutRendered);
    files.push({
      path: 'app/_layout.tsx',
      content: layoutFormatted,
    });
  }

  // Screens - Choose template folder based on navigation type
  const screenFolder = spec.config.navigation === 'expo-router' ? 'expo-router' : 'screens';
  const screenPath = spec.config.navigation === 'expo-router' ? 'app' : 'screens';

  // Screen: Welcome
  if (spec.config.navigation === 'expo-router') {
    const welcomeTemplate = await loadTemplate('expo-router/index.hbs');
    const welcomeRendered = welcomeTemplate(context);
    const welcomeFormatted = await formatCode(welcomeRendered);
    files.push({
      path: 'app/index.tsx',
      content: welcomeFormatted,
    });
  } else {
    const welcomeTemplate = await loadTemplate('screens/welcome.hbs');
    const welcomeRendered = welcomeTemplate(context);
    const welcomeFormatted = await formatCode(welcomeRendered);
    files.push({
      path: 'screens/WelcomeScreen.tsx',
      content: welcomeFormatted,
    });
  }

  // Screen: Login
  if (spec.config.navigation === 'expo-router') {
    const loginTemplate = await loadTemplate('expo-router/login.hbs');
    const loginRendered = loginTemplate(context);
    const loginFormatted = await formatCode(loginRendered);
    files.push({
      path: 'app/login.tsx',
      content: loginFormatted,
    });
  } else {
    const loginTemplate = await loadTemplate('screens/login.hbs');
    const loginRendered = loginTemplate(context);
    const loginFormatted = await formatCode(loginRendered);
    files.push({
      path: 'screens/LoginScreen.tsx',
      content: loginFormatted,
    });
  }

  // Screen: Name Capture (Signup)
  if (spec.config.navigation === 'expo-router') {
    const signupTemplate = await loadTemplate('expo-router/name-capture.hbs');
    const signupRendered = signupTemplate(context);
    const signupFormatted = await formatCode(signupRendered);
    files.push({
      path: 'app/name-capture.tsx',
      content: signupFormatted,
    });
  } else {
    const signupTemplate = await loadTemplate('screens/signup.hbs');
    const signupRendered = signupTemplate(context);
    const signupFormatted = await formatCode(signupRendered);
    files.push({
      path: 'screens/NameCaptureScreen.tsx',
      content: signupFormatted,
    });
  }

  // Screen: Home
  if (spec.config.navigation === 'expo-router') {
    const homeTemplate = await loadTemplate('expo-router/home.hbs');
    const homeRendered = homeTemplate(context);
    const homeFormatted = await formatCode(homeRendered);
    files.push({
      path: 'app/home.tsx',
      content: homeFormatted,
    });
  }

  // Onboarding step screens (generate for each step)
  for (let i = 0; i < spec.onboardingSteps.length; i++) {
    const step = spec.onboardingSteps[i];
    const isFirstStep = i === 0;
    const isLastStep = i === spec.onboardingSteps.length - 1;
    const stepContext = {
      ...context,
      step,
      stepNumber: i + 1,
      isFirstStep,
      isLastStep,
      prevStepIndex: i - 1,
      nextStepIndex: i + 1,
    };

    if (spec.config.navigation === 'expo-router') {
      // Expo Router - use template
      const stepTemplate = await loadTemplate('expo-router/onboarding-step.hbs');
      const stepRendered = stepTemplate(stepContext);
      const stepFormatted = await formatCode(stepRendered);
      files.push({
        path: `app/onboarding-step-${i}.tsx`,
        content: stepFormatted,
      });
    } else {
      // React Navigation - inline generation
      const stepContent = `/**
 * Onboarding Step ${i + 1} Screen for ${spec.projectName}
 * Generated by OnboardKit
 */

import React from 'react';
import { View, Text, Image, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../components/Button';
import { colors, typography, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'OnboardingStep${i + 1}'>;

export function OnboardingStep${i + 1}Screen() {
  const navigation = useNavigation<NavigationProp>();

  const handleNext = () => {
    ${i === spec.onboardingSteps.length - 1 ? (spec.softPaywall ? "navigation.navigate('SoftPaywall');" : "navigation.navigate('Login');") : `navigation.navigate('OnboardingStep${i + 2}');`}
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.imageContainer}>
          <Image
            source={require('../assets/${step.image}.png')}
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.headline}>${step.headline}</Text>
          <Text style={styles.subtext}>${step.subtext}</Text>
        </View>

        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>${i + 1} / ${spec.onboardingSteps.length}</Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Next"
            variant="primary"
            fullWidth
            onPress={handleNext}
          />
          ${i > 0 ? `<Button
            title="Back"
            variant="ghost"
            fullWidth
            onPress={handleBack}
          />` : ''}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
    paddingVertical: spacing.xl,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    maxHeight: 350,
  },
  textContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  headline: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtext: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  progressContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  progressText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  buttonContainer: {
    gap: spacing.md,
  },
});
`;

      const stepFormatted = await formatCode(stepContent);
      files.push({
        path: `screens/OnboardingStep${i + 1}Screen.tsx`,
        content: stepFormatted,
      });
    }
  }

  // Home screen placeholder
  const homeContent = `/**
 * Home Screen for ${spec.projectName}
 * Generated by OnboardKit
 */

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { colors, typography, spacing } from '../theme';

export function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to ${spec.projectName}!</Text>
        <Text style={styles.subtitle}>
          This is your home screen. Start building your app here.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...typography.h1,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
`;

  const homeFormatted = await formatCode(homeContent);
  files.push({
    path: 'screens/HomeScreen.tsx',
    content: homeFormatted,
  });

  // Calculate summary
  const screens = files.filter((f) => f.path.startsWith('screens/')).length;
  const components = files.filter((f) => f.path.startsWith('components/')).length;
  const themeFiles = files.filter((f) => f.path.startsWith('theme/')).length;
  const navigationFiles = files.filter((f) => f.path.startsWith('navigation/')).length;

  return {
    files,
    summary: {
      totalFiles: files.length,
      screens,
      components,
      themeFiles,
      navigationFiles,
    },
  };
}
