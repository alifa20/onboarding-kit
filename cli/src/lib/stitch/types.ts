/**
 * Types for Stitch MCP integration
 */

/**
 * Stitch prompt for a single screen
 */
export interface StitchPrompt {
  /** Screen identifier (e.g., "welcome", "onboarding-step-1") */
  screenId: string;
  /** Screen display name */
  screenName: string;
  /** Prompt text for Stitch UI generation */
  prompt: string;
  /** Device type for the design */
  deviceType: 'MOBILE' | 'DESKTOP' | 'TABLET';
}

/**
 * Stitch project information
 */
export interface StitchProject {
  /** Project name in format "projects/{id}" */
  name: string;
  /** Project ID */
  projectId: string;
  /** Project title */
  title: string;
}

/**
 * Stitch screen information
 */
export interface StitchScreen {
  /** Screen name in format "projects/{projectId}/screens/{screenId}" */
  name: string;
  /** Project ID */
  projectId: string;
  /** Screen ID */
  screenId: string;
  /** Screen title */
  title: string;
  /** Preview URL if available */
  previewUrl?: string;
}

/**
 * Result of generating a screen in Stitch
 */
export interface StitchGenerationResult {
  /** The generated screen */
  screen: StitchScreen;
  /** Whether generation succeeded */
  success: boolean;
  /** Error message if generation failed */
  error?: string;
}
