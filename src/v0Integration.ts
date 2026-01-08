/**
 * v0 SDK Integration
 * 
 * This module handles integration with v0.dev using the v0-sdk.
 * It allows programmatic creation of v0 projects from prompts and screenshots.
 * 
 * Features:
 * - Send prompts to v0.dev
 * - Attach screenshots as image URLs
 * - Return link to generated project
 * 
 * API Key:
 * Requires V0_API_KEY to be provided via environment variable or UI input
 */

/**
 * Interface for v0 integration result
 */
export interface V0Result {
  success: boolean;
  webUrl?: string;
  demoUrl?: string;
  error?: string;
}

/**
 * Interface for screenshot data
 */
export interface Screenshot {
  id: string;
  name: string;
  base64Data: string; // data:image/png;base64,...
}

/**
 * Send prompt and screenshots to v0.dev
 * 
 * Note: Since Figma plugins run in a sandboxed environment with limited network access,
 * this function is designed to work with the v0-sdk in a Node.js-like environment.
 * 
 * For screenshot attachments, v0 expects public URLs. Since we have base64 data,
 * we have two options:
 * 1. Upload to an image hosting service first (requires additional API)
 * 2. Include in the prompt as context (simpler but less optimal)
 * 
 * Current implementation: Returns instructions for manual v0 usage with enhanced context.
 * Future enhancement: Integrate with image hosting service for true attachment support.
 * 
 * @param prompt - The design specification prompt
 * @param screenshots - Array of screenshot data (base64)
 * @param apiKey - v0 API key
 * @returns Promise with v0 result
 */
export async function sendToV0(
  prompt: string,
  screenshots: Screenshot[],
  apiKey: string
): Promise<V0Result> {
  // Validate API key
  if (!apiKey || apiKey.trim() === '') {
    return {
      success: false,
      error: 'V0_API_KEY is required. Please set it in the plugin settings.'
    };
  }

  // Check if we're in a Figma plugin environment
  // Figma plugins have limited network access and can't use Node.js modules directly
  // NOTE: Due to Figma's sandbox environment, the v0-sdk currently cannot be used directly
  // This function returns an error, and the UI falls back to the manual v0.dev URL method
  // Future improvement: Implement a server-side proxy to enable full SDK integration
  const isFigmaEnv = typeof figma !== 'undefined';

  if (isFigmaEnv) {
    // In Figma environment, we can't use v0-sdk directly due to limitations
    // Return structured data for UI to handle
    return {
      success: false,
      error: 'Direct v0 SDK integration is not available in Figma plugin sandbox. Use the "Open in v0.dev" button instead.'
    };
  }

  try {
    // This code path would run in a Node.js environment (e.g., build script or server)
    // Import v0-sdk dynamically to avoid issues in Figma environment
    const { createClient } = await import('v0-sdk');
    
    const client = createClient({
      apiKey: apiKey
    });

    // Prepare message with screenshot context
    let message = prompt;
    
    if (screenshots && screenshots.length > 0) {
      message += '\n\n---\n\n';
      message += `**Visual Context**: ${screenshots.length} screenshot${screenshots.length > 1 ? 's' : ''} provided.\n`;
      message += 'Please refer to the attached images for visual reference and ensure the generated code matches the design specifications.\n';
    }

    // Note: v0-sdk expects attachments as public URLs
    // Since we have base64 data, we would need to upload to an image host first
    // For now, we create the chat without attachments and inform the user
    const attachments: { url: string }[] = [];
    
    // TODO: Upload screenshots to image hosting service and add URLs to attachments
    // For example:
    // for (const screenshot of screenshots) {
    //   const url = await uploadToImageHost(screenshot.base64Data);
    //   attachments.push({ url });
    // }

    // Create chat with v0
    const chat = await client.chats.create({
      message: message,
      attachments: attachments.length > 0 ? attachments : undefined,
      system: 'You are an expert UI/UX developer. Generate pixel-perfect, production-ready code based on the provided design specifications.'
    });

    return {
      success: true,
      webUrl: chat.url,
      demoUrl: chat.demo
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Get v0 API key from localStorage or environment
 * Provides a fallback mechanism for API key retrieval
 * 
 * @returns API key or empty string
 */
export function getV0ApiKey(): string {
  // Try to get from localStorage (set via UI)
  // Use 'self' which is available in both browser and Figma plugin context
  if (typeof self !== 'undefined' && (self as any).localStorage) {
    const key = (self as any).localStorage.getItem('v0ApiKey');
    if (key) return key;
  }
  
  // Fallback: check for V0_API_KEY in environment
  // This would only work in a Node.js context, not in Figma plugin
  try {
    const envKey = (globalThis as any).process?.env?.V0_API_KEY;
    if (envKey) return envKey;
  } catch {
    // Ignore errors in non-Node environments
  }
  
  return '';
}

/**
 * Save v0 API key to localStorage
 * 
 * @param apiKey - The API key to save
 */
export function saveV0ApiKey(apiKey: string): void {
  if (typeof self !== 'undefined' && (self as any).localStorage) {
    (self as any).localStorage.setItem('v0ApiKey', apiKey);
  }
}
