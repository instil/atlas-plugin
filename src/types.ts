// Type definitions for the plugin

export interface PluginMessage {
  type: string;
  data?: any;
}

export interface ProcessedFrame {
  id: string;
  name: string;
  width: number;
  height: number;
  purpose: string;
  interactions: any[];
  layoutMode: any;
  contentSummary: any;
  layoutStructure?: any;
  componentPatterns?: any[];
  visualTheme?: any;
  responsiveHints?: any;
  accessibilityIssues?: any[];
  contentGuidelines?: any;
}

export interface NormalizedNode {
  id: string;
  name: string;
  type: string;
}

export interface DesignSystem {
  typography: {
    fontFamilies: string[];
    fontSizes: number[];
    fontWeights: string[];
    lineHeights: number[];
  };
  colors: string[];
  spacing: number[];
  borderRadius: number[];
  shadows: string[];
  colorRoles?: {
    primary?: string;
    secondary?: string;
    background?: string;
    text?: string;
    border?: string;
  };
  consistencyWarnings?: any[];
}

export interface LayoutData {
  mode: 'HORIZONTAL' | 'VERTICAL';
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  spacing: number;
  primaryAxisAlign: string;
  counterAxisAlign: string;
  primaryAxisSizing: string;
  counterAxisSizing: string;
}

export interface ColorData {
  type: string;
  color?: string;
  opacity?: number;
}

export interface TextStyle {
  content: string;
  fontSize: number | 'mixed';
  fontFamily: string | 'mixed';
  fontWeight: string | 'mixed';
  lineHeight: any;
  letterSpacing: any;
  textAlign: string | 'mixed';
  textDecoration: string | 'mixed';
}
