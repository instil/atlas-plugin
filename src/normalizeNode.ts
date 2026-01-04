// This file handles node normalization

import type { ProcessedFrame, NormalizedNode, DesignSystem } from './types';

/**
 * Safely serialize Figma objects by converting symbols and functions to safe values
 * This prevents serialization errors when passing data to the UI
 * 
 * @param value - Any value to serialize
 * @returns Serialized version safe for JSON stringification
 */
function safeSerialize(value: any): any {
  if (value === null || value === undefined) return null;
  if (typeof value === 'symbol') return 'MIXED';
  if (typeof value === 'function') return 'FUNCTION';
  
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.map(v => safeSerialize(v));
    }
    
    const result: any = {};
    for (const key in value) {
      try {
        const val = value[key];
        if (typeof val !== 'function' && typeof val !== 'symbol') {
          result[key] = safeSerialize(val);
        }
      } catch (e) {}
    }
    return result;
  }
  
  return value;
}

/**
 * Extract design system from all frames
 */
export function extractDesignSystem(frames: FrameNode[]): DesignSystem {
  const fontSizes = new Set<number>();
  const fontFamilies = new Set<string>();
  const fontWeights = new Set<string>();
  const lineHeights = new Set<number>();
  const colors = new Set<string>();
  const spacingValues = new Set<number>();
  const borderRadiusValues = new Set<number>();
  const shadows = new Set<string>();
  const colorUsage: { [key: string]: number } = {};
  
  frames.forEach(frame => {
    collectDesignTokens(frame, { 
      fontSizes, 
      fontFamilies, 
      fontWeights, 
      lineHeights,
      colors, 
      spacingValues, 
      borderRadiusValues, 
      shadows,
      colorUsage 
    });
  });
  
  // Determine color roles based on frequency and context
  // This helps identify primary, secondary, background, and text colors
  const colorEntries = Object.entries(colorUsage).sort((a, b) => b[1] - a[1]);
  const colorRoles: any = {};
  
  if (colorEntries.length > 0) {
    // Most used color is likely primary or background
    const topColor = colorEntries[0][0];
    
    // Light colors are typically backgrounds, dark colors are typically primary/accent
    if (isLightColor(topColor)) {
      colorRoles.background = topColor;
      // Find a dark color for text (good contrast with light background)
      const darkColor = colorEntries.find(([c]) => !isLightColor(c));
      if (darkColor) colorRoles.text = darkColor[0];
    } else {
      colorRoles.primary = topColor;
    }
    
    // Second most common might be accent/secondary
    if (colorEntries.length > 1) {
      colorRoles.secondary = colorEntries[1][0];
    }
  }
  
  // Check design consistency
  const consistencyWarnings = checkDesignConsistency({
    fontSizes: Array.from(fontSizes),
    colors: Array.from(colors),
    spacing: Array.from(spacingValues),
  });
  
  return {
    typography: {
      fontFamilies: Array.from(fontFamilies),
      fontSizes: Array.from(fontSizes).sort((a, b) => a - b),
      fontWeights: Array.from(fontWeights),
      lineHeights: Array.from(lineHeights).sort((a, b) => a - b),
    },
    colors: Array.from(colors),
    spacing: Array.from(spacingValues).sort((a, b) => a - b),
    borderRadius: Array.from(borderRadiusValues).filter(v => v > 0).sort((a, b) => a - b),
    shadows: Array.from(shadows),
    colorRoles,
    consistencyWarnings,
  };
}

/**
 * Check for design consistency issues
 */
function checkDesignConsistency(tokens: any): any[] {
  const warnings: any[] = [];
  
  // Check for similar but different colors
  const colors = tokens.colors;
  const similarColors: any[] = [];
  
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      const similarity = colorSimilarity(colors[i], colors[j]);
      if (similarity > 0.85 && similarity < 1.0) {
        similarColors.push({
          color1: colors[i],
          color2: colors[j],
          similarity: Math.round(similarity * 100) + '%'
        });
      }
    }
  }
  
  if (similarColors.length > 0) {
    warnings.push({
      type: 'Colors',
      message: `Found ${similarColors.length} pairs of similar colors that could be consolidated`,
      examples: similarColors.slice(0, 3)
    });
  }
  
  // Check for font size gaps
  const fontSizes = tokens.fontSizes.sort((a: number, b: number) => a - b);
  const gaps: any[] = [];
  
  for (let i = 1; i < fontSizes.length; i++) {
    const gap = fontSizes[i] - fontSizes[i - 1];
    if (gap > 8) {
      gaps.push({
        from: fontSizes[i - 1],
        to: fontSizes[i],
        gap: gap
      });
    }
  }
  
  if (gaps.length > 0) {
    warnings.push({
      type: 'Typography',
      message: `Large gaps in font size scale may break visual hierarchy`,
      gaps: gaps
    });
  }
  
  // Check for inconsistent spacing
  const spacing = tokens.spacing.filter((s: number) => s > 0);
  if (spacing.length > 15) {
    warnings.push({
      type: 'Spacing',
      message: `${spacing.length} different spacing values detected. Consider using a more limited scale (8-12 values)`
    });
  }
  
  return warnings;
}

/**
 * Calculate color similarity using RGB distance
 * Returns a value between 0 (completely different) and 1 (identical)
 * Used to detect near-duplicate colors that could be consolidated
 * 
 * @param hex1 - First color in hex format (#RRGGBB)
 * @param hex2 - Second color in hex format (#RRGGBB)
 * @returns Similarity score from 0-1
 */
function colorSimilarity(hex1: string, hex2: string): number {
  const r1 = parseInt(hex1.slice(1, 3), 16);
  const g1 = parseInt(hex1.slice(3, 5), 16);
  const b1 = parseInt(hex1.slice(5, 7), 16);
  
  const r2 = parseInt(hex2.slice(1, 3), 16);
  const g2 = parseInt(hex2.slice(3, 5), 16);
  const b2 = parseInt(hex2.slice(5, 7), 16);
  
  const rDiff = Math.abs(r1 - r2) / 255;
  const gDiff = Math.abs(g1 - g2) / 255;
  const bDiff = Math.abs(b1 - b2) / 255;
  
  return 1 - (rDiff + gDiff + bDiff) / 3;
}

/**
 * Determine if a color is light or dark using perceived luminance
 * Uses the standard luminance formula: 0.299*R + 0.587*G + 0.114*B
 * Threshold of 0.7 (70%) classifies as light
 * 
 * @param hex - Color in hex format (#RRGGBB)
 * @returns true if color is light, false if dark
 */
function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.7;
}

/**
 * Recursively traverse node tree and collect all design tokens
 * Extracts: typography, colors, spacing, borders, shadows, effects
 * Also tracks color usage frequency for semantic role detection
 * 
 * @param node - The Figma node to traverse
 * @param tokens - Object containing Sets to collect tokens into
 */
function collectDesignTokens(node: SceneNode, tokens: any) {
  // Extract text properties
  if (node.type === 'TEXT') {
    const textNode = node as TextNode;
    if (typeof textNode.fontSize === 'number') {
      tokens.fontSizes.add(textNode.fontSize);
    }
    if (typeof textNode.fontName === 'object' && textNode.fontName.family) {
      tokens.fontFamilies.add(textNode.fontName.family);
      tokens.fontWeights.add(textNode.fontName.style);
    }
    if (typeof textNode.lineHeight === 'object' && textNode.lineHeight.unit === 'PIXELS') {
      tokens.lineHeights.add(textNode.lineHeight.value);
    }
  }
  
  // Extract spacing from auto layout
  if ('layoutMode' in node && (node as any).layoutMode !== 'NONE') {
    const frameNode = node as FrameNode;
    tokens.spacingValues.add(frameNode.itemSpacing);
    tokens.spacingValues.add(frameNode.paddingTop);
    tokens.spacingValues.add(frameNode.paddingRight);
    tokens.spacingValues.add(frameNode.paddingBottom);
    tokens.spacingValues.add(frameNode.paddingLeft);
  }
  
  // Extract border radius
  if ('cornerRadius' in node && typeof (node as any).cornerRadius === 'number') {
    tokens.borderRadiusValues.add((node as any).cornerRadius);
  }
  
  // Extract shadows/effects
  if ('effects' in node) {
    const effects = (node as any).effects;
    if (Array.isArray(effects)) {
      effects.forEach((effect: any) => {
        if (effect.visible && effect.type === 'DROP_SHADOW') {
          const shadowStr = `${effect.offset.x}px ${effect.offset.y}px ${effect.radius}px ${rgbToHex(effect.color)}`;
          tokens.shadows.add(shadowStr);
        }
      });
    }
  }
  
  // Extract colors from fills and track usage
  if ('fills' in node) {
    const fills = (node as any).fills;
    if (Array.isArray(fills)) {
      fills.forEach((fill: any) => {
        if (fill.type === 'SOLID' && fill.color) {
          const hex = rgbToHex(fill.color);
          tokens.colors.add(hex);
          tokens.colorUsage[hex] = (tokens.colorUsage[hex] || 0) + 1;
        }
      });
    }
  }
  
  // Recurse through children
  if ('children' in node) {
    (node as any).children.forEach((child: SceneNode) => collectDesignTokens(child, tokens));
  }
}

/**
 * Convert Figma RGB color object (0-1 range) to hex string
 * Figma uses 0-1 range, we convert to 0-255 and then to hex
 * 
 * @param color - Figma RGB color object with r, g, b properties (0-1 range)
 * @returns Hex color string (#RRGGBB)
 */
function rgbToHex(color: RGB): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Normalize a FRAME node - simplified for flow context
 */
export function normalizeFrame(frame: FrameNode): ProcessedFrame {
  const interactions = detectInteractions(frame);
  const screenPurpose = inferScreenPurpose(frame);
  const contentSummary = extractContentSummary(frame);
  const layoutStructure = analyzeLayoutStructure(frame);
  const componentPatterns = detectComponentPatterns(frame);
  const visualTheme = extractVisualTheme(frame);
  const responsiveHints = generateResponsiveHints(frame);
  const accessibilityIssues = checkAccessibility(frame, contentSummary, interactions);
  const contentGuidelines = analyzeContent(frame, contentSummary);
  
  return {
    id: frame.id,
    name: frame.name,
    width: frame.width,
    height: frame.height,
    purpose: screenPurpose,
    interactions: interactions,
    layoutMode: safeSerialize(frame.layoutMode),
    contentSummary: contentSummary,
    layoutStructure: layoutStructure,
    componentPatterns: componentPatterns,
    visualTheme: visualTheme,
    responsiveHints: responsiveHints,
    accessibilityIssues: accessibilityIssues,
    contentGuidelines: contentGuidelines,
  };
}

/**
 * Generate responsive design hints based on layout
 */
function generateResponsiveHints(frame: FrameNode): any {
  const hints: any = {
    breakpointSuggestion: null,
    stackingRecommendations: [],
    fluidElements: [],
    fixedElements: [],
  };
  
  // Infer device type from width
  if (frame.width <= 375) {
    hints.breakpointSuggestion = 'Mobile (small)';
  } else if (frame.width <= 768) {
    hints.breakpointSuggestion = 'Mobile/Tablet';
  } else if (frame.width <= 1024) {
    hints.breakpointSuggestion = 'Tablet/Small Desktop';
  } else {
    hints.breakpointSuggestion = 'Desktop';
  }
  
  // Analyze layout for responsive behavior
  frame.children.forEach((child: SceneNode) => {
    if ('width' in child && 'layoutMode' in child) {
      const childWidth = (child as any).width;
      const widthRatio = childWidth / frame.width;
      
      // Full-width elements are fluid
      if (widthRatio > 0.9) {
        hints.fluidElements.push({
          name: child.name,
          suggestion: 'Should remain full-width on all screen sizes'
        });
      } 
      // Narrow elements might be fixed
      else if (childWidth < 300) {
        hints.fixedElements.push({
          name: child.name,
          width: Math.round(childWidth),
          suggestion: 'Consider fixed width or min-width'
        });
      }
      
      // Horizontal layouts should stack on mobile
      if ((child as any).layoutMode === 'HORIZONTAL') {
        hints.stackingRecommendations.push({
          name: child.name,
          suggestion: 'Stack vertically on mobile/tablet (<768px)'
        });
      }
    }
  });
  
  return hints;
}

/**
 * Check accessibility issues
 */
function checkAccessibility(frame: FrameNode, contentSummary: any, interactions: any[]): any[] {
  const issues: any[] = [];
  
  // Check heading hierarchy
  const headings = contentSummary.headings || [];
  if (headings.length > 3) {
    issues.push({
      type: 'info',
      category: 'Heading Hierarchy',
      message: `Use proper heading levels (H1 → H2 → H3). Ensure only one H1 per page.`
    });
  }
  
  // Check touch target sizes
  const smallTargets = interactions.filter((int: any) => {
    return int.details && int.details.height && int.details.height < 44;
  });
  
  if (smallTargets.length > 0) {
    issues.push({
      type: 'warning',
      category: 'Touch Targets',
      message: `${smallTargets.length} interactive element(s) smaller than 44px height. Increase size for better mobile usability.`,
      elements: smallTargets.map((t: any) => t.details.name)
    });
  }
  
  // Check color contrast (simplified - would need actual text colors)
  issues.push({
    type: 'info',
    category: 'Color Contrast',
    message: 'Ensure text has 4.5:1 contrast ratio against backgrounds (WCAG AA standard)'
  });
  
  // Check for alt text reminder
  issues.push({
    type: 'info',
    category: 'Images',
    message: 'Add alt text for all images for screen reader accessibility'
  });
  
  return issues;
}

/**
 * Analyze content for guidelines
 */
function analyzeContent(frame: FrameNode, contentSummary: any): any {
  const guidelines: any = {
    placeholderContent: [],
    characterLimits: [],
    dynamicContent: [],
  };
  
  // Detect placeholder content
  const allText = [
    ...(contentSummary.headings || []),
    ...(contentSummary.keyText || []),
    ...(contentSummary.inputPlaceholders || [])
  ];
  
  allText.forEach((text: string) => {
    const textLower = text.toLowerCase();
    
    // Common placeholder patterns
    if (textLower.includes('lorem') || 
        textLower.includes('placeholder') || 
        textLower.includes('xxx') ||
        textLower.match(/^(title|heading|text|label|description)$/i)) {
      guidelines.placeholderContent.push(text);
    }
    
    // Suggest character limits for truncation
    if (text.length > 50) {
      guidelines.characterLimits.push({
        text: text.substring(0, 40) + '...',
        length: text.length,
        suggestion: 'Consider truncation with ellipsis if exceeds container width'
      });
    }
  });
  
  // Detect dynamic content indicators
  contentSummary.sections?.forEach((section: string) => {
    const sectionLower = section.toLowerCase();
    if (sectionLower.includes('list') || 
        sectionLower.includes('feed') || 
        sectionLower.includes('grid') ||
        sectionLower.includes('items')) {
      guidelines.dynamicContent.push({
        section: section,
        type: 'list/collection',
        suggestion: 'This content should be dynamically generated from data'
      });
    }
  });
  
  return guidelines;
}

/**
 * Detect reusable component patterns (cards, forms, nav bars)
 */
function detectComponentPatterns(frame: FrameNode): any[] {
  const patterns: any[] = [];
  const components = new Map<string, number>();
  
  // Find repeated component instances
  function traverse(node: SceneNode) {
    if (node.type === 'INSTANCE' || node.type === 'COMPONENT') {
      const name = node.name.toLowerCase();
      components.set(name, (components.get(name) || 0) + 1);
      
      // Detect common patterns
      if (name.includes('card')) {
        patterns.push({ type: 'Card', name: node.name, count: 1 });
      } else if (name.includes('nav') || name.includes('header')) {
        patterns.push({ type: 'Navigation', name: node.name });
      } else if (name.includes('form') || name.includes('input group')) {
        patterns.push({ type: 'Form Section', name: node.name });
      } else if (name.includes('modal') || name.includes('dialog')) {
        patterns.push({ type: 'Modal/Dialog', name: node.name });
      } else if (name.includes('list') || name.includes('item')) {
        patterns.push({ type: 'List Item', name: node.name });
      }
    }
    
    if ('children' in node) {
      (node as any).children.forEach(traverse);
    }
  }
  
  traverse(frame);
  
  // Find repeated patterns
  components.forEach((count, name) => {
    if (count > 1) {
      patterns.push({
        type: 'Repeated Component',
        name: name,
        count: count,
        suggestion: 'This should be a reusable component'
      });
    }
  });
  
  return patterns;
}

/**
 * Extract overall visual theme from frame
 */
function extractVisualTheme(frame: FrameNode): any {
  const theme: any = {
    maxContentWidth: null,
    commonBorderRadius: null,
    elevationLevels: [],
  };
  
  // Check for centered max-width content
  frame.children.forEach((child: SceneNode) => {
    if ('width' in child && 'x' in child) {
      const childWidth = (child as any).width;
      const childX = (child as any).x;
      const isCentered = Math.abs((childX + childWidth / 2) - (frame.width / 2)) < frame.width * 0.05;
      
      if (isCentered && childWidth < frame.width * 0.95) {
        if (!theme.maxContentWidth || childWidth > theme.maxContentWidth) {
          theme.maxContentWidth = Math.round(childWidth);
        }
      }
    }
  });
  
  return theme;
}

/**
 * Analyze layout structure and positioning
 */
function analyzeLayoutStructure(frame: FrameNode): any {
  const structure: any = {
    regions: {
      top: [],
      middle: [],
      bottom: [],
    },
    positioning: [],
    hierarchy: []
  };
  
  const frameHeight = frame.height;
  const frameWidth = frame.width;
  const topThreshold = frameHeight * 0.2;
  const bottomThreshold = frameHeight * 0.8;
  
  // Analyze direct children
  frame.children.forEach((child: SceneNode) => {
    if (child.type === 'FRAME' || child.type === 'COMPONENT' || child.type === 'INSTANCE') {
      const node = child as FrameNode;
      const yPos = node.y;
      const xPos = node.x;
      const isFullWidth = node.width > frameWidth * 0.9;
      const isCentered = Math.abs((xPos + node.width / 2) - (frameWidth / 2)) < frameWidth * 0.1;
      
      const regionInfo: any = {
        name: node.name,
        width: Math.round(node.width),
        height: Math.round(node.height),
        fullWidth: isFullWidth,
        centered: isCentered,
      };
      
      // Add layout mode if available
      if ('layoutMode' in node && node.layoutMode) {
        regionInfo.layout = node.layoutMode;
      }
      
      // Add positioning info
      if ('layoutPositioning' in node && node.layoutPositioning === 'ABSOLUTE') {
        regionInfo.positioning = 'absolute';
        structure.positioning.push({
          name: node.name,
          x: Math.round(xPos),
          y: Math.round(yPos),
        });
      }
      
      // Categorize by vertical region
      if (yPos < topThreshold) {
        structure.regions.top.push(regionInfo);
      } else if (yPos > bottomThreshold) {
        structure.regions.bottom.push(regionInfo);
      } else {
        structure.regions.middle.push(regionInfo);
      }
      
      // Build hierarchy
      if (node.children && node.children.length > 0) {
        structure.hierarchy.push({
          parent: node.name,
          childCount: node.children.length,
          layout: 'layoutMode' in node ? node.layoutMode : null,
        });
      }
    }
  });
  
  return structure;
}

/**
 * Infer screen purpose from frame name and content
 */
function inferScreenPurpose(frame: FrameNode): string {
  const nameLower = frame.name.toLowerCase();
  
  if (nameLower.includes('login') || nameLower.includes('sign in')) {
    return 'authentication';
  }
  if (nameLower.includes('signup') || nameLower.includes('register') || nameLower.includes('sign up')) {
    return 'registration';
  }
  if (nameLower.includes('onboard')) {
    return 'onboarding';
  }
  if (nameLower.includes('home') || nameLower.includes('dashboard') || nameLower.includes('main')) {
    return 'main-screen';
  }
  if (nameLower.includes('profile') || nameLower.includes('account')) {
    return 'profile';
  }
  if (nameLower.includes('settings') || nameLower.includes('preferences')) {
    return 'settings';
  }
  if (nameLower.includes('list') || nameLower.includes('browse')) {
    return 'list-view';
  }
  if (nameLower.includes('detail') || nameLower.includes('view')) {
    return 'detail-view';
  }
  if (nameLower.includes('checkout') || nameLower.includes('payment')) {
    return 'checkout';
  }
  if (nameLower.includes('success') || nameLower.includes('confirmation')) {
    return 'confirmation';
  }
  
  return 'screen';
}

/**
 * Extract content summary organized by component type
 */
function extractContentSummary(frame: FrameNode): any {
  const headings: string[] = [];
  const bodyText: string[] = [];
  const inputFields: string[] = [];
  const sections: string[] = [];
  
  function traverse(node: SceneNode, depth: number = 0) {
    const nameLower = node.name.toLowerCase();
    
    // Identify major sections/containers
    if (depth === 1 && 'children' in node && (node as any).children.length > 3) {
      sections.push(node.name);
    }
    
    // Extract text by apparent hierarchy
    if (node.type === 'TEXT') {
      const textNode = node as TextNode;
      const text = textNode.characters.trim();
      if (!text || text.length < 2) return; // Skip empty or single char
      
      const fontSize = typeof textNode.fontSize === 'number' ? textNode.fontSize : 16;
      
      // Categorize by size and name
      if (fontSize >= 24 || nameLower.includes('heading') || nameLower.includes('title')) {
        headings.push(text);
      } else if (nameLower.includes('input') || nameLower.includes('placeholder')) {
        inputFields.push(text);
      } else if (text.length > 5) { // Meaningful body text
        bodyText.push(text);
      }
    }
    
    // Recurse
    if ('children' in node) {
      (node as any).children.forEach((child: SceneNode) => traverse(child, depth + 1));
    }
  }
  
  traverse(frame);
  
  return {
    sections: [...new Set(sections)].slice(0, 5),
    headings: [...new Set(headings)].slice(0, 5),
    keyText: [...new Set(bodyText)].slice(0, 8),
    inputPlaceholders: [...new Set(inputFields)].slice(0, 5),
  };
}

export function normalizeNode(node: SceneNode): NormalizedNode {
  // Simplified - we don't need detailed node structure anymore
  return {
    id: node.id,
    name: node.name,
    type: node.type,
  };
}


/**
 * Detect interactive elements and potential navigation patterns
 */
/**
 * Detect interactive elements within a frame using heuristics
 * Identifies buttons, inputs, links, toggles, and icons based on:
 * - Node naming patterns ("button", "input", "link", etc.)
 * - Visual characteristics (fills, borders, sizing)
 * - Component instances
 * - Text content patterns
 * 
 * Limits recursion depth to avoid capturing nested UI noise
 * 
 * @param node - The Figma node to analyze
 * @returns Array of detected interactive elements with type and description
 */
function detectInteractions(node: SceneNode): any[] {
  const interactions: any[] = [];
  
  function getNodeDetails(n: SceneNode): any {
    const details: any = {
      name: n.name,
    };
    
    // Extract visual properties
    if ('fills' in n && Array.isArray((n as any).fills) && (n as any).fills.length > 0) {
      const fill = (n as any).fills[0];
      if (fill.type === 'SOLID' && fill.color) {
        details.backgroundColor = rgbToHex(fill.color);
        details.backgroundOpacity = fill.opacity !== undefined ? fill.opacity : 1;
      }
    }
    
    // Get dimensions if available
    if ('width' in n && 'height' in n) {
      details.width = Math.round((n as any).width);
      details.height = Math.round((n as any).height);
    }
    
    // Check for corner radius
    if ('cornerRadius' in n && (n as any).cornerRadius) {
      details.cornerRadius = (n as any).cornerRadius;
    }
    
    // Check for borders/strokes
    if ('strokes' in n && Array.isArray((n as any).strokes) && (n as any).strokes.length > 0) {
      const stroke = (n as any).strokes[0];
      if (stroke.type === 'SOLID' && stroke.color) {
        details.borderColor = rgbToHex(stroke.color);
        details.borderWidth = (n as any).strokeWeight || 1;
      }
    }
    
    // Check for shadows
    if ('effects' in n) {
      const effects = (n as any).effects;
      if (Array.isArray(effects)) {
        const shadow = effects.find((e: any) => e.visible && e.type === 'DROP_SHADOW');
        if (shadow) {
          details.shadow = `${shadow.offset.x}px ${shadow.offset.y}px ${shadow.radius}px`;
        }
      }
    }
    
    return details;
  }
  
  function traverse(n: SceneNode, depth: number = 0) {
    const nameLower = n.name.toLowerCase();
    
    // Categorize interactive elements
    const isButton = nameLower.includes('button') || nameLower.includes('btn') || 
                     nameLower.includes('cta') || nameLower.includes('action');
    const isInput = nameLower.includes('input') || nameLower.includes('field') || 
                    nameLower.includes('text field') || nameLower.includes('search');
    const isLink = nameLower.includes('link') || nameLower.includes('nav');
    const isIcon = nameLower.includes('icon') && depth < 3;
    const isToggle = nameLower.includes('toggle') || nameLower.includes('switch') || 
                     nameLower.includes('checkbox');
    
    // Detect component instances (often buttons/interactive elements)
    const isComponent = n.type === 'INSTANCE';
    
    if (isButton || isComponent || isInput || isLink || isIcon || isToggle) {
      const details = getNodeDetails(n);
      
      // Extract text content
      let textContent = '';
      let placeholder = '';
      
      if (n.type === 'TEXT') {
        textContent = (n as TextNode).characters.trim();
      } else if ('children' in n) {
        const textNodes = findTextNodes(n as any);
        if (textNodes.length > 0) {
          textContent = textNodes.map(t => t.characters.trim()).filter(t => t).join(' ');
        }
      }
      
      // Determine element type and create description
      let elementType = 'interactive element';
      let description = '';
      
      if (isButton) {
        elementType = 'Button';
        const style = details.cornerRadius ? `${details.cornerRadius}px radius` : 'square';
        const size = details.height ? (details.height > 50 ? 'large' : details.height > 35 ? 'medium' : 'small') : 'medium';
        description = `${size} button with ${style}`;
        if (details.backgroundColor) {
          description += `, bg: ${details.backgroundColor}`;
        }
        if (details.shadow) {
          description += `, elevated (shadow)`;
        }
        if (textContent) {
          description += ` - text: "${textContent}"`;
        }
      } else if (isInput) {
        elementType = 'Input Field';
        const width = details.width ? (details.width > 300 ? 'full-width' : 'standard') : 'standard';
        description = `${width} text input`;
        if (textContent) {
          placeholder = textContent;
          description += ` with placeholder "${textContent}"`;
        }
      } else if (isLink) {
        elementType = 'Link';
        description = textContent ? `"${textContent}"` : 'text link';
      } else if (isIcon) {
        elementType = 'Icon Button';
        description = `icon`;
        if (textContent) {
          description += ` (${textContent})`;
        }
      } else if (isToggle) {
        elementType = 'Toggle';
        description = textContent ? `toggle: "${textContent}"` : 'toggle control';
      } else if (isComponent) {
        elementType = 'Component';
        description = textContent || n.name;
      }
      
      interactions.push({
        type: elementType,
        description: description,
        label: textContent,
        details: details,
      });
    }
    
    // Recursively check children (but limit depth to avoid noise)
    if ('children' in n && depth < 4) {
      (n as any).children.forEach((child: SceneNode) => traverse(child, depth + 1));
    }
  }
  
  traverse(node, 0);
  return interactions;
}

/**
 * Find all text nodes recursively
 */
function findTextNodes(node: SceneNode): TextNode[] {
  const textNodes: TextNode[] = [];
  
  if (node.type === 'TEXT') {
    textNodes.push(node as TextNode);
  }
  
  if ('children' in node) {
    (node as any).children.forEach((child: SceneNode) => {
      textNodes.push(...findTextNodes(child));
    });
  }
  
  return textNodes;
}
