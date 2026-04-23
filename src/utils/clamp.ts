import type {
  ClampMetrics,
  TwoPointConfig,
  EstimateConfig,
  FontType,
  ViewportSample,
  ChartPoint,
} from '../types';

// ── Formatting ──

function fmt(n: number, decimals = 2): string {
  return parseFloat(n.toFixed(decimals)).toString();
}

// ── Two-point core math ──

/** Returns mobileTargetWidth / mobileDesignWidth, or null if mobileDesignWidth <= 0 */
export function getMobileScale(
  mobileDesignWidth: number,
  mobileTargetWidth: number,
): number | null {
  if (mobileDesignWidth <= 0) return null;
  return mobileTargetWidth / mobileDesignWidth;
}

/** Scales mobileDesignValue to match mobileTargetWidth */
export function getScaledMobileValue(
  mobileDesignValue: number,
  mobileDesignWidth: number,
  mobileTargetWidth: number,
): number {
  const scale = getMobileScale(mobileDesignWidth, mobileTargetWidth);
  if (scale === null) return mobileDesignValue;
  return mobileDesignValue * scale;
}

export function getSlopeVwFromTwoPoints(
  desktopValue: number,
  mobileTargetValue: number,
  desktopViewportWidth: number,
  mobileTargetWidth: number,
): number {
  return ((desktopValue - mobileTargetValue) / (desktopViewportWidth - mobileTargetWidth)) * 100;
}

export function getBasePxFromTwoPoints(
  desktopValue: number,
  slopeVw: number,
  desktopViewportWidth: number,
): number {
  return desktopValue - slopeVw * (desktopViewportWidth / 100);
}

export function buildClampStringFromTwoPoints(
  minValue: number,
  basePx: number,
  slopeVw: number,
  maxValue: number,
): string {
  let calcPart: string;
  if (basePx === 0) {
    calcPart = `${fmt(slopeVw)}vw`;
  } else if (slopeVw >= 0) {
    calcPart = `calc(${fmt(basePx)}px + ${fmt(slopeVw)}vw)`;
  } else {
    calcPart = `calc(${fmt(basePx)}px - ${fmt(Math.abs(slopeVw))}vw)`;
  }
  return `clamp(${fmt(minValue)}px, ${calcPart}, ${fmt(maxValue)}px)`;
}

// ── Universal value resolver ──

export function getClampedValueAtViewport(
  viewport: number,
  minValue: number,
  basePx: number,
  slopeVw: number,
  maxValue: number,
): number {
  const fluid = basePx + (slopeVw / 100) * viewport;
  return Math.min(maxValue, Math.max(minValue, fluid));
}

// ── Estimate mode math ──

const TYPE_RATIOS: Record<FontType, number> = {
  body: 0.8,
  lead: 0.9,
  heading: 0.95,
};

export function getEstimateDesktopValue(designSize: number, type: FontType): number {
  return designSize * TYPE_RATIOS[type];
}

export function getEstimateMobileValue(desktopValue: number): number {
  return desktopValue * 0.8;
}

export function buildClampString(minValue: number, slopeVw: number, maxValue: number): string {
  return `clamp(${fmt(minValue)}px, ${fmt(slopeVw)}vw, ${fmt(maxValue)}px)`;
}

// ── Sampling ──

export const SAMPLE_VIEWPORTS = [375, 610, 768, 1024, 1280, 1440, 1920] as const;

export function sampleClampValues(metrics: ClampMetrics): ViewportSample[] {
  const designViewports = new Set<number>();
  if (metrics.desktopPoint) designViewports.add(metrics.desktopPoint.viewport);
  if (metrics.mobilePoint) designViewports.add(metrics.mobilePoint.viewport);
  if (metrics.mobileDesignPoint) designViewports.add(metrics.mobileDesignPoint.viewport);

  return SAMPLE_VIEWPORTS.map((viewport) => ({
    viewport,
    value: getClampedValueAtViewport(
      viewport,
      metrics.minValue,
      metrics.basePx,
      metrics.slopeVw,
      metrics.maxValue,
    ),
    isDesignPoint: designViewports.has(viewport),
  }));
}

export function getChartData(metrics: ClampMetrics): ChartPoint[] {
  const { chartMinVp, chartMaxVp } = metrics;
  const POINTS = 120;
  const step = (chartMaxVp - chartMinVp) / POINTS;

  return Array.from({ length: POINTS + 1 }, (_, i) => {
    const viewport = Math.round(chartMinVp + i * step);
    return {
      viewport,
      value: parseFloat(
        getClampedValueAtViewport(
          viewport,
          metrics.minValue,
          metrics.basePx,
          metrics.slopeVw,
          metrics.maxValue,
        ).toFixed(2),
      ),
    };
  });
}

// ── Main compute functions ──

export function computeTwoPointMetrics(config: TwoPointConfig): ClampMetrics {
  const {
    desktopViewportWidth,
    desktopValue,
    mobileDesignWidth,
    mobileDesignValue,
    mobileTargetWidth,
    propertyType,
  } = config;

  const invalidBase = {
    mode: 'two-point' as const,
    propertyType,
    clampString: '—',
    minValue: 0,
    maxValue: 0,
    slopeVw: 0,
    basePx: 0,
    desktopPoint: null,
    mobilePoint: null,
    mobileDesignPoint: null,
    mobileScale: null,
    estimateDesktopValue: null,
    estimateMobileValue: null,
    rawVw: null,
    adjustedVw: null,
    chartMinVp: 320,
    chartMaxVp: 2000,
    isValid: false,
  };

  if (desktopViewportWidth <= 0)
    return { ...invalidBase, errorMessage: 'Desktop Viewport Width 必須大於 0' };
  if (mobileDesignWidth <= 0)
    return { ...invalidBase, errorMessage: 'Mobile Design Width 必須大於 0' };
  if (mobileTargetWidth <= 0)
    return { ...invalidBase, errorMessage: 'Mobile Target Width 必須大於 0' };

  const mobileScale = getMobileScale(mobileDesignWidth, mobileTargetWidth) as number;
  const mobileTargetValue = getScaledMobileValue(mobileDesignValue, mobileDesignWidth, mobileTargetWidth);

  if (desktopViewportWidth === mobileTargetWidth) {
    return {
      ...invalidBase,
      clampString: `${fmt(desktopValue)}px`,
      desktopPoint: { viewport: desktopViewportWidth, value: desktopValue },
      mobilePoint: { viewport: mobileTargetWidth, value: mobileTargetValue },
      mobileDesignPoint: { viewport: mobileDesignWidth, value: mobileDesignValue },
      mobileScale,
      errorMessage: 'Desktop Viewport 與 Mobile Target Width 相同，無法計算流體曲線',
    };
  }

  const slopeVw = getSlopeVwFromTwoPoints(
    desktopValue,
    mobileTargetValue,
    desktopViewportWidth,
    mobileTargetWidth,
  );
  const basePx = getBasePxFromTwoPoints(desktopValue, slopeVw, desktopViewportWidth);
  const minValue = Math.min(desktopValue, mobileTargetValue);
  const maxValue = Math.max(desktopValue, mobileTargetValue);

  const clampString =
    desktopValue === mobileTargetValue
      ? `${fmt(desktopValue)}px`
      : buildClampStringFromTwoPoints(minValue, basePx, slopeVw, maxValue);

  const chartMaxVp = Math.max(desktopViewportWidth, mobileTargetWidth, 1920);

  return {
    mode: 'two-point',
    propertyType,
    clampString,
    minValue,
    maxValue,
    slopeVw,
    basePx,
    desktopPoint: { viewport: desktopViewportWidth, value: desktopValue },
    mobilePoint: { viewport: mobileTargetWidth, value: mobileTargetValue },
    mobileDesignPoint: { viewport: mobileDesignWidth, value: mobileDesignValue },
    mobileScale,
    estimateDesktopValue: null,
    estimateMobileValue: null,
    rawVw: null,
    adjustedVw: null,
    chartMinVp: 320,
    chartMaxVp,
    isValid: true,
    errorMessage: null,
  };
}

export function computeEstimateMetrics(config: EstimateConfig): ClampMetrics {
  const desktopValue = getEstimateDesktopValue(config.designSize, config.type);
  const mobileValue = getEstimateMobileValue(desktopValue);
  const rawVw = (desktopValue / config.baseViewport) * 100;
  const adjustedVw = rawVw * config.vwScale;
  const minValue = config.minFontSize > 0 ? config.minFontSize : mobileValue;
  const maxValue = config.maxFontSize > 0 ? config.maxFontSize : desktopValue;
  const clampString = buildClampString(minValue, adjustedVw, maxValue);

  return {
    mode: 'estimate',
    propertyType: 'font-size',
    clampString,
    minValue,
    maxValue,
    slopeVw: adjustedVw,
    basePx: 0,
    desktopPoint: null,
    mobilePoint: null,
    mobileDesignPoint: null,
    mobileScale: null,
    estimateDesktopValue: desktopValue,
    estimateMobileValue: mobileValue,
    rawVw,
    adjustedVw,
    chartMinVp: config.minViewport,
    chartMaxVp: config.maxViewport,
    isValid: true,
    errorMessage: null,
  };
}

// ── Backward-compat shims ──

export function getDesktopFontSize(designSize: number, type: FontType): number {
  return getEstimateDesktopValue(designSize, type);
}

export function getMobileFontSize(desktopValue: number): number {
  return getEstimateMobileValue(desktopValue);
}

export function getFontSizeAtViewport(
  viewport: number,
  minSize: number,
  adjustedVw: number,
  maxSize: number,
): number {
  return getClampedValueAtViewport(viewport, minSize, 0, adjustedVw, maxSize);
}
