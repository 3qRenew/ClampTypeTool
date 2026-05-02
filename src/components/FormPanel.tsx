import React from 'react';
import type { AppState, ClampMode, PropertyType, SingleConfig, SegmentConfig, OutputUnitMode } from '../types';
import { getStrategyForPropertyType, CATEGORY_LABELS } from '../data/unitStrategy';

interface Props {
  state: AppState;
  onStateChange: (s: AppState) => void;
}

// ── Preset definitions ──

interface SinglePreset {
  label: string;
  sub: string;
  propertyType: PropertyType;
  desktopValue: number;
  mobileDesignValue: number;
}

const TYPOGRAPHY_PRESETS: SinglePreset[] = [
  { label: 'Hero Title',   sub: '66→55', propertyType: 'font-size', desktopValue: 66,  mobileDesignValue: 55 },
  { label: 'Body Large',   sub: '24→18', propertyType: 'font-size', desktopValue: 24,  mobileDesignValue: 18 },
  { label: 'Body Normal',  sub: '20→16', propertyType: 'font-size', desktopValue: 20,  mobileDesignValue: 16 },
  { label: 'Heading',      sub: '48→34', propertyType: 'font-size', desktopValue: 48,  mobileDesignValue: 34 },
];

const SPACING_PRESETS: SinglePreset[] = [
  { label: 'Section Y',      sub: '120→64', propertyType: 'spacing', desktopValue: 120, mobileDesignValue: 64 },
  { label: 'Block Gap',      sub: '48→24',  propertyType: 'spacing', desktopValue: 48,  mobileDesignValue: 24 },
  { label: 'Card Padding',   sub: '40→20',  propertyType: 'spacing', desktopValue: 40,  mobileDesignValue: 20 },
  { label: 'Content Offset', sub: '80→32',  propertyType: 'spacing', desktopValue: 80,  mobileDesignValue: 32 },
];

interface DualPreset {
  label: string;
  sub: string;
  propertyType: PropertyType;
  portrait: SegmentConfig;
  landscape: SegmentConfig;
}

const DUAL_PRESETS: DualPreset[] = [
  {
    label: 'Body Text',
    sub: '直9.6→25 / 橫9.3→18',
    propertyType: 'font-size',
    portrait:  { minViewport: 375, minValue: 9.6, maxViewport: 991, maxValue: 25 },
    landscape: { minViewport: 992, minValue: 9.3, maxViewport: 1920, maxValue: 18 },
  },
  {
    label: 'Heading LG',
    sub: '直14→36 / 橫12→28',
    propertyType: 'font-size',
    portrait:  { minViewport: 375, minValue: 14, maxViewport: 991, maxValue: 36 },
    landscape: { minViewport: 992, minValue: 12, maxViewport: 1920, maxValue: 28 },
  },
  {
    label: 'Section Spacing',
    sub: '直24→64 / 橫32→120',
    propertyType: 'spacing',
    portrait:  { minViewport: 375, minValue: 24, maxViewport: 991, maxValue: 64 },
    landscape: { minViewport: 992, minValue: 32, maxViewport: 1920, maxValue: 120 },
  },
];

const PROPERTY_OPTIONS: { value: PropertyType; label: string }[] = [
  { value: 'font-size', label: 'Font Size' },
  { value: 'spacing',   label: 'Spacing'   },
];

// ── Helpers ──

const CLAMP_POLICY_LABELS: Record<string, string> = {
  always:     'clamp() 推薦',
  'large-only': 'clamp() 大型間距',
  avoid:      'clamp() 不適用',
};
const CLAMP_POLICY_CLASSES: Record<string, string> = {
  always:     'policy-always',
  'large-only': 'policy-large',
  avoid:      'policy-avoid',
};

// ── Component ──

export const FormPanel: React.FC<Props> = ({ state, onStateChange }) => {
  const { mode, single, dual } = state;

  const setMode = (m: ClampMode) => onStateChange({ ...state, mode: m });

  const setS = (key: keyof SingleConfig, raw: string) => {
    const value = key === 'propertyType' ? raw : parseFloat(raw) || 0;
    onStateChange({ ...state, single: { ...single, [key]: value } });
  };

  const setDualProp = (pt: PropertyType) =>
    onStateChange({ ...state, dual: { ...dual, propertyType: pt } });

  const setSegment = (seg: 'portrait' | 'landscape', key: keyof SegmentConfig, raw: string) => {
    const value = parseFloat(raw) || 0;
    onStateChange({
      ...state,
      dual: { ...dual, [seg]: { ...dual[seg], [key]: value } },
    });
  };

  const setOutputUnitMode = (m: OutputUnitMode) =>
    onStateChange({ ...state, outputUnitMode: m });

  const applySinglePreset = (p: SinglePreset) => {
    onStateChange({
      ...state,
      mode: 'single',
      single: {
        ...single,
        propertyType: p.propertyType,
        desktopValue: p.desktopValue,
        mobileDesignValue: p.mobileDesignValue,
        desktopViewportWidth: 1920,
        mobileDesignWidth: 610,
      },
    });
  };

  const applyDualPreset = (p: DualPreset) => {
    onStateChange({
      ...state,
      mode: 'dual',
      dual: { propertyType: p.propertyType, portrait: p.portrait, landscape: p.landscape },
    });
  };

  const activePropertyType = mode === 'dual' ? dual.propertyType : single.propertyType;
  const strategy = getStrategyForPropertyType(activePropertyType);

  return (
    <div className="form-panel">
      {/* Mode tabs */}
      <div className="mode-tabs">
        {(['single', 'dual'] as ClampMode[]).map((m) => (
          <button
            key={m}
            className={`mode-tab${mode === m ? ' active' : ''}`}
            onClick={() => setMode(m)}
          >
            {m === 'single' ? 'Single' : 'Dual'}
          </button>
        ))}
      </div>

      {/* Property selector */}
      <div className="section-label">Property</div>
      <Field label="propertyType">
        <select
          value={activePropertyType}
          onChange={(e) =>
            mode === 'dual'
              ? setDualProp(e.target.value as PropertyType)
              : setS('propertyType', e.target.value)
          }
        >
          {PROPERTY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </Field>

      {/* Strategy card */}
      {strategy && (
        <div className="strategy-card">
          <div className="strategy-card-header">
            <span className="strategy-category">{CATEGORY_LABELS[strategy.category]}</span>
            {strategy.clampPolicy && (
              <span className={`strategy-policy ${CLAMP_POLICY_CLASSES[strategy.clampPolicy]}`}>
                {CLAMP_POLICY_LABELS[strategy.clampPolicy]}
              </span>
            )}
          </div>
          <div className="strategy-units-row">
            <span className="strategy-units-label">建議</span>
            <span className="strategy-units">
              {strategy.recommendedUnits.map((u) => (
                <code key={u} className="unit-chip unit-chip-ok">{u}</code>
              ))}
            </span>
          </div>
          <div className="strategy-units-row">
            <span className="strategy-units-label">避免</span>
            <span className="strategy-units">
              {strategy.avoidUnits.map((u) => (
                <code key={u} className="unit-chip unit-chip-avoid">{u}</code>
              ))}
            </span>
          </div>
        </div>
      )}

      {/* Output unit */}
      <div className="section-label">Output Unit</div>
      <div className="output-unit-tabs">
        {(['auto', 'px', 'rem'] as OutputUnitMode[]).map((m) => (
          <button
            key={m}
            className={`output-unit-tab${state.outputUnitMode === m ? ' active' : ''}`}
            onClick={() => setOutputUnitMode(m)}
          >
            {m === 'auto' ? 'Auto' : m.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ── SINGLE MODE ── */}
      {mode === 'single' && (
        <>
          <div className="section-label">Typography Presets</div>
          <div className="preset-grid">
            {TYPOGRAPHY_PRESETS.map((p) => (
              <button key={p.label} className="preset-btn" onClick={() => applySinglePreset(p)}>
                <span className="preset-name">{p.label}</span>
                <span className="preset-sub">{p.sub}</span>
              </button>
            ))}
          </div>

          <div className="section-label">Spacing Presets</div>
          <div className="preset-grid">
            {SPACING_PRESETS.map((p) => (
              <button key={p.label} className="preset-btn" onClick={() => applySinglePreset(p)}>
                <span className="preset-name">{p.label}</span>
                <span className="preset-sub">{p.sub}</span>
              </button>
            ))}
          </div>

          <div className="section-label">Desktop</div>
          <Field label="Viewport Width" unit="px">
            <input type="number" min={1} step={1} value={single.desktopViewportWidth}
              onChange={(e) => setS('desktopViewportWidth', e.target.value)} />
          </Field>
          <Field label="Value" unit="px">
            <input type="number" min={0} step={0.5} value={single.desktopValue}
              onChange={(e) => setS('desktopValue', e.target.value)} />
          </Field>

          <div className="section-label">Mobile Design</div>
          <Field label="Artboard Width" unit="px" hint="設計稿寬">
            <input type="number" min={1} step={1} value={single.mobileDesignWidth}
              onChange={(e) => setS('mobileDesignWidth', e.target.value)} />
          </Field>
          <Field label="Value" unit="px">
            <input type="number" min={0} step={0.5} value={single.mobileDesignValue}
              onChange={(e) => setS('mobileDesignValue', e.target.value)} />
          </Field>

          <div className="section-label">Mobile Target</div>
          <div className="target-width-btns">
            {([375, 390, 414] as const).map((w) => (
              <button
                key={w}
                className={`target-btn${single.mobileTargetWidth === w ? ' active' : ''}`}
                onClick={() => setS('mobileTargetWidth', String(w))}
              >
                {w}
              </button>
            ))}
          </div>
          <Field label="Viewport Width" unit="px" hint="實際 viewport">
            <input type="number" min={1} step={1} value={single.mobileTargetWidth}
              onChange={(e) => setS('mobileTargetWidth', e.target.value)} />
          </Field>
        </>
      )}

      {/* ── DUAL MODE ── */}
      {mode === 'dual' && (
        <>
          <div className="section-label">Presets</div>
          <div className="preset-grid">
            {DUAL_PRESETS.map((p) => (
              <button key={p.label} className="preset-btn" onClick={() => applyDualPreset(p)}>
                <span className="preset-name">{p.label}</span>
                <span className="preset-sub dual-sub">{p.sub}</span>
              </button>
            ))}
          </div>

          {/* Portrait segment */}
          <div className="section-label segment-label-portrait">直向 Portrait</div>
          <div className="segment-grid">
            <Field label="Min Viewport" unit="px">
              <input type="number" min={1} step={1} value={dual.portrait.minViewport}
                onChange={(e) => setSegment('portrait', 'minViewport', e.target.value)} />
            </Field>
            <Field label="Min Value" unit="px">
              <input type="number" min={0} step={0.1} value={dual.portrait.minValue}
                onChange={(e) => setSegment('portrait', 'minValue', e.target.value)} />
            </Field>
            <Field label="Max Viewport" unit="px">
              <input type="number" min={1} step={1} value={dual.portrait.maxViewport}
                onChange={(e) => setSegment('portrait', 'maxViewport', e.target.value)} />
            </Field>
            <Field label="Max Value" unit="px">
              <input type="number" min={0} step={0.1} value={dual.portrait.maxValue}
                onChange={(e) => setSegment('portrait', 'maxValue', e.target.value)} />
            </Field>
          </div>

          {/* Breakpoint display */}
          <div className="breakpoint-divider">
            <span className="breakpoint-label">@media (min-width: {dual.landscape.minViewport}px)</span>
          </div>

          {/* Landscape segment */}
          <div className="section-label segment-label-landscape">橫向 Landscape</div>
          <div className="segment-grid">
            <Field label="Min Viewport" unit="px">
              <input type="number" min={1} step={1} value={dual.landscape.minViewport}
                onChange={(e) => setSegment('landscape', 'minViewport', e.target.value)} />
            </Field>
            <Field label="Min Value" unit="px">
              <input type="number" min={0} step={0.1} value={dual.landscape.minValue}
                onChange={(e) => setSegment('landscape', 'minValue', e.target.value)} />
            </Field>
            <Field label="Max Viewport" unit="px">
              <input type="number" min={1} step={1} value={dual.landscape.maxViewport}
                onChange={(e) => setSegment('landscape', 'maxViewport', e.target.value)} />
            </Field>
            <Field label="Max Value" unit="px">
              <input type="number" min={0} step={0.1} value={dual.landscape.maxValue}
                onChange={(e) => setSegment('landscape', 'maxValue', e.target.value)} />
            </Field>
          </div>
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
