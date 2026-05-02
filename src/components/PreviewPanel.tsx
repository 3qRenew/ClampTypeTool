import React, { useState } from 'react';
import type { ClampMode, ClampMetrics, DualData, PropertyType, OutputUnitMode } from '../types';
import { buildClampStringRem, snapToCleanRem, CLAMP_LOW_DIFF_PX } from '../utils/clamp';
import { getStrategyForPropertyType } from '../data/unitStrategy';

interface Props {
  mode: ClampMode;
  metrics: ClampMetrics;
  dualData: DualData | null;
  outputUnitMode: OutputUnitMode;
}

// ── Helpers ──

const PROPERTY_LABELS: Record<PropertyType, string> = {
  'font-size': 'Font Size',
  'spacing': 'Spacing',
};

function isSpacing(pt: PropertyType): boolean {
  return pt !== 'font-size';
}

function resolveString(m: ClampMetrics, outputUnitMode: OutputUnitMode, autoUsesRem: boolean): { primary: string; secondary: string; label: string } {
  const pxStr = m.clampString;
  const remStr = m.isValid && m.clampString !== '—'
    ? buildClampStringRem(m.minValue, m.basePx, m.slopeVw, m.maxValue)
    : m.clampString;

  const useRem =
    outputUnitMode === 'rem' ? true :
    outputUnitMode === 'px'  ? false :
    autoUsesRem;

  return {
    primary:   useRem ? remStr : pxStr,
    secondary: useRem ? pxStr  : remStr,
    label:     useRem ? 'rem'  : 'px',
  };
}

// ── Spacing visual ──

const SpacingPreview: React.FC<{ clampString: string }> = ({ clampString }) => (
  <div style={{
    background: '#1a2030', border: '1px solid #2a3550', borderRadius: 4,
    overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 8,
  }}>
    <div style={{ background: '#2a3a55', borderRadius: 3, height: 28, flexShrink: 0 }} />
    <div style={{
      height: clampString, background: 'rgba(96,165,250,0.08)',
      border: '1px dashed rgba(96,165,250,0.2)', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    }}>
      <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'rgba(96,165,250,0.5)' }}>spacing</span>
    </div>
    <div style={{ background: '#3a4a65', borderRadius: 3, height: 28, flexShrink: 0 }} />
    <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#4a7aaa', paddingTop: 6 }}>
      margin / padding / gap: {clampString}
    </span>
  </div>
);

// ── Dual CSS block output ──

const DualCssBlock: React.FC<{
  dualData: DualData;
  outputUnitMode: OutputUnitMode;
  autoUsesRem: boolean;
  propertyType: PropertyType;
}> = ({ dualData, outputUnitMode, autoUsesRem, propertyType }) => {
  const [copied, setCopied] = useState(false);

  const p = resolveString(dualData.portrait,  outputUnitMode, autoUsesRem);
  const l = resolveString(dualData.landscape, outputUnitMode, autoUsesRem);

  const prop = propertyType === 'font-size' ? 'font-size' : 'property';
  const bp   = dualData.breakpoint;

  const fullBlock = `${prop}: ${p.primary};\n\n@media (min-width: ${bp}px) {\n  ${prop}: ${l.primary};\n}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullBlock).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  };

  return (
    <div className="dual-output">
      {/* Portrait row */}
      <div className="dual-seg-header">
        <span className="dual-seg-dot portrait-dot" />
        <span className="dual-seg-label">直向 Portrait</span>
        <span className="dual-seg-range">{dualData.portrait.chartMinVp}–{dualData.portrait.chartMaxVp}px</span>
        <span className="dual-seg-unit">{p.label}</span>
      </div>
      <div className="dual-clamp-row">
        <code className="dual-clamp-code portrait-code">{p.primary}</code>
      </div>
      {p.secondary !== p.primary && (
        <div className="dual-clamp-secondary">{p.secondary}</div>
      )}

      {/* Breakpoint divider */}
      <div className="dual-bp-row">
        <span className="dual-bp-text">@media (min-width: {bp}px)</span>
      </div>

      {/* Landscape row */}
      <div className="dual-seg-header">
        <span className="dual-seg-dot landscape-dot" />
        <span className="dual-seg-label">橫向 Landscape</span>
        <span className="dual-seg-range">{dualData.landscape.chartMinVp}–{dualData.landscape.chartMaxVp}px</span>
        <span className="dual-seg-unit">{l.label}</span>
      </div>
      <div className="dual-clamp-row">
        <code className="dual-clamp-code landscape-code">{l.primary}</code>
      </div>
      {l.secondary !== l.primary && (
        <div className="dual-clamp-secondary">{l.secondary}</div>
      )}

      {/* Full block copy */}
      <button className="dual-copy-btn" onClick={handleCopy}>
        {copied ? '✓ 已複製 CSS Block' : 'Copy CSS Block'}
      </button>
    </div>
  );
};

// ── Main panel ──

export const PreviewPanel: React.FC<Props> = ({ mode, metrics, dualData, outputUnitMode }) => {
  const [copied, setCopied] = useState(false);

  const isSingle = mode === 'single';
  const propertyType = isSingle ? metrics.propertyType : (dualData?.propertyType ?? metrics.propertyType);
  const spacing = isSpacing(propertyType);

  const strategy    = getStrategyForPropertyType(propertyType);
  const autoUsesRem = strategy ? strategy.recommendedUnits[0] === 'rem' : false;

  // Single mode derived strings
  const pxString  = metrics.clampString;
  const { primary: primaryString, secondary: secondaryString, label: primaryLabel } =
    resolveString(metrics, outputUnitMode, autoUsesRem);

  // Low-diff suggestion (single mode only)
  const diffPx    = metrics.isValid ? metrics.maxValue - metrics.minValue : 0;
  const isLowDiff = isSingle && metrics.isValid && diffPx <= CLAMP_LOW_DIFF_PX && diffPx > 0;
  const suggestedRem = isLowDiff ? snapToCleanRem(metrics.desktopPoint?.value ?? metrics.maxValue) : null;

  const [copiedRem, setCopiedRem] = useState(false);
  const handleCopyRem = () => {
    if (!suggestedRem) return;
    navigator.clipboard.writeText(suggestedRem).then(() => {
      setCopiedRem(true);
      setTimeout(() => setCopiedRem(false), 1400);
    });
  };
  const handleCopy = () => {
    navigator.clipboard.writeText(primaryString).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  };

  return (
    <div className="panel">
      {/* Header */}
      <div className="preview-header">
        <div className="panel-title" style={{ marginBottom: 0 }}>預覽</div>
        <div className="preview-badges">
          <span className={`mode-badge mode-badge-${mode}`}>
            {isSingle ? 'Single' : 'Dual'}
          </span>
          <span className={`prop-badge prop-badge-${spacing ? 'spacing' : 'typography'}`}>
            {PROPERTY_LABELS[propertyType]}
          </span>
        </div>
      </div>

      {/* ── SINGLE MODE ── */}
      {isSingle && (
        <>
          {!metrics.isValid && metrics.errorMessage && (
            <div className="error-msg">{metrics.errorMessage}</div>
          )}

          {metrics.mode === 'single' && metrics.desktopPoint && metrics.mobilePoint && (
            <div className="design-points-stack">
              {metrics.mobileDesignPoint && (
                <div className="dp-row dp-row-design">
                  <span className="dp-tag-inline dp-tag-design">Design</span>
                  <span className="dp-row-label">Mobile</span>
                  <span className="dp-row-val dp-dim">
                    ({metrics.mobileDesignPoint.viewport}px,&nbsp;{metrics.mobileDesignPoint.value}px)
                  </span>
                  {metrics.mobileScale !== null && (
                    <span className="dp-scale">× {metrics.mobileScale.toFixed(3)}</span>
                  )}
                </div>
              )}
              <div className="dp-row dp-row-target">
                <span className="dp-tag-inline dp-tag-target">Target</span>
                <span className="dp-row-label">Mobile</span>
                <span className="dp-row-val">
                  ({metrics.mobilePoint.viewport}px,&nbsp;{metrics.mobilePoint.value.toFixed(2)}px)
                </span>
              </div>
              <div className="dp-row dp-row-desktop">
                <span className="dp-tag-inline dp-tag-desktop">Desktop</span>
                <span className="dp-row-label">&nbsp;</span>
                <span className="dp-row-val">
                  ({metrics.desktopPoint.viewport}px,&nbsp;{metrics.desktopPoint.value}px)
                </span>
              </div>
              <div className="dp-note">
                Clamp 使用&nbsp;
                <span className="dp-note-highlight">
                  ({metrics.desktopPoint.viewport}, {metrics.desktopPoint.value})
                </span>
                &nbsp;與&nbsp;
                <span className="dp-note-highlight">
                  ({metrics.mobilePoint.viewport}, {metrics.mobilePoint.value.toFixed(2)})
                </span>
              </div>
            </div>
          )}

          <div className="preview-visual">
            {!spacing ? (
              <div className="preview-text" style={{ fontSize: pxString }}>
                將藝術成為生活，在生活中發現無限的可能
              </div>
            ) : (
              <SpacingPreview clampString={pxString} />
            )}
          </div>

          <div className="clamp-row">
            <div className="clamp-primary-wrap">
              <span className="clamp-unit-label">{primaryLabel}</span>
              <code className="clamp-code">{primaryString}</code>
            </div>
            <button className="copy-btn" onClick={handleCopy}>
              {copied ? '✓ 已複製' : '複製'}
            </button>
          </div>

          {metrics.isValid && primaryString !== secondaryString && (
            <div className="clamp-secondary">
              <span className="clamp-secondary-label">
                {outputUnitMode === 'rem' ? 'px' : outputUnitMode === 'px' ? 'rem' : autoUsesRem ? 'px' : 'rem'}
              </span>
              <code className="clamp-secondary-code">{secondaryString}</code>
            </div>
          )}

          {strategy && !isLowDiff && (
            <div className={`strategy-note${strategy.clampPolicy === 'large-only' ? ' strategy-note-warn' : ''}`}>
              {strategy.clampPolicy === 'large-only' && <span className="strategy-note-icon">⚠</span>}
              <span className="strategy-note-text">
                {strategy.clampPolicy === 'always'     && '建議使用 clamp() 做響應式縮放。'}
                {strategy.clampPolicy === 'large-only' && '建議僅在大型間距（section/hero）使用 clamp()；小型元件優先 rem。'}
                {strategy.clampPolicy === 'avoid'      && '此屬性不建議使用 clamp()，應使用靜態值。'}
              </span>
            </div>
          )}

          {isLowDiff && suggestedRem && (
            <div className="rem-suggest">
              <div className="rem-suggest-header">
                <span className="rem-suggest-badge">建議固定值</span>
                <span className="rem-suggest-reason">差距僅 {diffPx.toFixed(1)}px，clamp() 不划算</span>
              </div>
              <div className="rem-suggest-row">
                <code className="rem-suggest-value">{suggestedRem}</code>
                <button className="rem-suggest-copy" onClick={handleCopyRem}>
                  {copiedRem ? '✓ 已複製' : '複製'}
                </button>
              </div>
              <div className="rem-suggest-sub">
                clamp() 參考：<code>{primaryString}</code>
              </div>
            </div>
          )}

          <div className="metrics-grid">
            <Metric label="slopeVw" value={`${metrics.slopeVw.toFixed(4)}vw`} />
            <Metric label="basePx"  value={`${metrics.basePx.toFixed(2)}px`} />
            <Metric label="min"     value={`${metrics.minValue.toFixed(2)}px`} accent="red" />
            <Metric label="max"     value={`${metrics.maxValue.toFixed(2)}px`} accent="green" />
          </div>
        </>
      )}

      {/* ── DUAL MODE ── */}
      {!isSingle && dualData && (
        <>
          {!dualData.isValid && dualData.errorMessage && (
            <div className="error-msg">{dualData.errorMessage}</div>
          )}

          {dualData.isValid && (
            <>
              <DualCssBlock
                dualData={dualData}
                outputUnitMode={outputUnitMode}
                autoUsesRem={autoUsesRem}
                propertyType={propertyType}
              />

              <div className="dual-metrics">
                <div className="dual-metrics-seg">
                  <span className="dual-metrics-title portrait-title">直向</span>
                  <div className="metrics-grid">
                    <Metric label="slopeVw" value={`${dualData.portrait.slopeVw.toFixed(4)}vw`} />
                    <Metric label="min"     value={`${dualData.portrait.minValue.toFixed(2)}px`} accent="red" />
                    <Metric label="max"     value={`${dualData.portrait.maxValue.toFixed(2)}px`} accent="green" />
                  </div>
                </div>
                <div className="dual-metrics-seg">
                  <span className="dual-metrics-title landscape-title">橫向</span>
                  <div className="metrics-grid">
                    <Metric label="slopeVw" value={`${dualData.landscape.slopeVw.toFixed(4)}vw`} />
                    <Metric label="min"     value={`${dualData.landscape.minValue.toFixed(2)}px`} accent="red" />
                    <Metric label="max"     value={`${dualData.landscape.maxValue.toFixed(2)}px`} accent="green" />
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

interface MetricProps { label: string; value: string; accent?: 'red' | 'green' }
const Metric: React.FC<MetricProps> = ({ label, value, accent }) => (
  <div className="metric">
    <span className="metric-label">{label}</span>
    <span className={`metric-value${accent ? ` metric-${accent}` : ''}`}>{value}</span>
  </div>
);
