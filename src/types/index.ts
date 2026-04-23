export type ClampMode = 'two-point' | 'estimate';

export type PropertyType =
  | 'font-size'
  | 'margin-top'
  | 'margin-bottom'
  | 'padding-top'
  | 'padding-bottom'
  | 'gap';

export type FontType = 'body' | 'lead' | 'heading';

// ── Config types ──

export interface TwoPointConfig {
  desktopViewportWidth: number;
  desktopValue: number;
  mobileDesignWidth: number;
  mobileDesignValue: number;
  mobileTargetWidth: number;
  propertyType: PropertyType;
}

export interface EstimateConfig {
  designSize: number;
  type: FontType;
  minFontSize: number;
  maxFontSize: number;
  baseViewport: number;
  minViewport: number;
  maxViewport: number;
  vwScale: number;
}

// Backward-compat alias
export type ClampConfig = EstimateConfig;

// ── Computed output ──

export interface ClampMetrics {
  mode: ClampMode;
  propertyType: PropertyType;
  clampString: string;
  minValue: number;
  maxValue: number;
  /** vw coefficient used in calc(basePx + slopeVw * vw) */
  slopeVw: number;
  /** px offset in calc(basePx + slopeVw * vw); 0 for estimate mode */
  basePx: number;
  // two-point specifics
  desktopPoint: { viewport: number; value: number } | null;
  /** Target mobile point — what actually enters the clamp formula */
  mobilePoint: { viewport: number; value: number } | null;
  /** Original design mobile point before scaling */
  mobileDesignPoint: { viewport: number; value: number } | null;
  /** mobileTargetWidth / mobileDesignWidth */
  mobileScale: number | null;
  // estimate specifics
  estimateDesktopValue: number | null;
  estimateMobileValue: number | null;
  rawVw: number | null;
  adjustedVw: number | null;
  // chart x-axis range
  chartMinVp: number;
  chartMaxVp: number;
  // validation
  isValid: boolean;
  errorMessage: string | null;
}

export interface ViewportSample {
  viewport: number;
  value: number;
  isDesignPoint: boolean;
}

export interface ChartPoint {
  viewport: number;
  value: number;
}

export interface AppState {
  mode: ClampMode;
  twoPoint: TwoPointConfig;
  estimate: EstimateConfig;
}
