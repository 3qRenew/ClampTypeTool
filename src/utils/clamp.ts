import type {
  ClampMetrics,
  SingleConfig,
  SegmentConfig,
  PropertyType,
  ViewportSample,
  ChartPoint,
  DualData,
  DualConfig,
} from '../types';

// ── Formatting ──

export function fmt(n: number, decimals = 2): string {
  return parseFloat(n.toFixed(decimals)).toString();
}

// ── Rem conversion ──

export function pxToRem(px: number, root = 16): number {
  return px / root;
}

/** Format a px value as rem, trimming unnecessary trailing zeros */
export function formatRem(px: number, root = 16): string {
  return `${parseFloat((px / root).toFixed(4))}rem`;
}

/** Build a rem-based clamp string (slopeVw stays in vw — it's viewport-relative, not font-relative) */
export function buildClampStringRem(
  minPx: number,
  basePx: number,
  slopeVw: number,
  maxPx: number,
): string {
  const minRem = formatRem(minPx);
  const maxRem = formatRem(maxPx);
  const baseRem = formatRem(basePx);
  let calcPart: string;
  if (basePx === 0) {
    calcPart = `${fmt(slopeVw)}vw`;
  } else if (slopeVw >= 0) {
    calcPart = `calc(${baseRem} + ${fmt(slopeVw)}vw)`;
  } else {
    calcPart = `calc(${baseRem} - ${fmt(Math.abs(slopeVw))}vw)`;
  }
  return `clamp(${minRem}, ${calcPart}, ${maxRem})`;
}

/** Snap a px value to the nearest 0.25rem increment and format cleanly */
export function snapToCleanRem(px: number, root = 16): string {
  const snapped = Math.round((px / root) * 4) / 4;
  return `${parseFloat(snapped.toFixed(4))}rem`;
}

/** diff threshold below which clamp() is not worth it */
export const CLAMP_LOW_DIFF_PX = 20;

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

export function computeTwoPointMetrics(config: SingleConfig): ClampMetrics {
  const {
    desktopViewportWidth,
    desktopValue,
    mobileDesignWidth,
    mobileDesignValue,
    mobileTargetWidth,
    propertyType,
  } = config;

  const invalidBase = {
    mode: 'single' as const,
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
    mode: 'single',
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
    chartMinVp: 320,
    chartMaxVp,
    isValid: true,
    errorMessage: null,
  };
}

// ── Dual / Segment mode ──

/** Compute ClampMetrics directly from an explicit (minVp, minVal) → (maxVp, maxVal) segment */
export function computeSegmentMetrics(
  segment: SegmentConfig,
  propertyType: PropertyType,
): ClampMetrics {
  const { minViewport, minValue, maxViewport, maxValue } = segment;

  const invalidBase: ClampMetrics = {
    mode: 'dual',
    propertyType,
    clampString: '—',
    minValue: 0, maxValue: 0,
    slopeVw: 0, basePx: 0,
    desktopPoint: null, mobilePoint: null,
    mobileDesignPoint: null, mobileScale: null,
    chartMinVp: minViewport, chartMaxVp: maxViewport,
    isValid: false, errorMessage: null,
  };

  if (minViewport <= 0) return { ...invalidBase, errorMessage: 'Min viewport must be > 0' };
  if (maxViewport <= minViewport) return { ...invalidBase, errorMessage: 'Max viewport must be greater than min viewport' };

  const slopeVw = getSlopeVwFromTwoPoints(maxValue, minValue, maxViewport, minViewport);
  const basePx = getBasePxFromTwoPoints(maxValue, slopeVw, maxViewport);

  const clampString =
    minValue === maxValue
      ? `${fmt(maxValue)}px`
      : buildClampStringFromTwoPoints(minValue, basePx, slopeVw, maxValue);

  return {
    mode: 'dual',
    propertyType,
    clampString,
    minValue,
    maxValue,
    slopeVw,
    basePx,
    desktopPoint: { viewport: maxViewport, value: maxValue },
    mobilePoint: { viewport: minViewport, value: minValue },
    mobileDesignPoint: null,
    mobileScale: null,
    chartMinVp: minViewport,
    chartMaxVp: maxViewport,
    isValid: true,
    errorMessage: null,
  };
}

export function computeDualData(config: DualConfig): DualData {
  const { portrait, landscape, propertyType } = config;
  const pm = computeSegmentMetrics(portrait, propertyType);
  const lm = computeSegmentMetrics(landscape, propertyType);
  return {
    portrait: pm,
    landscape: lm,
    breakpoint: landscape.minViewport,
    propertyType,
    isValid: pm.isValid && lm.isValid,
    errorMessage: pm.errorMessage ?? lm.errorMessage,
  };
}

/** Sample viewports across both dual segments */
export function sampleDualValues(dual: DualData): ViewportSample[] {
  const PORTRAIT_VPS = [375, 430, 600, 768, 991];
  const LANDSCAPE_VPS = [992, 1024, 1280, 1440, 1920];

  const portraitSamples: ViewportSample[] = PORTRAIT_VPS
    .filter((vp) => vp >= dual.portrait.chartMinVp && vp <= dual.portrait.chartMaxVp)
    .map((viewport) => ({
      viewport,
      value: getClampedValueAtViewport(viewport, dual.portrait.minValue, dual.portrait.basePx, dual.portrait.slopeVw, dual.portrait.maxValue),
      isDesignPoint: viewport === dual.portrait.chartMinVp || viewport === dual.portrait.chartMaxVp,
      segment: 'portrait' as const,
    }));

  const landscapeSamples: ViewportSample[] = LANDSCAPE_VPS
    .filter((vp) => vp >= dual.landscape.chartMinVp && vp <= dual.landscape.chartMaxVp)
    .map((viewport) => ({
      viewport,
      value: getClampedValueAtViewport(viewport, dual.landscape.minValue, dual.landscape.basePx, dual.landscape.slopeVw, dual.landscape.maxValue),
      isDesignPoint: viewport === dual.landscape.chartMinVp || viewport === dual.landscape.chartMaxVp,
      segment: 'landscape' as const,
    }));

  return [...portraitSamples, ...landscapeSamples];
}

/** Chart data for dual mode — two keyed values with a gap at breakpoint */
export function getDualChartData(dual: DualData): ChartPoint[] {
  const POINTS = 80;

  const portraitStep = (dual.portrait.chartMaxVp - dual.portrait.chartMinVp) / POINTS;
  const portraitPts: ChartPoint[] = Array.from({ length: POINTS + 1 }, (_, i) => {
    const viewport = Math.round(dual.portrait.chartMinVp + i * portraitStep);
    return {
      viewport,
      portrait: parseFloat(getClampedValueAtViewport(viewport, dual.portrait.minValue, dual.portrait.basePx, dual.portrait.slopeVw, dual.portrait.maxValue).toFixed(2)),
    };
  });

  const landscapeStep = (dual.landscape.chartMaxVp - dual.landscape.chartMinVp) / POINTS;
  const landscapePts: ChartPoint[] = Array.from({ length: POINTS + 1 }, (_, i) => {
    const viewport = Math.round(dual.landscape.chartMinVp + i * landscapeStep);
    return {
      viewport,
      landscape: parseFloat(getClampedValueAtViewport(viewport, dual.landscape.minValue, dual.landscape.basePx, dual.landscape.slopeVw, dual.landscape.maxValue).toFixed(2)),
    };
  });

  return [...portraitPts, ...landscapePts];
}

