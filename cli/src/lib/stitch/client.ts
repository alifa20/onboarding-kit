/**
 * Stitch MCP Client
 * Interfaces with Stitch MCP server for UI generation
 */

import type {
  StitchProject,
  StitchScreen,
  StitchPrompt,
  StitchGenerationResult,
} from './types.js';

/**
 * MCP tool call result
 */
interface MCPToolResult {
  content: Array<{ type: string; text?: string; [key: string]: unknown }>;
  isError?: boolean;
}

/**
 * Check if MCP tools are available
 */
export function isStitchMCPAvailable(): boolean {
  // Check if the global MCP client is available
  // This will be true when running in Claude Code with MCP servers configured
  return typeof globalThis !== 'undefined' && 'mcpTools' in globalThis;
}

/**
 * Call an MCP tool
 * Note: This is a simplified interface. In production, this would use the actual MCP protocol.
 * For now, we'll document the expected behavior.
 */
async function callMCPTool(
  toolName: string,
  parameters: Record<string, unknown>
): Promise<MCPToolResult> {
  // In the real implementation, this would call the MCP server
  // For now, throw an error explaining the limitation
  throw new Error(
    `MCP tool calls must be made through Claude Code's MCP integration. ` +
      `Tool: ${toolName}, Parameters: ${JSON.stringify(parameters)}`
  );
}

/**
 * Create a new Stitch project
 */
export async function createStitchProject(title: string): Promise<StitchProject> {
  try {
    const result = await callMCPTool('mcp__stitch__create_project', { title });

    if (result.isError) {
      throw new Error('Failed to create Stitch project');
    }

    // Parse the result to extract project info
    const textContent = result.content.find((c) => c.type === 'text')?.text;
    if (!textContent) {
      throw new Error('No project data returned from Stitch');
    }

    // Extract project name (format: "projects/{id}")
    const projectMatch = textContent.match(/projects\/(\d+)/);
    if (!projectMatch) {
      throw new Error('Could not parse project ID from Stitch response');
    }

    const projectId = projectMatch[1];
    const name = `projects/${projectId}`;

    return {
      name,
      projectId,
      title,
    };
  } catch (error) {
    throw new Error(
      `Failed to create Stitch project: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Generate a screen in Stitch from a text prompt
 */
export async function generateStitchScreen(
  projectId: string,
  prompt: StitchPrompt
): Promise<StitchGenerationResult> {
  try {
    const result = await callMCPTool('mcp__stitch__generate_screen_from_text', {
      projectId,
      prompt: prompt.prompt,
      deviceType: prompt.deviceType,
      modelId: 'GEMINI_3_FLASH', // Use fast model for generation
    });

    if (result.isError) {
      return {
        screen: {
          name: '',
          projectId,
          screenId: prompt.screenId,
          title: prompt.screenName,
        },
        success: false,
        error: 'Screen generation failed',
      };
    }

    // Parse the result to extract screen info
    const textContent = result.content.find((c) => c.type === 'text')?.text;
    if (!textContent) {
      return {
        screen: {
          name: '',
          projectId,
          screenId: prompt.screenId,
          title: prompt.screenName,
        },
        success: false,
        error: 'No screen data returned from Stitch',
      };
    }

    // Extract screen ID from response
    const screenMatch = textContent.match(/screens\/([a-f0-9]+)/);
    const screenId = screenMatch ? screenMatch[1] : prompt.screenId;
    const name = `projects/${projectId}/screens/${screenId}`;

    // Try to extract preview URL if available
    const urlMatch = textContent.match(/https:\/\/[^\s]+/);
    const previewUrl = urlMatch ? urlMatch[0] : undefined;

    return {
      screen: {
        name,
        projectId,
        screenId,
        title: prompt.screenName,
        previewUrl,
      },
      success: true,
    };
  } catch (error) {
    return {
      screen: {
        name: '',
        projectId,
        screenId: prompt.screenId,
        title: prompt.screenName,
      },
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get screen details from Stitch
 */
export async function getStitchScreen(
  projectId: string,
  screenId: string
): Promise<StitchScreen | null> {
  try {
    const result = await callMCPTool('mcp__stitch__get_screen', {
      projectId,
      screenId,
    });

    if (result.isError) {
      return null;
    }

    const textContent = result.content.find((c) => c.type === 'text')?.text;
    if (!textContent) {
      return null;
    }

    // Parse screen details
    const name = `projects/${projectId}/screens/${screenId}`;
    const urlMatch = textContent.match(/https:\/\/[^\s]+/);
    const previewUrl = urlMatch ? urlMatch[0] : undefined;

    return {
      name,
      projectId,
      screenId,
      title: 'Screen', // Would parse from response in real implementation
      previewUrl,
    };
  } catch (error) {
    return null;
  }
}

/**
 * List all screens in a project
 */
export async function listStitchScreens(projectId: string): Promise<StitchScreen[]> {
  try {
    const result = await callMCPTool('mcp__stitch__list_screens', { projectId });

    if (result.isError) {
      return [];
    }

    const textContent = result.content.find((c) => c.type === 'text')?.text;
    if (!textContent) {
      return [];
    }

    // Parse screen list from response
    // In real implementation, would parse structured data
    const screenMatches = textContent.matchAll(/screens\/([a-f0-9]+)/g);
    const screens: StitchScreen[] = [];

    for (const match of screenMatches) {
      const screenId = match[1];
      screens.push({
        name: `projects/${projectId}/screens/${screenId}`,
        projectId,
        screenId,
        title: 'Screen',
      });
    }

    return screens;
  } catch (error) {
    return [];
  }
}

/**
 * Generate all screens from prompts
 */
export async function generateAllScreens(
  projectId: string,
  prompts: StitchPrompt[]
): Promise<StitchGenerationResult[]> {
  const results: StitchGenerationResult[] = [];

  // Generate screens sequentially to avoid overwhelming the API
  for (const prompt of prompts) {
    const result = await generateStitchScreen(projectId, prompt);
    results.push(result);

    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return results;
}
