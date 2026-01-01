// This file handles prompt compilation logic

import type { ProcessedFrame, DesignSystem } from './types';

interface PromptSections {
  includeLayout?: boolean;
  includeComponents?: boolean;
  includeVisualTheme?: boolean;
  includeResponsive?: boolean;
  includeAccessibility?: boolean;
  includeContent?: boolean;
  includeConsistency?: boolean;
}

/**
 * Compile all frames with design system and flow into a single comprehensive prompt
 * Optimized for v0.dev and other AI code generation tools
 */
export function compileUnifiedPrompt(
  frames: ProcessedFrame[], 
  designSystem: DesignSystem, 
  promptSections: PromptSections = {}
): string {
  // Default all sections to true if not specified
  const sections = {
    includeLayout: promptSections.includeLayout ?? true,
    includeComponents: promptSections.includeComponents ?? true,
    includeVisualTheme: promptSections.includeVisualTheme ?? true,
    includeResponsive: promptSections.includeResponsive ?? true,
    includeAccessibility: promptSections.includeAccessibility ?? true,
    includeContent: promptSections.includeContent ?? true,
    includeConsistency: promptSections.includeConsistency ?? true
  };
  
  const output: string[] = [];
  
  // Critical Instructions for AI
  output.push('IMPORTANT INSTRUCTIONS:');
  output.push('- Only implement the elements explicitly described in this specification');
  output.push('- Do NOT add features, components, or functionality not mentioned');
  output.push('- Do NOT make assumptions about missing information');
  output.push('- Use ONLY the design tokens (colors, fonts, spacing) provided below');
  output.push('- Follow the exact user flow and screen sequence specified');
  output.push('');
  output.push('───────────────────────────────────────────────────────────────');
  output.push('');
  
  // Header
  output.push('APPLICATION DESIGN SPECIFICATION');
  output.push('');
  output.push(`Total Screens: ${frames.length}`);
  output.push('Source: Figma Design File');
  output.push('');
  output.push('───────────────────────────────────────────────────────────────');
  output.push('');
  
  // Design System
  output.push('DESIGN SYSTEM');
  output.push('');
  
  output.push('Typography:');
  if (designSystem.typography && designSystem.typography.fontFamilies && designSystem.typography.fontFamilies.length > 0) {
    output.push(`  Font Families: ${designSystem.typography.fontFamilies.join(', ')}`);
  }
  if (designSystem.typography && designSystem.typography.fontSizes && designSystem.typography.fontSizes.length > 0) {
    output.push(`  Font Sizes: ${designSystem.typography.fontSizes.join('px, ')}px`);
  }
  if (designSystem.typography && designSystem.typography.fontWeights && designSystem.typography.fontWeights.length > 0) {
    output.push(`  Font Weights: ${designSystem.typography.fontWeights.join(', ')}`);
  }
  if (designSystem.typography && designSystem.typography.lineHeights && designSystem.typography.lineHeights.length > 0) {
    output.push(`  Line Heights: ${designSystem.typography.lineHeights.slice(0, 8).join('px, ')}px`);
  }
  output.push('');
  
  output.push('Color Palette:');
  if (designSystem.colorRoles && Object.keys(designSystem.colorRoles).length > 0) {
    output.push('  Semantic Colors:');
    if (designSystem.colorRoles.primary) output.push(`    Primary: ${designSystem.colorRoles.primary}`);
    if (designSystem.colorRoles.secondary) output.push(`    Secondary: ${designSystem.colorRoles.secondary}`);
    if (designSystem.colorRoles.background) output.push(`    Background: ${designSystem.colorRoles.background}`);
    if (designSystem.colorRoles.text) output.push(`    Text: ${designSystem.colorRoles.text}`);
    if (designSystem.colorRoles.border) output.push(`    Border: ${designSystem.colorRoles.border}`);
    output.push('');
  }
  if (designSystem.colors && designSystem.colors.length > 0) {
    output.push('  All Colors:');
    designSystem.colors.slice(0, 8).forEach(color => {
      output.push(`    ${color}`);
    });
    if (designSystem.colors.length > 8) {
      output.push('  Additional Colors:');
      designSystem.colors.slice(8, 15).forEach(color => {
        output.push(`    ${color}`);
      });
    }
    if (designSystem.colors.length > 15) {
      output.push(`  ... and ${designSystem.colors.length - 15} more colors`);
    }
  }
  output.push('');
  
  output.push('Border Radius:');
  if (designSystem.borderRadius && designSystem.borderRadius.length > 0) {
    output.push(`  Values: ${designSystem.borderRadius.join('px, ')}px`);
    output.push(`  Suggestion: Use ${designSystem.borderRadius[0]}px for subtle rounding, ${designSystem.borderRadius[Math.floor(designSystem.borderRadius.length / 2)] || designSystem.borderRadius[0]}px for prominent elements`);
  } else {
    output.push('  No rounded corners detected (use square corners)');
  }
  output.push('');
  
  output.push('Elevation/Shadows:');
  if (designSystem.shadows && designSystem.shadows.length > 0) {
    designSystem.shadows.slice(0, 3).forEach((shadow, idx) => {
      output.push(`  Level ${idx + 1}: box-shadow: ${shadow}`);
    });
  } else {
    output.push('  No shadows detected (flat design)');
  }
  output.push('');
  output.push('');
  
  output.push('Spacing Scale:');
  if (designSystem.spacing && designSystem.spacing.length > 0) {
    const uniqueSpacing = designSystem.spacing.filter(s => s > 0).sort((a, b) => a - b);
    output.push(`  Values: ${uniqueSpacing.slice(0, 20).join('px, ')}px`);
    if (uniqueSpacing.length > 20) {
      output.push(`  ... and ${uniqueSpacing.length - 20} more values`);
    }
  }
  output.push('');  
  // Design consistency warnings
  if (sections.includeConsistency && designSystem.consistencyWarnings && designSystem.consistencyWarnings.length > 0) {
    output.push('DESIGN CONSISTENCY NOTES:');
    designSystem.consistencyWarnings.forEach(warning => {
      output.push(`  ${warning.type}: ${warning.message}`);
      if (warning.examples) {
        warning.examples.forEach((ex: any) => {
          output.push(`    - ${ex.color1} and ${ex.color2} are ${ex.similarity} similar`);
        });
      }
    });
    output.push('');
  }
    output.push('───────────────────────────────────────────────────────────────');
  output.push('');
  
  // User Flow
  output.push('USER FLOW');
  output.push('');
  
  frames.forEach((frame, index) => {
    const arrow = index < frames.length - 1 ? ' → ' : '';
    output.push(`${index + 1}. ${frame.name} (${getPurposeDescription(frame.purpose)})${arrow}`);
  });
  output.push('');
  output.push('───────────────────────────────────────────────────────────────');
  output.push('');
  
  // Detailed Screen Descriptions
  output.push('SCREEN SPECIFICATIONS');
  output.push('');
  
  frames.forEach((frame, index) => {
    output.push(`Screen ${index + 1}: ${frame.name}`);
    output.push('');
    
    // Purpose
    const purposeDescription = getPurposeDescription(frame.purpose);
    output.push(`Purpose: ${purposeDescription}`);
    output.push('');
    
    // Layout
    const layoutType = frame.layoutMode === 'HORIZONTAL' ? 'Horizontal (Row)' : 
                       frame.layoutMode === 'VERTICAL' ? 'Vertical (Column)' : 
                       'Custom/Absolute';
    output.push(`Layout: ${layoutType}`);
    output.push(`Dimensions: ${Math.round(frame.width)}×${Math.round(frame.height)}px`);
    output.push('');
    
    // Layout Structure
    if (sections.includeLayout && frame.layoutStructure) {
      output.push('Structure & Layout:');
      
      // Get common spacing
      const commonSpacing = (designSystem.spacing && designSystem.spacing.length > 0) 
        ? designSystem.spacing.filter(s => s >= 8 && s <= 48).sort((a, b) => a - b)
        : [];
      const suggestedPadding = commonSpacing[Math.floor(commonSpacing.length * 0.3)] || 16;
      const suggestedGap = commonSpacing[Math.floor(commonSpacing.length * 0.2)] || 12;
      
      output.push(`  Recommended spacing: ${suggestedPadding}px padding, ${suggestedGap}px gap between elements`);
      output.push('');
      
      // Top region
      if (frame.layoutStructure.regions && frame.layoutStructure.regions.top && frame.layoutStructure.regions.top.length > 0) {
        output.push('  TOP AREA (header/navigation):');
        frame.layoutStructure.regions.top.forEach((item: any) => {
          const details = [
            item.fullWidth ? 'full-width' : `${item.width}px wide`,
            item.centered ? 'horizontally centered' : 'left-aligned',
            item.layout ? item.layout.toLowerCase() + ' layout' : null,
            item.positioning === 'absolute' ? 'fixed positioning' : null,
          ].filter(Boolean).join(', ');
          output.push(`    - ${item.name} (${details})`);
        });
      }
      
      // Middle region
      if (frame.layoutStructure.regions && frame.layoutStructure.regions.middle && frame.layoutStructure.regions.middle.length > 0) {
        output.push('  MAIN CONTENT (body):');
        frame.layoutStructure.regions.middle.forEach((item: any) => {
          const details = [
            item.fullWidth ? 'full-width' : `${item.width}px wide`,
            item.centered ? 'horizontally centered' : 'left-aligned',
            item.layout ? item.layout.toLowerCase() + ' layout' : null,
          ].filter(Boolean).join(', ');
          output.push(`    - ${item.name} (${details})`);
        });
      }
      
      // Bottom region
      if (frame.layoutStructure.regions && frame.layoutStructure.regions.bottom && frame.layoutStructure.regions.bottom.length > 0) {
        output.push('  BOTTOM AREA (footer/actions):');
        frame.layoutStructure.regions.bottom.forEach((item: any) => {
          const details = [
            item.fullWidth ? 'full-width' : `${item.width}px wide`,
            item.centered ? 'horizontally centered' : 'left-aligned',
            item.layout ? item.layout.toLowerCase() + ' layout' : null,
            item.positioning === 'absolute' ? 'fixed positioning' : null,
          ].filter(Boolean).join(', ');
          output.push(`    - ${item.name} (${details})`);
        });
      }
      
      output.push('');
    }
    
    // Visual theme
    if (sections.includeVisualTheme && frame.visualTheme && frame.visualTheme.maxContentWidth) {
      output.push(`Content Container:`);
      output.push(`  Max width: ${frame.visualTheme.maxContentWidth}px (content should be centered within this width)`);
      output.push('');
    }
    
    output.push(`Reference Dimensions: ${Math.round(frame.width)}×${Math.round(frame.height)}px`);
    output.push('');
    
    // Component patterns
    if (sections.includeComponents && frame.componentPatterns && Array.isArray(frame.componentPatterns) && frame.componentPatterns.length > 0) {
      const repeatableComponents = frame.componentPatterns.filter((p: any) => p.count && p.count > 1);
      const structuralComponents = frame.componentPatterns.filter((p: any) => !p.count || p.count === 1);
      
      if (structuralComponents.length > 0) {
        output.push(`Structural Components:`);
        structuralComponents.forEach((pattern: any) => {
          output.push(`  - ${pattern.type}: "${pattern.name}"`);
        });
        output.push('');
      }
      
      if (repeatableComponents.length > 0) {
        output.push(`Repeatable Components (create as reusable components):`);
        repeatableComponents.forEach((pattern: any) => {
          output.push(`  - "${pattern.name}" appears ${pattern.count}× - ${pattern.suggestion}`);
        });
        output.push('');
      }
    }
    
    // Content organization
    const summary = frame.contentSummary;
    if (summary && (summary.sections?.length > 0 || summary.headings?.length > 0 || summary.keyText?.length > 0)) {
      output.push(`Content Structure:`);
      
      if (summary.sections && summary.sections.length > 0) {
        output.push(`  Major Sections:`);
        summary.sections.forEach((section: string) => {
          output.push(`    - ${section}`);
        });
      }
      
      if (summary.headings && summary.headings.length > 0) {
        output.push(`  Headings:`);
        const sortedSizes = (designSystem.typography && designSystem.typography.fontSizes && designSystem.typography.fontSizes.length > 0)
          ? designSystem.typography.fontSizes.slice().sort((a, b) => b - a)
          : [24, 20, 16];
        summary.headings.forEach((heading: string, idx: number) => {
          const suggestedSize = sortedSizes[Math.min(idx, sortedSizes.length - 1)];
          output.push(`    - "${heading}" (use ${suggestedSize}px)`);
        });
      }
      
      if (summary.keyText && summary.keyText.length > 0) {
        const relevantText = summary.keyText.filter((t: string) => t.length > 10 && !t.includes('⌘'));
        if (relevantText.length > 0) {
          output.push(`  Text Content:`);
          relevantText.slice(0, 4).forEach((text: string) => {
            output.push(`    - "${text}"`);
          });
        }
      }
      output.push('');
    }
    
    // Interactive Elements
    if (frame.interactions && Array.isArray(frame.interactions) && frame.interactions.length > 0) {
      output.push(`Interactive Elements:`);
      
      // Group by type for better organization
      const buttons = frame.interactions.filter(i => i.type === 'Button' || i.type === 'Icon Button');
      const inputs = frame.interactions.filter(i => i.type === 'Input Field');
      const links = frame.interactions.filter(i => i.type === 'Link');
      const toggles = frame.interactions.filter(i => i.type === 'Toggle');
      const others = frame.interactions.filter(i => 
        !['Button', 'Icon Button', 'Input Field', 'Link', 'Toggle'].includes(i.type)
      );
      
      if (buttons.length > 0) {
        output.push('  Buttons:');
        buttons.forEach((btn) => {
          output.push(`    - ${btn.description}`);
        });
      }
      
      if (inputs.length > 0) {
        output.push('  Input Fields:');
        inputs.forEach((inp) => {
          output.push(`    - ${inp.description}`);
        });
      }
      
      if (links.length > 0) {
        output.push('  Links:');
        links.forEach((link) => {
          output.push(`    - ${link.description}`);
        });
      }
      
      if (toggles.length > 0) {
        output.push('  Toggles/Controls:');
        toggles.forEach((toggle) => {
          output.push(`    - ${toggle.description}`);
        });
      }
      
      if (others.length > 0) {
        output.push('  Other Interactive:');
        others.forEach((other) => {
          output.push(`    - ${other.description}`);
        });
      }
      
      output.push('');
    }
    
    // Navigation hints
    if (index < frames.length - 1) {
      const nextFrame = frames[index + 1];
      const primaryAction = frame.interactions.find(int => 
        int.type === 'button' && (int.label?.toLowerCase().includes('next') || 
                                  int.label?.toLowerCase().includes('continue') ||
                                  int.label?.toLowerCase().includes('submit') ||
                                  int.label?.toLowerCase().includes('send') ||
                                  int.label?.toLowerCase().includes('sign') ||
                                  int.label?.toLowerCase().includes('login'))
      );
      
      output.push(`Navigation:`);
      if (primaryAction) {
        output.push(`  "${primaryAction.label || primaryAction.nodeName}" navigates to "${nextFrame.name}"`);
      } else {
        output.push(`  This screen leads to "${nextFrame.name}"`);
      }
      output.push('');
    }
    
    // Responsive hints
    if (sections.includeResponsive && frame.responsiveHints) {
      output.push('Responsive Behavior:');
      output.push(`  Target: ${frame.responsiveHints.breakpointSuggestion}`);
      
      if (frame.responsiveHints.stackingRecommendations && frame.responsiveHints.stackingRecommendations.length > 0) {
        output.push('  Layout Adjustments:');
        frame.responsiveHints.stackingRecommendations.forEach((rec: any) => {
          output.push(`    - ${rec.name}: ${rec.suggestion}`);
        });
      }
      
      if (frame.responsiveHints.fluidElements && frame.responsiveHints.fluidElements.length > 0) {
        output.push('  Fluid Elements:');
        frame.responsiveHints.fluidElements.forEach((el: any) => {
          output.push(`    - ${el.name}: ${el.suggestion}`);
        });
      }
      
      output.push('');
    }
    
    // Accessibility issues
    if (sections.includeAccessibility && frame.accessibilityIssues && frame.accessibilityIssues.length > 0) {
      output.push('Accessibility Guidelines:');
      frame.accessibilityIssues.forEach((issue: any) => {
        const prefix = issue.type === 'warning' ? '⚠️' : 'ℹ️';
        output.push(`  ${prefix} ${issue.category}: ${issue.message}`);
        if (issue.elements && issue.elements.length > 0) {
          output.push(`     Affected: ${issue.elements.slice(0, 3).join(', ')}`);
        }
      });
      output.push('');
    }
    
    // Content guidelines
    if (sections.includeContent && frame.contentGuidelines) {
      const hasPlaceholder = frame.contentGuidelines.placeholderContent && frame.contentGuidelines.placeholderContent.length > 0;
      const hasDynamic = frame.contentGuidelines.dynamicContent && frame.contentGuidelines.dynamicContent.length > 0;
      const hasLimits = frame.contentGuidelines.characterLimits && frame.contentGuidelines.characterLimits.length > 0;
      
      if (hasPlaceholder) {
        output.push('Content Notes:');
        output.push(`  Placeholder content detected: ${frame.contentGuidelines.placeholderContent.length} items`);
        output.push('  Replace with actual copy before production');
      }
      
      if (hasDynamic) {
        if (!hasPlaceholder) output.push('Content Notes:');
        output.push('  Dynamic Content:');
        frame.contentGuidelines.dynamicContent.forEach((item: any) => {
          output.push(`    - ${item.section}: ${item.suggestion}`);
        });
      }
      
      if (hasLimits) {
        if (!hasPlaceholder && !hasDynamic) output.push('Content Notes:');
        output.push('  Text Truncation:');
        frame.contentGuidelines.characterLimits.slice(0, 2).forEach((item: any) => {
          output.push(`    - "${item.text}" (${item.length} chars): ${item.suggestion}`);
        });
      }
      
      if (hasPlaceholder || hasDynamic || hasLimits) {
        output.push('');
      }
    }
    
    output.push('───────────────────────────────────────────────────────────────');
    output.push('');
  });
  
  // Implementation Guidelines
  output.push('IMPLEMENTATION REQUIREMENTS');
  output.push('');
  
  output.push('Design System Constraints:');
  output.push('  - Use ONLY the typography values specified above');
  output.push('  - Use ONLY the colors listed in the palette');
  output.push('  - Use ONLY the spacing values provided');
  output.push('  - Do NOT introduce new fonts, colors, or spacing values');
  output.push('  - Maintain consistent visual hierarchy across all screens');
  output.push('');
  
  output.push('Visual States:');
  output.push('  - Buttons should have hover states (slightly darker/lighter)');
  output.push('  - Active/pressed states should be visually distinct');
  output.push('  - Disabled states should use reduced opacity (40-50%)');
  output.push('  - Focus states should have visible outline for accessibility');
  output.push('');
  
  output.push('Spacing & Layout:');
  output.push('  - Use the spacing values provided in the design system');
  output.push('  - Maintain consistent padding within similar components');
  output.push('  - Use smaller spacing (8-12px) for related elements');
  output.push('  - Use larger spacing (24-48px) to separate sections');
  output.push('  - Elements should align to a consistent grid');
  output.push('');
  
  output.push('Responsive Behavior:');
  output.push('  - Reference dimensions are guidelines, not absolute requirements');
  output.push('  - Adapt layouts appropriately for different screen sizes');
  output.push('  - Maintain relative spacing and proportions');
  output.push('  - Ensure touch-friendly targets on mobile (min 44x44px)');
  output.push('');
  
  output.push('Functional Behavior:');
  output.push('  - Implement ONLY the interactive elements explicitly listed for each screen');
  output.push('  - Connect screens according to the navigation flow specified');
  output.push('  - Do NOT add buttons, links, or interactions not mentioned');
  output.push('  - Add appropriate loading and error states where needed');
  output.push('  - Include form validation for any input fields');
  output.push('');
  
  output.push('Accessibility:');
  output.push('  - Use semantic HTML elements');
  output.push('  - Ensure WCAG AA color contrast (4.5:1 minimum)');
  output.push('  - Support keyboard navigation');
  output.push('  - Include appropriate ARIA labels');
  output.push('');
  output.push('───────────────────────────────────────────────────────────────');
  output.push('');
  output.push('REMINDER: Implement ONLY what is explicitly specified above.');
  output.push('Do not add features, content, or design elements not mentioned.');
  
  return output.join('\n');
}

function getPurposeDescription(purpose: string): string {
  const descriptions: { [key: string]: string } = {
    'authentication': 'User login and authentication',
    'registration': 'New user account creation',
    'onboarding': 'Initial user onboarding experience',
    'main-screen': 'Primary application screen/dashboard',
    'profile': 'User profile management',
    'settings': 'Application settings and preferences',
    'list-view': 'List or grid view of items',
    'detail-view': 'Detailed view of a single item',
    'checkout': 'Payment and checkout process',
    'confirmation': 'Success or confirmation screen',
    'screen': 'Application screen',
  };
  
  return descriptions[purpose] || 'Application screen';
}
