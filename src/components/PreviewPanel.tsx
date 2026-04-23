import React, { useState } from 'react';
import type { ClampMetrics, PropertyType } from '../types';

interface Props {
  metrics: ClampMetrics;
}

// ── Property display helpers ──

const PROPERTY_LABELS: Record<PropertyType, string> = {
  'font-size': 'Font Size',
  'margin-top': 'Margin Top',
  'margin-bottom': 'Margin Bottom',
  'padding-top': 'Padding Top',
  'padding-bottom': 'Padding Bottom',
  gap: 'Gap',
};

function isSpacing(pt: PropertyType): boolean {
  return pt !== 'font-size';
}

// ── Spacing visual preview ──

const SpacingPreview: React.FC<{ propertyType: PropertyType; clampString: string }> = ({
  propertyType,
  clampString,
}) => {
  const outerBase: React.CSSProperties = {
    background: '#1a2030',
    border: '1px solid #2a3550',
    borderRadius: 4,
    overflow: 'hidden',
    minHeight: 32,
    maxHeight: 200,
  };
  const block: React.CSSProperties = {
    background: '#2a3a55',
    borderRadius: 3,
    height: 32,
  };
  const label: React.CSSProperties = {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#4a7aaa',
    padding: '3px 8px',
    display: 'block',
  };

  if (propertyType === 'padding-top') {
    return (
      <div style={outerBase}>
        <div style={{ paddingTop: clampString, background: 'rgba(96,165,250,0.06)' }}>
          <div style={block} />
        </div>
        <span style={label}>padding-top: {clampString}</span>
      </div>
    );
  }
  if (propertyType === 'padding-bottom') {
    return (
      <div style={outerBase}>
        <div style={{ paddingBottom: clampString, background: 'rgba(96,165,250,0.06)' }}>
          <div style={block} />
        </div>
        <span style={label}>padding-bottom: {clampString}</span>
      </div>
    );
  }
  if (propertyType === 'margin-top') {
    return (
      <div style={{ ...outerBase, padding: '0 8px 8px' }}>
        <div style={{ ...block, marginBottom: 0 }} />
        <div style={{ ...block, marginTop: clampString, background: '#3a4a65' }} />
        <span style={label}>margin-top: {clampString}</span>
      </div>
    );
  }
  if (propertyType === 'margin-bottom') {
    return (
      <div style={{ ...outerBase, padding: '0 8px 8px' }}>
        <div style={{ ...block, marginBottom: clampString }} />
        <div style={{ ...block, background: '#3a4a65' }} />
        <span style={label}>margin-bottom: {clampString}</span>
      </div>
    );
  }
  if (propertyType === 'gap') {
    return (
      <div style={{ ...outerBase, display: 'flex', flexDirection: 'column', gap: clampString, padding: 8 }}>
        <div style={block} />
        <div style={{ ...block, background: '#3a4a65' }} />
        <span style={{ ...label, padding: '3px 0 0' }}>gap: {clampString}</span>
      </div>
    );
  }
  return null;
};

// ── Main panel ──

export const PreviewPanel: React.FC<Props> = ({ metrics }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(metrics.clampString).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  };

  const isTwoPoint = metrics.mode === 'two-point';
  const spacing = isSpacing(metrics.propertyType);

  return (
    <div className="panel">
      {/* Header row */}
      <div className="preview-header">
        <div className="panel-title" style={{ marginBottom: 0 }}>預覽</div>
        <div className="preview-badges">
          <span className={`mode-badge mode-badge-${metrics.mode}`}>
            {isTwoPoint ? 'Two-point' : 'Estimate'}
          </span>
          <span className={`prop-badge prop-badge-${spacing ? 'spacing' : 'typography'}`}>
            {PROPERTY_LABELS[metrics.propertyType]}
          </span>
        </div>
      </div>

      {/* Error state */}
      {!metrics.isValid && metrics.errorMessage && (
        <div className="error-msg">{metrics.errorMessage}</div>
      )}

      {/* Design points (two-point mode) */}
      {isTwoPoint && metrics.desktopPoint && metrics.mobilePoint && (
        <div className="design-points-stack">
          {/* Design origin row */}
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
          {/* Target mobile row */}
          <div className="dp-row dp-row-target">
            <span className="dp-tag-inline dp-tag-target">Target</span>
            <span className="dp-row-label">Mobile</span>
            <span className="dp-row-val">
              ({metrics.mobilePoint.viewport}px,&nbsp;{metrics.mobilePoint.value.toFixed(2)}px)
            </span>
          </div>
          {/* Desktop row */}
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

      {/* Visual preview */}
      <div className="preview-visual">
        {!spacing ? (
          <div className="preview-text" style={{ fontSize: metrics.clampString }}>
            将艺术成为生活，在生活中发现无限的可能
          </div>
        ) : (
          <SpacingPreview propertyType={metrics.propertyType} clampString={metrics.clampString} />
        )}
      </div>

      {/* Clamp string + copy */}
      <div className="clamp-row">
        <code className="clamp-code">{metrics.clampString}</code>
        <button className="copy-btn" onClick={handleCopy}>
          {copied ? '✓ 已複製' : '複製'}
        </button>
      </div>

      {/* Metrics grid */}
      {isTwoPoint ? (
        <div className="metrics-grid">
          <Metric label="slopeVw" value={`${metrics.slopeVw.toFixed(4)}vw`} />
          <Metric label="basePx" value={`${metrics.basePx.toFixed(2)}px`} />
          <Metric label="minValue" value={`${metrics.minValue.toFixed(2)}px`} accent="red" />
          <Metric label="maxValue" value={`${metrics.maxValue.toFixed(2)}px`} accent="green" />
        </div>
      ) : (
        <div className="metrics-grid">
          <Metric label="desktopSize" value={`${(metrics.estimateDesktopValue ?? 0).toFixed(2)}px`} />
          <Metric label="mobileSize" value={`${(metrics.estimateMobileValue ?? 0).toFixed(2)}px`} />
          <Metric label="rawVw" value={`${(metrics.rawVw ?? 0).toFixed(4)}vw`} />
          <Metric label="adjustedVw" value={`${(metrics.adjustedVw ?? 0).toFixed(4)}vw`} />
          <Metric label="clamp min" value={`${metrics.minValue.toFixed(2)}px`} accent="red" />
          <Metric label="clamp max" value={`${metrics.maxValue.toFixed(2)}px`} accent="green" />
        </div>
      )}
    </div>
  );
};

interface MetricProps {
  label: string;
  value: string;
  accent?: 'red' | 'green';
}

const Metric: React.FC<MetricProps> = ({ label, value, accent }) => (
  <div className="metric">
    <span className="metric-label">{label}</span>
    <span className={`metric-value${accent ? ` metric-${accent}` : ''}`}>{value}</span>
  </div>
);
