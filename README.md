# Atlas Prompt Compiler - Figma Plugin

A Figma plugin that extracts design intent from Figma frames and generates structured, pixel-accurate prompts for AI-powered code generation tools like v0.dev.

## Overview

This plugin bridges the gap between design and development by automatically analyzing Figma designs and compiling them into comprehensive, deterministic specifications that can be fed directly to AI code generation tools. Instead of manually describing your design or relying on screenshot-based approaches, Atlas analyzes your Figma frames to extract layout, typography, colors, spacing, and component metadata—then compiles everything into a structured prompt.

## What It Does

### 1. **Design System Extraction**
Automatically scans selected Figma frames to build a complete design system:
- **Typography**: Font families, sizes, weights, line heights
- **Colors**: Full color palette with semantic role detection (primary, secondary, background, text)
- **Spacing**: Padding and gap values throughout the design
- **Border Radius**: Rounded corner values
- **Shadows**: Elevation and shadow effects
- **Consistency Checking**: Detects similar-but-different colors and other design inconsistencies

### 2. **Layout Analysis**
Examines the structure and positioning of elements:
- Auto Layout detection (horizontal/vertical flow)
- Region categorization (header, main content, footer)
- Responsive behavior hints
- Content width constraints
- Component nesting and hierarchy

### 3. **Component Pattern Detection**
Identifies reusable UI patterns:
- Cards, navigation bars, form sections
- Repeated components (detected via instances)
- Structural vs repeatable component classification
- Component usage frequency

### 4. **Content Extraction**
Analyzes text content and structure:
- Heading hierarchy
- Key text content
- Placeholder detection
- Dynamic content suggestions
- Character limit recommendations

### 5. **Interaction Mapping**
Catalogs interactive elements:
- Buttons (with labels and types)
- Input fields
- Links
- Toggles and controls
- Navigation flows between screens

### 6. **Accessibility Analysis**
Performs automated accessibility checks:
- Touch target size validation (44px minimum)
- Heading hierarchy guidelines
- Color contrast reminders
- Alt text recommendations

### 7. **Prompt Compilation & Editing**
Generates a comprehensive, structured prompt that includes:
- Complete design system tokens
- Screen-by-screen specifications
- User flow sequence
- Layout structure and dimensions
- Interactive element documentation
- Responsive design guidance
- Implementation requirements
- Strict constraints (no hallucination)
- **Fully editable**: Direct in-place editing with auto-save

## Key Features

- **No Screenshot Generation**: Extracts actual design data, not visual approximations
- **Deterministic Output**: Produces consistent, repeatable specifications
- **Two-Step Process**: 
  1. Extract and review design system
  2.Editable Output**: Directly edit the generated prompt in a textarea with auto-save
- ** Generate prompt with customizable sections
- **Visual Preview**: Includes frame screenshots alongside specifications
- **Figma-Native**: Uses Figma Plugin API for direct access to design properties
- **v0.dev Optimized**: Output format specifically tailored for AI code generators

## How It Works

### Architecture

```
┌─────────────┐
│   main.ts   │  ← Plugin controller, handles UI communication
└──────┬──────┘
       │
       ├─────────────────────────────────┐
       │                                 │
┌──────▼──────────┐            ┌────────▼──────────┐
│ normalizeNode.ts│            │ promptCompiler.ts │
└─────────────────┘            └───────────────────┘
  • extractDesignSystem()        • compileUnifiedPrompt()
  • normalizeFrame()              • Generates final prompt
  • Layout analysis               • Section management
  • Component detection           • Implementation guidelines
  • Accessibility checks
```

### Workflow

1. **Select Frames**: User selects one or more FRAME nodes in Figma
2. **Extract**: Plugin analyzes frames and extracts design system
3. **Review**: User reviews/edits design system in UI
4. **Configure**: User selects which sections to include in prompt
5. **Generate**: Plugin compiles comprehensive prompt
6. **Edit**: User can directly edit the generated prompt in the textarea
7. **Export**: User copies edited prompt to clipboard or sends to v0.dev

### Plugin Entry Points

**Main Plugin Logic** ([main.ts](src/main.ts)):
- `process-selection`: Extracts design system from selected frames
- `generate-prompt`: Compiles final prompt with user preferences
- Handles frame screenshot export
- Manages UI communication

**Normalization** ([normalizeNode.ts](src/normalizeNode.ts)):
- `extractDesignSystem()`: Aggregates design tokens across frames
- `normalizeFrame()`: Processes individual frame into structured data
- Helper functions for layout, content, and accessibility analysis
- Design consistency validation

**Prompt Compilation** ([promptCompiler.ts](src/promptCompiler.ts)):
- `compileUnifiedPrompt()`: Assembles final prompt from processed data
- Section management (layout, components, visual theme, responsive, etc.)
- Implementation requirement generation
- Format optimization for AI tools

## Output Format

The generated prompt is structured with:

```
IMPORTANT INSTRUCTIONS
├─ Constraints (no hallucination rules)
└─ Implementation boundaries

DESIGN SYSTEM
├─ Typography
├─ Color Palette (with semantic roles)
├─ Border Radius
├─ Shadows
├─ Spacing Scale
└─ Consistency Warnings

USER FLOW
└─ Screen sequence with navigation

SCREEN SPECIFICATIONS (per frame)
├─ Purpose & Dimensions
├─ Structure & Layout
│  ├─ TOP AREA (header)
│  ├─ MAIN CONTENT (body)
│  └─ BOTTOM AREA (footer)
├─ Component Patterns
├─ Content Structure
├─ Interactive Elements
│  ├─ Buttons
│  ├─ Input Fields
│  ├─ Links
│  └─ Toggles
├─ Navigation
├─ Responsive Behavior
├─ Accessibility Guidelines
└─ Content Notes

IMPLEMENTATION REQUIREMENTS
├─ Design System Constraints
├─ Visual States (hover, active, disabled, focus)
├─ Spacing & Layout Rules
├─ Responsive Behavior
├─ Functional Behavior
└─ Accessibility Standards
```

## Installation

### Development Setup

1. Clone the repository:
```bash
git clone https://github.com/garry/atlas-plugin.git
cd atlas-plugin
```

2. Install dependencies:
```bash
npm install
```

3. Build the plugin:
```bash
npm run build
```

4. Load in Figma:
   - Open Figma Desktop App
   - Go to Plugins → Development → Import plugin from manifest
   - Select `manifest.json` from this project

### Building

```bash
# One-time build
npm run build

# Watch mode (rebuilds on file changes)
npm run watch
```

## Usage

1. **Open your Figma file** with the designs you want to convert
2. **Select one or more FRAME nodes** (not groups or other types)
3. **Run the plugin**: Plugins → Development → "Instil Figma > v0 Prompt Compiler"
4. **Review Design System**: Check extracted typography, colors, spacing
5. **Edit if needed**: Adjust design tokens directly in the UI
6. **Configure sections**: Choose which parts to include in the prompt
7. **Edit Prompt** (optional): Refine the generated prompt directly in the editable textarea
   - Changes are saved automatically as you type
   - Edit any section, add notes, or adjust descriptions
9. **Copy or Export**: Use the ediile the final specification
8. **Copy or Export**: Use the generated prompt with v0.dev or similar tools

### Tips

- **Frame Selection**: Only FRAME nodes are processed (not groups or components)
- **Multiple Screens**: Select multiple frames to document user flows
- **Design Consistency**: Pay attention to consistency warnings—they indicate opportunities to simplify your design system
- **Component Naming**: Name your components clearly; the plugin uses these names in the output
- **Auto Layout**: Plugin prefers Auto Layout data over absolute positioning for better accuracy

## Technology Stack

- **TypeScript**: Type-safe plugin development
- **Figma Plugin API**: Direct access to design properties
- **No Dependencies**: Minimal runtime dependencies for fast execution

## Project Structure

```
atlas-plugin/
├── src/
│   ├── main.ts              # Plugin entry point and controller
│   ├── normalizeNode.ts     # Design extraction and normalization
│   ├── promptCompiler.ts    # Prompt generation logic
│   ├── types.ts             # TypeScript type definitions
│   └── ui.html              # Plugin UI (HTML/CSS/JS)
├── manifest.json            # Figma plugin manifest
├── package.json             # Node.js package configuration
├── tsconfig.json            # TypeScript configuration
├── build.js                 # Build script
└── README.md                # This file
```

## Design Philosophy

### Constraints Over Flexibility
The plugin enforces strict constraints in the generated prompt to prevent AI hallucination:
- Uses ONLY extracted design tokens
- Implements ONLY specified interactions
- Avoids assumptions about missing information
- Explicit over implicit

### Deterministic Output
Same input always produces same output:
- No randomness in extraction
- Consistent formatting
- Repeatable specifications

### No Code Generation
The plugin does NOT generate UI code directly. Instead, it produces structured specifications that AI tools can interpret. This approach:
- Reduces complexity
- Improves accuracy
- Maintains design intent
- Allows flexibility in implementation technology

## Limitations

- Only processes FRAME nodes (not groups or other node types)
- Screenshot export requires frames to be visible in viewport
- Color contrast checking is informational (not computed)
- Does not handle animations or advanced interactions
- Network access disabled (no external API calls)

## Future Enhancements

Potential improvements:
- [ ] Component library integration
- [ ] Variant detection and documentation
- [ ] Animation/transition specifications
- [ ] Dark mode theme extraction
- [ ] Export to multiple formats (JSON, Markdown, etc.)
- [ ] Design diff comparison
- [ ] Direct integration with code generation APIs

## Contributing

Contributions welcome! This plugin is designed to be extended and improved. Key areas for contribution:
- Additional accessibility checks
- Better component pattern detection
- Enhanced responsive design hints
- Output format customization
- Integration with other AI tools

## License

[License information to be added]

## Author

Garry

## Acknowledgments

Built for designers and developers who want to bridge the gap between design tools and code generation with precision and clarity.
Atlas Figma Plugin - Generate comprehensive starting prompts based on figma canvas selection
