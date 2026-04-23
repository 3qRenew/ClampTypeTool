import React from 'react';
import type { AppState, ClampMode, PropertyType, FontType, TwoPointConfig, EstimateConfig } from '../types';

interface Props {
  state: AppState;
  onStateChange: (s: AppState) => void;
}

// ── Preset definitions ──

interface TwoPointPreset {
  label: string;
  sub: string;
  propertyType: PropertyType;
  desktopValue: number;
  mobileDesignValue: number;
}

const TYPOGRAPHY_PRESETS: TwoPointPreset[] = [
  { label: 'Hero Title', sub: '66→55', propertyType: 'font-size', desktopValue: 66, mobileDesignValue: 55 },
  { label: 'Body Large', sub: '24→18', propertyType: 'font-size', desktopValue: 24, mobileDesignValue: 18 },
  { label: 'Body Normal', sub: '20→16', propertyType: 'font-size', desktopValue: 20, mobileDesignValue: 16 },
  { label: 'Heading', sub: '48→34', propertyType: 'font-size', desktopValue: 48, mobileDesignValue: 34 },
];

const SPACING_PRESETS: TwoPointPreset[] = [
  { label: 'Section Y', sub: '120→64', propertyType: 'margin-top', desktopValue: 120, mobileDesignValue: 64 },
  { label: 'Block Gap', sub: '48→24', propertyType: 'gap', desktopValue: 48, mobileDesignValue: 24 },
  { label: 'Card Padding', sub: '40→20', propertyType: 'padding-top', desktopValue: 40, mobileDesignValue: 20 },
  { label: 'Content Offset', sub: '80→32', propertyType: 'margin-top', desktopValue: 80, mobileDesignValue: 32 },
];

interface EstimatePreset {
  label: string;
  partial: Pick<EstimateConfig, 'designSize' | 'type'>;
}

const ESTIMATE_PRESETS: EstimatePreset[] = [
  { label: 'Body / 24', partial: { designSize: 24, type: 'body' } },
  { label: 'Body / 20', partial: { designSize: 20, type: 'body' } },
  { label: 'Lead / 24', partial: { designSize: 24, type: 'lead' } },
  { label: 'Heading / 36', partial: { designSize: 36, type: 'heading' } },
  { label: 'Heading / 48', partial: { designSize: 48, type: 'heading' } },
];

const PROPERTY_OPTIONS: { value: PropertyType; label: string; category: 'typography' | 'spacing' }[] = [
  { value: 'font-size', label: 'Font Size', category: 'typography' },
  { value: 'margin-top', label: 'Margin Top', category: 'spacing' },
  { value: 'margin-bottom', label: 'Margin Bottom', category: 'spacing' },
  { value: 'padding-top', label: 'Padding Top', category: 'spacing' },
  { value: 'padding-bottom', label: 'Padding Bottom', category: 'spacing' },
  { value: 'gap', label: 'Gap', category: 'spacing' },
];

const FONT_TYPES: FontType[] = ['body', 'lead', 'heading'];

// ── Component ──

export const FormPanel: React.FC<Props> = ({ state, onStateChange }) => {
  const { mode, twoPoint, estimate } = state;

  const setMode = (m: ClampMode) => onStateChange({ ...state, mode: m });

  const setTP = (key: keyof TwoPointConfig, raw: string) => {
    const value = key === 'propertyType' ? raw : parseFloat(raw) || 0;
    onStateChange({ ...state, twoPoint: { ...twoPoint, [key]: value } });
  };

  const setEst = (key: keyof EstimateConfig, raw: string) => {
    const value = key === 'type' ? raw : parseFloat(raw) || 0;
    onStateChange({ ...state, estimate: { ...estimate, [key]: value } });
  };

  const applyTwoPointPreset = (p: TwoPointPreset) => {
    onStateChange({
      ...state,
      mode: 'two-point',
      twoPoint: {
        ...twoPoint,
        propertyType: p.propertyType,
        desktopValue: p.desktopValue,
        mobileDesignValue: p.mobileDesignValue,
        desktopViewportWidth: 1920,
        mobileDesignWidth: 610,
        // keep mobileTargetWidth as-is (user's choice)
      },
    });
  };

  return (
    <div className="form-panel">
      {/* Mode switch */}
      <div className="mode-tabs">
        <button
          className={`mode-tab${mode === 'two-point' ? ' active' : ''}`}
          onClick={() => setMode('two-point')}
        >
          Two-point
        </button>
        <button
          className={`mode-tab${mode === 'estimate' ? ' active' : ''}`}
          onClick={() => setMode('estimate')}
        >
          Estimate
        </button>
      </div>

      {mode === 'two-point' && (
        <>
          {/* Property type */}
          <div className="section-label">Property</div>
          <Field label="propertyType">
            <select
              value={twoPoint.propertyType}
              onChange={(e) => setTP('propertyType', e.target.value)}
            >
              <optgroup label="Typography">
                {PROPERTY_OPTIONS.filter((o) => o.category === 'typography').map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </optgroup>
              <optgroup label="Spacing">
                {PROPERTY_OPTIONS.filter((o) => o.category === 'spacing').map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </optgroup>
            </select>
          </Field>

          {/* Typography presets */}
          <div className="section-label">Typography Presets</div>
          <div className="preset-grid">
            {TYPOGRAPHY_PRESETS.map((p) => (
              <button key={p.label} className="preset-btn" onClick={() => applyTwoPointPreset(p)}>
                <span className="preset-name">{p.label}</span>
                <span className="preset-sub">{p.sub}</span>
              </button>
            ))}
          </div>

          {/* Spacing presets */}
          <div className="section-label">Spacing Presets</div>
          <div className="preset-grid">
            {SPACING_PRESETS.map((p) => (
              <button key={p.label} className="preset-btn" onClick={() => applyTwoPointPreset(p)}>
                <span className="preset-name">{p.label}</span>
                <span className="preset-sub">{p.sub}</span>
              </button>
            ))}
          </div>

          {/* Desktop */}
          <div className="section-label">Desktop</div>
          <Field label="Desktop Width" unit="px">
            <input type="number" min={1} step={1} value={twoPoint.desktopViewportWidth}
              onChange={(e) => setTP('desktopViewportWidth', e.target.value)} />
          </Field>
          <Field label="Desktop Value" unit="px">
            <input type="number" min={0} step={0.5} value={twoPoint.desktopValue}
              onChange={(e) => setTP('desktopValue', e.target.value)} />
          </Field>

          {/* Mobile design */}
          <div className="section-label">Mobile Design</div>
          <Field label="Mobile Design Width" unit="px" hint="設計稿寬">
            <input type="number" min={1} step={1} value={twoPoint.mobileDesignWidth}
              onChange={(e) => setTP('mobileDesignWidth', e.target.value)} />
          </Field>
          <Field label="Mobile Design Value" unit="px">
            <input type="number" min={0} step={0.5} value={twoPoint.mobileDesignValue}
              onChange={(e) => setTP('mobileDesignValue', e.target.value)} />
          </Field>

          {/* Mobile target */}
          <div className="section-label">Mobile Target</div>
          <div className="target-width-btns">
            {([375, 390, 414] as const).map((w) => (
              <button
                key={w}
                className={`target-btn${twoPoint.mobileTargetWidth === w ? ' active' : ''}`}
                onClick={() => setTP('mobileTargetWidth', String(w))}
              >
                {w}
              </button>
            ))}
          </div>
          <Field label="Mobile Target Width" unit="px" hint="實際 viewport">
            <input type="number" min={1} step={1} value={twoPoint.mobileTargetWidth}
              onChange={(e) => setTP('mobileTargetWidth', e.target.value)} />
          </Field>
        </>
      )}

      {mode === 'estimate' && (
        <>
          <div className="section-label">快速預設</div>
          <div className="preset-grid">
            {ESTIMATE_PRESETS.map((p) => (
              <button
                key={p.label}
                className="preset-btn"
                onClick={() =>
                  onStateChange({ ...state, estimate: { ...estimate, ...p.partial } })
                }
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="section-label">字級設定</div>
          <Field label="designSize" unit="pt">
            <input type="number" min={1} step={1} value={estimate.designSize}
              onChange={(e) => setEst('designSize', e.target.value)} />
          </Field>
          <Field label="type">
            <select value={estimate.type} onChange={(e) => setEst('type', e.target.value)}>
              {FONT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="minFontSize" unit="px" hint="0=自動">
            <input type="number" min={0} step={0.5} value={estimate.minFontSize}
              onChange={(e) => setEst('minFontSize', e.target.value)} />
          </Field>
          <Field label="maxFontSize" unit="px" hint="0=自動">
            <input type="number" min={0} step={0.5} value={estimate.maxFontSize}
              onChange={(e) => setEst('maxFontSize', e.target.value)} />
          </Field>

          <div className="section-label">Viewport</div>
          <Field label="baseViewport" unit="px">
            <input type="number" min={320} step={1} value={estimate.baseViewport}
              onChange={(e) => setEst('baseViewport', e.target.value)} />
          </Field>
          <Field label="minViewport" unit="px">
            <input type="number" min={320} step={1} value={estimate.minViewport}
              onChange={(e) => setEst('minViewport', e.target.value)} />
          </Field>
          <Field label="maxViewport" unit="px">
            <input type="number" min={320} step={1} value={estimate.maxViewport}
              onChange={(e) => setEst('maxViewport', e.target.value)} />
          </Field>

          <div className="section-label">調整</div>
          <Field label="vwScale" hint="預設 0.8">
            <input type="number" min={0.1} max={2} step={0.05} value={estimate.vwScale}
              onChange={(e) => setEst('vwScale', e.target.value)} />
          </Field>
        </>
      )}
    </div>
  );
};

// ── Field helper ──

interface FieldProps {
  label: string;
  unit?: string;
  hint?: string;
  children: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ label, unit, hint, children }) => (
  <div className="field">
    <label className="field-label">
      {label}
      {unit && <span className="field-unit">{unit}</span>}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
    <div className="field-input">{children}</div>
  </div>
);
