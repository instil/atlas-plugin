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
 * Compile all frames with design system into a flow-focused prompt
 * 
 * Strategy (Hybrid Approach):
 * 1. User Flow & Journey Phases (Primary Focus) - ASCII diagram + transitions
 * 2. Design Language (Condensed) - Core tokens applied across all screens
 * 3. Screen Details (Contextual) - Role in flow, transitions, key elements
 * 4. Implementation Notes - State management and navigation
 * 
 * Optimized for v0.dev and other AI code generation tools
 * Emphasizes relationships between screens and user journey over pixel-perfect details
 * 
 * @param frames - Processed frame data with layout, components, interactions
 * @param designSystem - Extracted design tokens (colors, typography, spacing, etc.)
 * @param promptSections - Optional sections to include/exclude for customization
 * @returns Formatted prompt string ready for AI tools (~40% more concise)
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
  output.push('IMPORTANT: Implement ONLY what is specified. Maintain design consistency across all screens.');
  output.push('Focus on the user flow and screen transitions as the primary implementation goal.');
  output.push('');
  output.push('═══════════════════════════════════════════════════════════════');
  output.push('USER FLOW & JOURNEY (Primary Focus)');
  output.push('═══════════════════════════════════════════════════════════════');
  output.push('');
  
  // ASCII Flow Diagram
  output.push('FLOW DIAGRAM:');
  output.push('');
  const flowLine = frames.map((f, i) => `[${i + 1}] ${f.name}`).join(' → ');
  output.push(flowLine);
  output.push('');
  
  // Journey Phases with Transitions
  output.push('JOURNEY PHASES:');
  output.push('');
  
  frames.forEach((frame, index) => {
    const phaseNumber = index + 1;
    const isFirst = index === 0;
    const isLast = index === frames.length - 1;
    const nextFrame = !isLast ? frames[index + 1] : null;
    
    output.push(`Phase ${phaseNumber}: ${frame.name}`);
    output.push(`  Role: ${getPurposeDescription(frame.purpose)}`);
    
    // Entry point
    if (isFirst) {
      output.push(`  Entry: Application start / Direct link`);
    } else {
      const prevFrame = frames[index - 1];
      output.push(`  Entry: From "${prevFrame.name}"`);
    }
    
    // Analyze interactions to infer progression logic
    const buttons = frame.interactions?.filter(i => 
      (i.type === 'Button' || i.type === 'Icon Button') && 
      i.label && !i.label.toLowerCase().includes('back')
    ) || [];
    
    const inputs = frame.interactions?.filter(i => i.type === 'Input Field') || [];
    const links = frame.interactions?.filter(i => i.type === 'Link') || [];
    
    // Determine primary progression action
    let progressionAction = null;
    let progressionType = 'unknown';
    
    // Priority 1: Look for form submission patterns
    if (inputs.length > 0) {
      const submitButton = buttons.find(b => 
        b.label && (
          b.label.toLowerCase().includes('submit') ||
          b.label.toLowerCase().includes('send') ||
          b.label.toLowerCase().includes('sign') ||
          b.label.toLowerCase().includes('login') ||
          b.label.toLowerCase().includes('register') ||
          b.label.toLowerCase().includes('continue') ||
          b.label.toLowerCase().includes('next') ||
          b.label.toLowerCase().includes('create') ||
          b.label.toLowerCase().includes('save')
        )
      );
      if (submitButton) {
        progressionAction = submitButton;
        progressionType = 'form-submit';
      }
    }
    
    // Priority 2: Look for explicit next/continue buttons
    if (!progressionAction) {
      const nextButton = buttons.find(b => 
        b.label && (
          b.label.toLowerCase().includes('next') ||
          b.label.toLowerCase().includes('continue') ||
          b.label.toLowerCase().includes('proceed') ||
          b.label.toLowerCase().includes('get started') ||
          b.label.toLowerCase().includes('begin')
        )
      );
      if (nextButton) {
        progressionAction = nextButton;
        progressionType = 'explicit-next';
      }
    }
    
    // Priority 3: Look for action buttons (first prominent button)
    if (!progressionAction && buttons.length > 0) {
      progressionAction = buttons[0];
      progressionType = 'primary-action';
    }
    
    // Priority 4: Look for links
    if (!progressionAction && links.length > 0) {
      progressionAction = links[0];
      progressionType = 'link';
    }
    
    // Display user actions based on screen type
    if (inputs.length > 0) {
      output.push(`  User Actions:`);
      
      // Describe input collection
      const inputDescriptions = inputs.slice(0, 3).map(inp => {
        const label = inp.label || inp.placeholder || inp.description || 'input';
        return label;
      });
      
      if (inputs.length <= 3) {
        output.push(`    1. Fill in: ${inputDescriptions.join(', ')}`);
      } else {
        output.push(`    1. Complete ${inputs.length}-field form (${inputDescriptions.slice(0, 2).join(', ')}, ...)`);
      }
      
      // Describe validation/submission
      if (progressionAction) {
        output.push(`    2. Click "${progressionAction.label}" to submit`);
      } else {
        output.push(`    2. Submit form to continue`);
      }
    } else if (buttons.length > 0) {
      output.push(`  User Actions:`);
      buttons.slice(0, 3).forEach((btn, idx) => {
        const actionDesc = btn.description || `Click "${btn.label}"`;
        output.push(`    ${idx + 1}. ${actionDesc}`);
      });
    } else if (links.length > 0) {
      output.push(`  User Actions:`);
      output.push(`    1. Select from ${links.length} available option${links.length > 1 ? 's' : ''}`);
    }
    
    // Specific transition description
    if (nextFrame) {
      output.push(`  Progression:`);
      
      if (progressionType === 'form-submit') {
        output.push(`    → When user completes form and clicks "${progressionAction.label}"`);
        if (inputs.length > 0) {
          const inputFields = inputs.slice(0, 3).map(i => i.label || i.placeholder || 'field').join(', ');
          output.push(`    → Validate: ${inputFields}`);
        }
        output.push(`    → Navigate to: ${nextFrame.name}`);
      } else if (progressionType === 'explicit-next') {
        output.push(`    → User clicks "${progressionAction.label}" button`);
        output.push(`    → Navigate to: ${nextFrame.name}`);
      } else if (progressionType === 'primary-action') {
        output.push(`    → User clicks "${progressionAction.label}" button`);
        output.push(`    → Navigate to: ${nextFrame.name}`);
      } else if (progressionType === 'link') {
        output.push(`    → User selects an option from the list`);
        output.push(`    → Navigate to: ${nextFrame.name}`);
      } else {
        output.push(`    → User completes primary action`);
        output.push(`    → Navigate to: ${nextFrame.name}`);
      }
      
      // Data persistence
      if (inputs.length > 0) {
        output.push(`    → Persist form data for use in subsequent screens`);
      }
    } else {
      output.push(`  Progression:`);
      output.push(`    → Final screen: User has completed the flow`);
      if (buttons.some(b => b.label && (b.label.toLowerCase().includes('done') || b.label.toLowerCase().includes('finish')))) {
        output.push(`    → "Done" action closes flow or returns to home`);
      }
    }
    
    output.push('');
  });
  
  output.push('═══════════════════════════════════════════════════════════════');
  output.push('DESIGN LANGUAGE (Consistent Across Flow)');
  output.push('═══════════════════════════════════════════════════════════════');
  output.push('');
  
  // Condensed Design System
  output.push('Core Tokens:');
  
  // Colors - semantic only
  if (designSystem.colorRoles && Object.keys(designSystem.colorRoles).length > 0) {
    output.push('  Colors:');
    if (designSystem.colorRoles.primary) output.push(`    Primary: ${designSystem.colorRoles.primary}`);
    if (designSystem.colorRoles.secondary) output.push(`    Secondary: ${designSystem.colorRoles.secondary}`);
    if (designSystem.colorRoles.background) output.push(`    Background: ${designSystem.colorRoles.background}`);
    if (designSystem.colorRoles.text) output.push(`    Text: ${designSystem.colorRoles.text}`);
  } else if (designSystem.colors && designSystem.colors.length > 0) {
    // Fallback if no semantic colors
    output.push(`  Colors: ${designSystem.colors.slice(0, 5).join(', ')}`);
  }
  
  // Typography - condensed
  if (designSystem.typography) {
    output.push('  Typography:');
    if (designSystem.typography.fontFamilies && designSystem.typography.fontFamilies.length > 0) {
      output.push(`    Font: ${designSystem.typography.fontFamilies[0]}`);
    }
    if (designSystem.typography.fontSizes && designSystem.typography.fontSizes.length > 0) {
      const sizes = designSystem.typography.fontSizes;
      output.push(`    Sizes: ${sizes[0]}px (small), ${sizes[Math.floor(sizes.length / 2)]}px (medium), ${sizes[sizes.length - 1]}px (large)`);
    }
  }
  
  // Spacing - grid system
  if (designSystem.spacing && designSystem.spacing.length > 0) {
    const spacing = designSystem.spacing.filter(s => s > 0).sort((a, b) => a - b);
    const base = spacing[0] || 8;
    output.push(`  Spacing: Use ${base}px grid system (${base}, ${base * 2}, ${base * 3}, ${base * 4}, etc.)`);
  }
  
  // Border radius
  if (designSystem.borderRadius && designSystem.borderRadius.length > 0) {
    output.push(`  Border Radius: ${designSystem.borderRadius.slice(0, 3).join('px, ')}px`);
  }
  
  // Shadows
  if (designSystem.shadows && designSystem.shadows.length > 0) {
    output.push(`  Elevation: ${designSystem.shadows.length} level${designSystem.shadows.length > 1 ? 's' : ''} (subtle to prominent)`);
  }
  
  output.push('');
  
  // Component Library (if patterns detected)
  const allComponents = frames.reduce((acc: any[], f: ProcessedFrame) => {
    return acc.concat(f.componentPatterns || []);
  }, []);
  if (sections.includeComponents && allComponents.length > 0) {
    output.push('Component Patterns:');
    const uniqueTypes = [...new Set(allComponents.map((c: any) => c.type))];
    uniqueTypes.slice(0, 5).forEach(type => {
      const examples = allComponents.filter((c: any) => c.type === type);
      output.push(`  - ${type}: Used ${examples.length}× (create reusable component)`);
    });
    output.push('');
  }
  
  output.push('═══════════════════════════════════════════════════════════════');
  output.push('SCREEN DETAILS (Contextual)');
  output.push('═══════════════════════════════════════════════════════════════');
  output.push('');
  
  // Detailed Screen Descriptions - Flow-focused
  frames.forEach((frame, index) => {
    output.push(`[${index + 1}] ${frame.name}`);
    output.push('');
    
    // Role in flow (most important)
    output.push(`Role in Flow: ${getPurposeDescription(frame.purpose)}`);
    
    // Analyze progression context for this screen
    const buttons = frame.interactions?.filter(i => 
      (i.type === 'Button' || i.type === 'Icon Button')
    ) || [];
    
    const inputs = frame.interactions?.filter(i => i.type === 'Input Field') || [];
    
    // Transitions (critical for flow)
    if (index < frames.length - 1) {
      const nextFrame = frames[index + 1];
      
      // Find primary progression button
      const primaryAction = buttons.find(btn => 
        btn.label && !btn.label.toLowerCase().includes('back') && !btn.label.toLowerCase().includes('cancel') &&
        (btn.label.toLowerCase().includes('next') || 
         btn.label.toLowerCase().includes('continue') ||
         btn.label.toLowerCase().includes('submit') ||
         btn.label.toLowerCase().includes('send') ||
         btn.label.toLowerCase().includes('sign') ||
         btn.label.toLowerCase().includes('login') ||
         btn.label.toLowerCase().includes('register') ||
         btn.label.toLowerCase().includes('get started') ||
         btn.label.toLowerCase().includes('proceed'))
      );
      
      // Build detailed transition instructions
      output.push(`Navigation Flow:`);
      
      if (primaryAction) {
        if (inputs.length > 0) {
          // Form submission flow
          output.push(`  1. User fills ${inputs.length} input field${inputs.length > 1 ? 's' : ''}`);
          const requiredInputs = inputs.slice(0, 2).map(i => i.label || i.placeholder || 'field').join(', ');
          output.push(`     (${requiredInputs}${inputs.length > 2 ? ', ...' : ''})`);
          output.push(`  2. User clicks "${primaryAction.label}" button`);
          output.push(`  3. System validates input`);
          output.push(`  4. On success → Navigate to "${nextFrame.name}"`);
          output.push(`  5. On error → Display validation messages inline`);
        } else {
          // Simple button click flow
          output.push(`  1. User clicks "${primaryAction.label}" button`);
          output.push(`  2. Navigate to "${nextFrame.name}"`);
        }
      } else {
        // Fallback if no clear primary action found
        const anyActionButton = buttons.find(b => b.label && !b.label.toLowerCase().includes('back'));
        if (anyActionButton) {
          output.push(`  1. User interacts with content`);
          output.push(`  2. User clicks "${anyActionButton.label}"`);
          output.push(`  3. Navigate to "${nextFrame.name}"`);
        } else {
          output.push(`  1. User completes interaction on this screen`);
          output.push(`  2. System automatically navigates to "${nextFrame.name}"`);
        }
      }
      
      // Alternative actions (back button, cancel)
      const backButton = buttons.find(b => b.label && 
        (b.label.toLowerCase().includes('back') || b.label.toLowerCase().includes('cancel'))
      );
      if (backButton) {
        output.push(`  Alternative: "${backButton.label}" → Return to previous screen`);
      }
    } else {
      output.push(`Navigation Flow:`);
      output.push(`  1. This is the final screen in the flow`);
      const doneButton = buttons.find(b => b.label && 
        (b.label.toLowerCase().includes('done') || 
         b.label.toLowerCase().includes('finish') ||
         b.label.toLowerCase().includes('close') ||
         b.label.toLowerCase().includes('complete'))
      );
      if (doneButton) {
        output.push(`  2. User clicks "${doneButton.label}" to exit flow`);
        output.push(`  3. Return to application home or close modal`);
      } else {
        output.push(`  2. User may close flow or return to start`);
      }
    }
    
    // Layout type (simplified)
    const layoutType = frame.layoutMode === 'HORIZONTAL' ? 'Row' : 
                       frame.layoutMode === 'VERTICAL' ? 'Column' : 
                       'Custom';
    output.push(`Layout: ${layoutType} (${Math.round(frame.width)}×${Math.round(frame.height)}px)`);
    
    output.push('');
    
    // Key Elements (top 5-7 most important)
    const keyElements: string[] = [];
    
    // Content sections
    if (frame.contentSummary?.sections && frame.contentSummary.sections.length > 0) {
      keyElements.push(`Sections: ${frame.contentSummary.sections.slice(0, 3).join(', ')}`);
    }
    
    // Headings
    if (frame.contentSummary?.headings && frame.contentSummary.headings.length > 0) {
      keyElements.push(`Heading: "${frame.contentSummary.headings[0]}"`);
    }
    
    // Interactive elements (grouped by type)
    if (frame.interactions && frame.interactions.length > 0) {
      const buttons = frame.interactions.filter(i => i.type === 'Button' || i.type === 'Icon Button');
      const inputs = frame.interactions.filter(i => i.type === 'Input Field');
      const links = frame.interactions.filter(i => i.type === 'Link');
      
      if (buttons.length > 0) {
        keyElements.push(`Buttons: ${buttons.length}× (${buttons.slice(0, 2).map(b => `"${b.label || b.description}"`).join(', ')})`);
      }
      if (inputs.length > 0) {
        keyElements.push(`Inputs: ${inputs.length} field${inputs.length > 1 ? 's' : ''}`);
      }
      if (links.length > 0) {
        keyElements.push(`Links: ${links.length}×`);
      }
    }
    
    if (keyElements.length > 0) {
      output.push('Key Elements:');
      keyElements.forEach(el => output.push(`  - ${el}`));
      output.push('');
    }
    
    // Layout structure (only if includeLayout is true and complex)
    if (sections.includeLayout && frame.layoutStructure?.regions) {
      const hasMultipleRegions = 
        (frame.layoutStructure.regions.top?.length || 0) +
        (frame.layoutStructure.regions.middle?.length || 0) +
        (frame.layoutStructure.regions.bottom?.length || 0) > 2;
      
      if (hasMultipleRegions) {
        output.push('Structure:');
        if (frame.layoutStructure.regions.top && frame.layoutStructure.regions.top.length > 0) {
          output.push(`  Header: ${frame.layoutStructure.regions.top.map((i: any) => i.name).join(', ')}`);
        }
        if (frame.layoutStructure.regions.middle && frame.layoutStructure.regions.middle.length > 0) {
          output.push(`  Body: ${frame.layoutStructure.regions.middle.map((i: any) => i.name).join(', ')}`);
        }
        if (frame.layoutStructure.regions.bottom && frame.layoutStructure.regions.bottom.length > 0) {
          output.push(`  Footer: ${frame.layoutStructure.regions.bottom.map((i: any) => i.name).join(', ')}`);
        }
        output.push('');
      }
    }
    
    output.push('───────────────────────────────────────────────────────────────');
    output.push('');
  });
  
  output.push('═══════════════════════════════════════════════════════════════');
  output.push('IMPLEMENTATION NOTES');
  output.push('═══════════════════════════════════════════════════════════════');
  output.push('');
  
  output.push('Navigation & State:');
  output.push('  - Implement smooth transitions between screens');
  output.push('  - Persist relevant data across navigation');
  output.push('  - Include back button functionality where appropriate');
  output.push('  - Handle loading and error states for async operations');
  output.push('');
  
  output.push('Design Consistency:');
  output.push('  - Apply design tokens uniformly across all screens');
  output.push('  - Maintain consistent spacing using the grid system');
  output.push('  - Use the same component patterns throughout');
  output.push('  - Ensure visual hierarchy is clear and consistent');
  output.push('');
  
  if (sections.includeAccessibility) {
    output.push('Accessibility:');
    output.push('  - Use semantic HTML elements');
    output.push('  - Ensure WCAG AA color contrast (4.5:1 minimum)');
    output.push('  - Support keyboard navigation through the flow');
    output.push('  - Include appropriate ARIA labels for interactive elements');
    output.push('');
  }
  
  if (sections.includeResponsive) {
    output.push('Responsive Behavior:');
    output.push('  - Adapt layouts for mobile, tablet, and desktop');
    output.push('  - Maintain flow logic across all breakpoints');
    output.push('  - Ensure touch-friendly targets on mobile (min 44×44px)');
    output.push('  - Stack elements vertically on smaller screens');
    output.push('');
  }
  
  output.push('═══════════════════════════════════════════════════════════════');
  
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
