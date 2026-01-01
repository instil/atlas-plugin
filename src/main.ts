// This file handles the main plugin logic


/**
 * Figma Plugin: Design → Prompt Compiler
 *
 * Goal:
 * - Read selected FRAME nodes from the Figma canvas
 * - Traverse their children recursively
 * - Extract layout, spacing, typography, colors, and component metadata
 * - Normalize Figma-specific data into a deterministic JSON schema
 * - Compile that schema into a strict, pixel-accurate prompt
 *
 * Constraints:
 * - Do NOT generate code from screenshots
 * - Prefer Auto Layout data over absolute positioning
 * - Be explicit and deterministic (no guessing)
 * - This plugin does NOT generate UI code directly
 *
 * Output:
 * - A structured JSON representation of each selected frame
 * - A human-readable prompt suitable for tools like v0.dev
 *
 * Tech:
 * - TypeScript
 * - Figma Plugin API
 */


import { normalizeFrame, extractDesignSystem } from './normalizeNode';
import { compileUnifiedPrompt } from './promptCompiler';
import type { ProcessedFrame } from './types';

// Figma provides __html__ automatically when ui is specified in manifest
// @ts-ignore - __html__ is injected by Figma
figma.showUI(__html__, { width: 480, height: 720 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'process-selection') {
    const selection = figma.currentPage.selection;
    
    if (selection.length === 0) {
      figma.ui.postMessage({ type: 'error', message: 'Please select at least one frame' });
      return;
    }

    // Filter only FRAME nodes
    const frames = selection.filter(node => node.type === 'FRAME') as FrameNode[];
    
    if (frames.length === 0) {
      figma.ui.postMessage({ 
        type: 'error', 
        message: 'Please select one or more FRAME nodes (not groups or other types)' 
      });
      return;
    }

    try {
      // Extract design system from all frames
      const designSystem = extractDesignSystem(frames);
      
      // Process frames (but don't generate prompt yet)
      const processedFrames: ProcessedFrame[] = [];
      
      for (const frame of frames) {
        const normalized = normalizeFrame(frame);
        processedFrames.push(normalized);
      }

      // Export frame screenshots
      const screenshots: { [key: string]: string } = {};
      for (const frame of frames) {
        try {
          // Export as PNG with 2x scale for better quality
          const imageBytes = await frame.exportAsync({
            format: 'PNG',
            constraint: { type: 'SCALE', value: 2 }
          });
          
          // Convert to base64
          const base64 = figma.base64Encode(imageBytes);
          screenshots[frame.id] = `data:image/png;base64,${base64}`;
        } catch (err) {
          console.error(`Failed to export frame ${frame.name}:`, err);
        }
      }

      // Send design system for review/editing (Step 1)
      const sanitizedData = JSON.parse(JSON.stringify({
        frames: processedFrames,
        designSystem: designSystem,
        screenshots: screenshots,
        count: frames.length
      }, (key, value) => {
        if (typeof value === 'symbol') return 'MIXED';
        return value;
      }));

      figma.ui.postMessage({ 
        type: 'design-system-extracted', 
        data: sanitizedData
      });
    } catch (error) {
      figma.ui.postMessage({ 
        type: 'error', 
        message: `Error processing frames: ${error instanceof Error ? error.message : String(error)}` 
      });
    }
  }

  if (msg.type === 'generate-prompt') {
    // Step 2: Generate prompt with edited design system
    try {
      const { frames, designSystem, screenshots, sections } = msg.data;
      
      // Compile into single unified prompt with optional sections
      const unifiedPrompt = compileUnifiedPrompt(frames, designSystem, sections || {});

      const sanitizedData = JSON.parse(JSON.stringify({
        frames: frames,
        designSystem: designSystem,
        prompt: unifiedPrompt,
        screenshots: screenshots,
        count: frames.length
      }, (key, value) => {
        if (typeof value === 'symbol') return 'MIXED';
        return value;
      }));

      figma.ui.postMessage({ 
        type: 'prompt-generated', 
        data: sanitizedData
      });
    } catch (error) {
      figma.ui.postMessage({ 
        type: 'error', 
        message: `Error generating prompt: ${error instanceof Error ? error.message : String(error)}` 
      });
    }
  }

  if (msg.type === 'cancel') {
    figma.closePlugin();
  }
};
