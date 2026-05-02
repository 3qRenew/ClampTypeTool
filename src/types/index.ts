export type ClampMode = 'single' | 'dual';

export type PropertyType = 'font-size' | 'spacing';

export type FontType = 'body' | 'lead' | 'heading';

// ── Single mode config (two design points + artboard scaling) ──

export interface SingleConfig {
  desktopViewportWidth: number;
  desktopValue: number;
  mobileDesignWidth: number;
  mobileDesignValue: number;
  mobileTargetWidth: number;
  propertyType: PropertyType;
}

// ── Dual mode config (two explicit segments) ──

export interface SegmentConfig {
  minViewport: number;
  minValue: number;
  maxViewport: number;
  maxValue: number;
}

export interface DualConfig {
  propertyType: PropertyType;
  portrait: SegmentConfig;
  landscape: SegmentConfig;
}

// ── Computed output ──

export interface ClampMetrics {
  mode: ClampMode;
  propertyType: PropertyType;
  clampString: string;
  minValue: number;
  maxValue: number;
  slopeVw: number;
  basePx: number;
  desktopPoint: { viewport: number; value: number } | null;
  mobilePoint: { viewport: number; value: number } | null;
  mobileDesignPoint: { viewport: number; value: number } | null;
  mobileScale: number | null;
  chartMinVp: number;
  chartMaxVp: number;
  isValid: boolean;
  errorMessage: string | null;
}

export interface DualData {
  portrait: ClampMetrics;
  landscape: ClampMetrics;
  breakpoint: number;
  propertyType: PropertyType;
  isValid: boolean;
  errorMessage: string | null;
}

export interface ViewportSample {
  viewport: number;
  value: number;
  isDesignPoint: boolean;
  segment?: 'portrait' | 'landscape';
}

export interface ChartPoint {
  viewport: number;
  portrait?: number;
  landscape?: number;
  value?: number;
}

export interface AppState {
  mode: ClampMode;
  single: SingleConfig;
  dual: DualConfig;
  outputUnitMode: OutputUnitMode;
}

// ── Token system ──

export type TokenCategory = 'typography' | 'spacing';

export type TypographyTokenKey =
  | '.txt-wrap'
  | '.txt-title'
  | '.page-en-title'
  | '.page-zh-title'
  | '.page-en-subtitle'
  | '.page-zh-subtitle'
  | '.page-en-label'
  | '.page-zh-label'
  | '.txt-body'
  | '.txt-body p'
  | '.page-caption'
  | '.slogan-wrap'
  | '.page-slogan-heading1'
  | '.page-slogan-heading2'
  | '.page-slogan-heading3'
  | '.page-slogan-label';

export type SpacingTokenKey =
  | '--section-padding-px'
  | '--section-padding-py'
  | '--section-gutter-y'
  | '--section-gutter-x'
  | '--text-stack-gap';

export type TokenKey = TypographyTokenKey | SpacingTokenKey;

export interface ResponsiveTokenInput {
  minWidth: number;
  maxWidth: number;
  minPx: number | '';
  maxPx: number | '';
}

export interface ResponsiveTokenValue {
  key: TokenKey;
  category: TokenCategory;
  mobile: ResponsiveTokenInput;
  desktop: ResponsiveTokenInput;
}

export type TokenValueMap = Record<TokenKey, ResponsiveTokenValue>;

// ── Unit Strategy types ──

export type UnitStrategyCategory =
  | 'typography-relative'
  | 'layout-relative'
  | 'visual-fixed';

export type CSSUnit =
  | 'rem'
  | 'em'
  | 'px'
  | '%'
  | 'vw'
  | 'vh'
  | 'clamp()'
  | 'min()'
  | 'max()'
  | 'auto';

export type OutputUnitMode = 'auto' | 'px' | 'rem';

export interface UnitStrategy {
  property: string;
  label: string;
  category: UnitStrategyCategory;
  recommendedUnits: CSSUnit[];
  allowedUnits: CSSUnit[];
  avoidUnits: CSSUnit[];
  reason: string;
  notes: string;
  examples: readonly string[];
  variant?: string;
  supportsClamp: boolean;
  clampPolicy?: 'always' | 'large-only' | 'avoid';
}

export const PROPERTY_TYPE_CATEGORY: Record<PropertyType, UnitStrategyCategory> = {
  'font-size': 'typography-relative',
  'spacing': 'typography-relative',
};
