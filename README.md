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
7. **Generate Specification**: Click "Create Specification" to compile the prompt
8. **Edit Prompt** (optional): Refine the generated prompt directly in the editable textarea
   - Changes are saved automatically as you type
   - Edit any section, add notes, or adjust descriptions
9. **Send to v0** (NEW!): Click the 🚀 v0 button to:
   - Automatically create a v0 project (if API key is configured)
   - Or open v0.dev with your prompt pre-filled
10. **Copy or Export**: Use the "Copy" button or export in various formats (TXT, MD, JSON, HTML)

### v0 Quick Start

**First Time Setup**:
1. Click ⚙️ **Settings** in the plugin header
2. Enter your v0 API key from [v0.dev](https://v0.dev) (Settings → API Keys)
3. Click OK to save

**Every Time**:
1. Generate your specification
2. Toggle "Include screenshots" if desired
3. Click 🚀 **v0** button
4. Your project opens automatically in v0.dev!

### Tips

- **Frame Selection**: Only FRAME nodes are processed (not groups or components)
- **Multiple Screens**: Select multiple frames to document user flows
- **Design Consistency**: Pay attention to consistency warnings—they indicate opportunities to simplify your design system
- **Component Naming**: Name your components clearly; the plugin uses these names in the output
- **Auto Layout**: Plugin prefers Auto Layout data over absolute positioning for better accuracy
- **v0 Integration**: Include screenshots for better AI-generated results
- **API Key Security**: Your v0 API key is stored locally in your browser only

## Technology Stack

- **TypeScript**: Type-safe plugin development
- **Figma Plugin API**: Direct access to design properties
- **v0 SDK**: Direct integration with Vercel's v0 platform
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
- v0 SDK screenshot attachment requires external image hosting (currently screenshots are included inline in the prompt)

## v0 Integration

Atlas now includes **direct integration with v0.dev** using the v0 SDK! This allows you to automatically send your design specifications and create v0 projects with a single click.

### Features

- **Automatic Project Creation**: Send prompts directly to v0.dev via the SDK
- **Screenshot Support**: Include design screenshots for better context
- **API Key Management**: Secure storage of your v0 API key in browser localStorage
- **Smart Fallback**: Automatically uses manual v0.dev URL method (current) with future SDK integration planned

### Current Implementation

**Note**: Due to Figma's plugin sandbox environment limitations, the v0 SDK cannot currently be used directly within the plugin. The current implementation uses an enhanced manual method that:

1. Prepares your prompt with design specifications
2. Includes screenshots as context
3. Opens v0.dev with the prompt pre-filled
4. Copies everything to clipboard for easy pasting

**Future Enhancement**: We're planning to add a server-side proxy to enable true SDK integration, which will allow automatic project creation and return direct links to generated v0 projects.

### Setup

1. **Get your v0 API Key** (optional for now):
   - Visit [v0.dev](https://v0.dev)
   - Go to Settings → API Keys
   - Create a new API key

2. **Configure the Plugin** (optional):
   - Click the ⚙️ **Settings** button in the plugin header
   - Enter your v0 API key when prompted
   - The key is stored securely in your browser's localStorage
   - Note: Currently used for future SDK integration

### Usage

1. Generate your design specification as usual
2. Click the 🚀 **v0** button in the prompt header
3. The plugin will:
   - Copy your prompt and screenshots to clipboard
   - Open v0.dev with the prompt pre-filled
   - Allow you to paste screenshots directly into v0 chat

### How It Works (Current)

The current implementation uses an enhanced manual workflow:

1. User clicks the 🚀 **v0** button
2. Plugin prepares comprehensive prompt with design specifications
3. Optionally includes screenshot context in the message
4. Opens v0.dev with the prompt as a URL parameter
5. Copies full prompt + screenshots to clipboard
6. User can paste screenshots directly into v0 chat for visual reference

**Planned Enhancement**: Direct SDK integration via server proxy will enable:
- Automatic v0 project creation without manual steps
- Direct screenshot attachment as URLs
- Instant return link to generated project
- No clipboard/paste required

### API Key Security

- **Local Storage**: API keys are stored in your browser's localStorage (ready for future SDK integration)
- **Not Committed**: Keys are never committed to the repository
- **User-Controlled**: You can view, update, or remove your key anytime via Settings
- **Security Warnings**: Clear notices about storage and security implications
- **Privacy First**: Consent required before sending data to v0.dev

### Troubleshooting

**"Direct v0 SDK integration is not available"**: This is expected. The plugin currently uses the enhanced manual method (opens v0.dev with prompt). Full SDK integration is planned for a future update.

**Prompt not appearing in v0**: Very long prompts may be truncated in URL. Use the "Copy" button and paste into v0.dev manually.

**Screenshots not appearing in v0**: Paste screenshots from clipboard into v0 chat after the page opens. The plugin copies them automatically.

## Future Enhancements

Potential improvements:
- [x] Basic v0.dev integration (enhanced manual method)
- [ ] **Server-side proxy for full v0 SDK integration**
- [ ] **Automatic screenshot upload to image hosting**
- [ ] Direct v0 project creation with instant links
- [ ] Component library integration
- [ ] Variant detection and documentation
- [ ] Animation/transition specifications
- [ ] Dark mode theme extraction
- [ ] Export to multiple formats (JSON, Markdown, etc.)
- [ ] Design diff comparison

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
