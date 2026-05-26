import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { TokenKey, TypographyTokenKey, SpacingTokenKey, TokenValueMap, ResponsiveTokenInput, CustomTokenItem } from '../types';
import { computeTwoPointMetrics } from '../utils/clamp';
import { buildDefaultTokenMap, TYPOGRAPHY_TOKEN_KEYS, SPACING_TOKEN_KEYS, WRAPPER_TYPOGRAPHY_KEYS } from '../data/tokenDefaults';
import { TokenInputGrid } from '../components/tokens/TokenInputGrid';
import type { ClampPair, TypoMbMap } from '../components/tokens/TokenInputGrid';
import { TokenLayoutPreview } from '../components/tokens/TokenLayoutPreview';

const DESKTOP_BREAKPOINT = 992;

// ── Internal types ──

interface ClampMath {
  minValue: number;
  basePx: number;
  slopeVw: number;
  maxValue: number;
}

export interface ClampMathPair {
  mobile: ClampMath | null;
  desktop: ClampMath | null;
}

type ClampResultMap = Record<TokenKey, ClampPair>;
type ClampMathMap = Partial<Record<string, ClampMathPair>>;

// ── Helpers ──

function computeClampForRange(
  input: ResponsiveTokenInput,
  propertyType: 'font-size' | 'spacing',
): { clampStr: string; math: ClampMath } | null {
  const { minWidth, maxWidth, minPx, maxPx } = input;
  if (minPx === '' || maxPx === '') return null;

  const metrics = computeTwoPointMetrics({
    desktopViewportWidth: maxWidth,
    desktopValue: maxPx as number,
    mobileDesignWidth: minWidth,
    mobileDesignValue: minPx as number,
    mobileTargetWidth: minWidth,
    propertyType,
  });

  if (!metrics.isValid) return null;
  return {
    clampStr: metrics.clampString,
    math: {
      minValue: metrics.minValue,
      basePx: metrics.basePx,
      slopeVw: metrics.slopeVw,
      maxValue: metrics.maxValue,
    },
  };
}

function buildClampData(
  tokens: TokenValueMap,
  customTokens: CustomTokenItem[],
): { results: ClampResultMap; mathMap: ClampMathMap; customResultMap: Record<string, ClampPair> } {
  const results = {} as ClampResultMap;
  const mathMap: ClampMathMap = {};

  for (const key of [...TYPOGRAPHY_TOKEN_KEYS, ...SPACING_TOKEN_KEYS] as TokenKey[]) {
    const token = tokens[key];
    const propType = token.category === 'typography' ? 'font-size' : 'spacing';
    const mobileResult = computeClampForRange(token.mobile, propType);
    const desktopResult = computeClampForRange(token.desktop, propType);
    results[key] = {
      mobile: mobileResult?.clampStr ?? '',
      desktop: desktopResult?.clampStr ?? '',
    };
    if (mobileResult || desktopResult) {
      mathMap[key] = {
        mobile: mobileResult?.math ?? null,
        desktop: desktopResult?.math ?? null,
      };
    }
  }

  const customResultMap: Record<string, ClampPair> = {};
  for (const ct of customTokens) {
    const propType = ct.category === 'typography' ? 'font-size' : 'spacing';
    const mobileResult = computeClampForRange(ct.mobile, propType);
    const desktopResult = computeClampForRange(ct.desktop, propType);
    customResultMap[ct.id] = {
      mobile: mobileResult?.clampStr ?? '',
      desktop: desktopResult?.clampStr ?? '',
    };
  }

  return { results, mathMap, customResultMap };
}

function mbPxToUnit(mbPx: number | '', refFontPx: number | ''): string | null {
  if (mbPx === '') return null;
  const hasRef = refFontPx !== '' && (refFontPx as number) > 0;
  const divisor = hasRef ? (refFontPx as number) : 16;
  const unit = hasRef ? 'em' : 'rem';
  return parseFloat(((mbPx as number) / divisor).toFixed(3)) + unit;
}

function buildTypoOutput(
  tokens: TokenValueMap,
  clampResults: ClampResultMap,
  typoMb: TypoMbMap,
  customTokens: CustomTokenItem[],
  customResultMap: Record<string, ClampPair>,
): string {
  const mobileTypoBlocks: string[] = [];
  const desktopTypoBlocks: string[] = [];

  // Predefined typography tokens
  for (const key of TYPOGRAPHY_TOKEN_KEYS) {
    const pair = clampResults[key];
    const mb = typoMb[key];
    const mbUnit = mbPxToUnit(mb ?? '', tokens[key].desktop.maxPx);
    const mbDecl = mbUnit ? `\n  margin-bottom: ${mbUnit};` : '';

    if (WRAPPER_TYPOGRAPHY_KEYS.has(key)) {
      if (mbUnit) mobileTypoBlocks.push(`${key} {${mbDecl}\n}`);
    } else {
      if (pair.mobile) mobileTypoBlocks.push(`${key} {\n  font-size: ${pair.mobile};${mbDecl}\n}`);
      if (pair.desktop) {
        desktopTypoBlocks.push(`${key} {\n  font-size: ${pair.desktop};${mbDecl}\n}`);
      } else if (!pair.mobile && mbUnit) {
        mobileTypoBlocks.push(`${key} {\n  margin-bottom: ${mbUnit};\n}`);
      }
    }
  }

  // Custom typography tokens
  for (const ct of customTokens.filter((t) => t.category === 'typography' && t.key.trim())) {
    const pair = customResultMap[ct.id] ?? { mobile: '', desktop: '' };
    const mbUnit = mbPxToUnit(ct.mbPx, ct.desktop.maxPx);
    const mbDecl = mbUnit ? `\n  margin-bottom: ${mbUnit};` : '';
    if (pair.mobile) mobileTypoBlocks.push(`${ct.key} {\n  font-size: ${pair.mobile};${mbDecl}\n}`);
    if (pair.desktop) desktopTypoBlocks.push(`${ct.key} {\n  font-size: ${pair.desktop};${mbDecl}\n}`);
    else if (!pair.mobile && mbUnit) mobileTypoBlocks.push(`${ct.key} {\n  margin-bottom: ${mbUnit};\n}`);
  }

  const parts: string[] = [];
  if (mobileTypoBlocks.length > 0) parts.push(mobileTypoBlocks.join('\n\n'));
  if (desktopTypoBlocks.length > 0) {
    const inner = desktopTypoBlocks.map((b) => b.split('\n').map((l) => `  ${l}`).join('\n')).join('\n\n');
    parts.push(`@media (min-width: ${DESKTOP_BREAKPOINT}px) {\n${inner}\n}`);
  }
  return parts.join('\n\n');
}

function buildSpacingOutput(
  clampResults: ClampResultMap,
  customTokens: CustomTokenItem[],
  customResultMap: Record<string, ClampPair>,
): string {
  const get = (key: SpacingTokenKey, scope: 'mobile' | 'desktop') =>
    clampResults[key]?.[scope] ?? '';

  const varName = (key: SpacingTokenKey, scope: 'mobile' | 'desktop') => {
    const base = '$' + key.replace(/^--/, '');
    return key === '--container-max-width' ? base : `${base}-${scope}`;
  };

  const line = (key: SpacingTokenKey, scope: 'mobile' | 'desktop') => {
    const val = get(key, scope);
    return val ? `${varName(key, scope)}: ${val};` : null;
  };

  const groups: Array<{ comment: string; lines: Array<string | null> }> = [
    {
      comment: '/* Section Spacing - Mobile */',
      lines: [line('--section-py', 'mobile'), line('--content-edge', 'mobile')],
    },
    {
      comment: '/* Section Spacing - Desktop */',
      lines: [line('--section-py', 'desktop'), line('--content-edge', 'desktop'), line('--container-max-width', 'desktop')],
    },
    {
      comment: '/* Text Block Padding */',
      lines: [line('--txt-px', 'mobile'), line('--txt-py', 'mobile'), line('--txt-px', 'desktop'), line('--txt-py', 'desktop')],
    },
  ];

  const parts = groups
    .map(({ comment, lines }) => {
      const filled = lines.filter(Boolean) as string[];
      return filled.length ? `${comment}\n${filled.join('\n')}` : null;
    })
    .filter(Boolean) as string[];

  // Custom spacing tokens
  const customSpacing = customTokens.filter((t) => t.category === 'spacing' && t.key.trim());
  if (customSpacing.length > 0) {
    const lines: string[] = [];
    for (const ct of customSpacing) {
      const pair = customResultMap[ct.id] ?? { mobile: '', desktop: '' };
      const base = '$' + ct.key.replace(/^--/, '');
      if (pair.mobile) lines.push(`${base}-mobile: ${pair.mobile};`);
      if (pair.desktop) lines.push(`${base}-desktop: ${pair.desktop};`);
    }
    if (lines.length > 0) parts.push(`/* Custom */\n${lines.join('\n')}`);
  }

  return parts.join('\n\n');
}

// ── localStorage ──

const LS_TOKENS = 'clamptool-tokens-v3';
const LS_MB = 'clamptool-typomb-v3';
const LS_CUSTOM = 'clamptool-custom-v1';

const DEFAULT_MOBILE_INPUT = { minWidth: 390, maxWidth: 991, minPx: '' as const, maxPx: '' as const };
const DEFAULT_DESKTOP_INPUT = { minWidth: 992, maxWidth: 1920, minPx: '' as const, maxPx: '' as const };

function loadTokens(): TokenValueMap {
  try {
    const raw = localStorage.getItem(LS_TOKENS);
    if (raw) {
      const stored = JSON.parse(raw) as Partial<TokenValueMap>;
      const map = { ...buildDefaultTokenMap(), ...stored };
      // --container-max-width is desktop-only:
      //   1. always wipe mobile inputs (never used)
      //   2. wipe desktop minPx if it looks like a spinner accident (< 100 is never a valid max-width)
      const cmw = map['--container-max-width'];
      map['--container-max-width'] = {
        ...cmw,
        mobile: { ...cmw.mobile, minPx: '', maxPx: '' },
        desktop: {
          ...cmw.desktop,
          minPx:
            typeof cmw.desktop.minPx === 'number' && cmw.desktop.minPx < 100
              ? ''
              : cmw.desktop.minPx,
        },
      };
      return map;
    }
  } catch {}
  return buildDefaultTokenMap();
}

function loadTypoMb(): TypoMbMap {
  try {
    const raw = localStorage.getItem(LS_MB);
    if (raw) return JSON.parse(raw) as TypoMbMap;
  } catch {}
  return {};
}

function loadCustomTokens(): CustomTokenItem[] {
  try {
    const raw = localStorage.getItem(LS_CUSTOM);
    if (raw) return JSON.parse(raw) as CustomTokenItem[];
  } catch {}
  return [];
}

// ── Component ──

export const TokensPage: React.FC = () => {
  const [tokens, setTokens] = useState<TokenValueMap>(loadTokens);
  const [typoMb, setTypoMb] = useState<TypoMbMap>(loadTypoMb);
  const [customTokens, setCustomTokens] = useState<CustomTokenItem[]>(loadCustomTokens);

  // Track which minPx fields were set by auto-fill (key = `tokenKey:scope`).
  // Auto-filled values continue to update while maxPx changes; manually-typed values are never overwritten.
  const autoFilledKeys = useRef<Set<string>>(new Set());
  const [previewDesktopWidth, setPreviewDesktopWidth] = useState(1920);
  const [previewMobileWidth, setPreviewMobileWidth] = useState(390);
  const [typoCopied, setTypoCopied] = useState(false);
  const [spacingCopied, setSpacingCopied] = useState(false);

  // Auto-save to localStorage
  useEffect(() => { localStorage.setItem(LS_TOKENS, JSON.stringify(tokens)); }, [tokens]);
  useEffect(() => { localStorage.setItem(LS_MB, JSON.stringify(typoMb)); }, [typoMb]);
  useEffect(() => { localStorage.setItem(LS_CUSTOM, JSON.stringify(customTokens)); }, [customTokens]);

  const { results: clampResults, mathMap, customResultMap } = useMemo(
    () => buildClampData(tokens, customTokens),
    [tokens, customTokens],
  );

  const typoOutput = useMemo(
    () => buildTypoOutput(tokens, clampResults, typoMb, customTokens, customResultMap),
    [tokens, clampResults, typoMb, customTokens, customResultMap],
  );
  const spacingOutput = useMemo(
    () => buildSpacingOutput(clampResults, customTokens, customResultMap),
    [clampResults, customTokens, customResultMap],
  );

  // ── Predefined token handlers ──

  const handleTokenChange = useCallback(
    (key: TokenKey, scope: 'mobile' | 'desktop', field: 'minPx' | 'maxPx', raw: string) => {
      const autoKey = `${key}:${scope}`;
      setTokens((prev) => {
        const scopeData = prev[key][scope];
        const newVal = raw === '' ? '' : parseFloat(raw);
        const updated = { ...scopeData, [field]: newVal };

        if (field === 'maxPx' && raw !== '') {
          // Auto-fill minPx if it's empty OR was previously auto-filled by us
          if (scopeData.minPx === '' || autoFilledKeys.current.has(autoKey)) {
            updated.minPx = parseFloat((parseFloat(raw) * scopeData.minWidth / scopeData.maxWidth).toFixed(1));
            autoFilledKeys.current.add(autoKey);
          }
        }
        if (field === 'minPx') {
          // User manually edited minPx — stop overwriting it
          autoFilledKeys.current.delete(autoKey);
        }

        return { ...prev, [key]: { ...prev[key], [scope]: updated } };
      });
    },
    [],
  );

  const handleMbChange = useCallback((key: TypographyTokenKey, raw: string) => {
    setTypoMb((prev) => ({
      ...prev,
      [key]: raw === '' ? '' : parseFloat(raw),
    }));
  }, []);

  const handleClearToken = useCallback((key: TokenKey) => {
    autoFilledKeys.current.delete(`${key}:mobile`);
    autoFilledKeys.current.delete(`${key}:desktop`);
    setTokens((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        mobile: { ...prev[key].mobile, minPx: '', maxPx: '' },
        desktop: { ...prev[key].desktop, minPx: '', maxPx: '' },
      },
    }));
    setTypoMb((prev) => {
      const next = { ...prev };
      delete next[key as TypographyTokenKey];
      return next;
    });
  }, []);

  const handleClearAll = useCallback(() => {
    autoFilledKeys.current.clear();
    setTokens(buildDefaultTokenMap());
    setTypoMb({});
    setCustomTokens([]);
  }, []);

  // ── Custom token handlers ──

  const handleAddCustom = useCallback((category: 'typography' | 'spacing') => {
    const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setCustomTokens((prev) => [
      ...prev,
      { id, key: '', category, mobile: { ...DEFAULT_MOBILE_INPUT }, desktop: { ...DEFAULT_DESKTOP_INPUT }, mbPx: '' },
    ]);
  }, []);

  const handleCustomKeyChange = useCallback((id: string, key: string) => {
    setCustomTokens((prev) => prev.map((t) => (t.id === id ? { ...t, key } : t)));
  }, []);

  const handleCustomChange = useCallback(
    (id: string, scope: 'mobile' | 'desktop', field: 'minPx' | 'maxPx', raw: string) => {
      const autoKey = `${id}:${scope}`;
      setCustomTokens((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t;
          const scopeData = t[scope];
          const updated = { ...scopeData, [field]: raw === '' ? '' : parseFloat(raw) };

          if (field === 'maxPx' && raw !== '') {
            if (scopeData.minPx === '' || autoFilledKeys.current.has(autoKey)) {
              updated.minPx = parseFloat((parseFloat(raw) * scopeData.minWidth / scopeData.maxWidth).toFixed(1));
              autoFilledKeys.current.add(autoKey);
            }
          }
          if (field === 'minPx') {
            autoFilledKeys.current.delete(autoKey);
          }

          return { ...t, [scope]: updated };
        }),
      );
    },
    [],
  );

  const handleCustomMbChange = useCallback((id: string, raw: string) => {
    setCustomTokens((prev) =>
      prev.map((t) => (t.id === id ? { ...t, mbPx: raw === '' ? '' : parseFloat(raw) } : t)),
    );
  }, []);

  const handleCustomDelete = useCallback((id: string) => {
    autoFilledKeys.current.delete(`${id}:mobile`);
    autoFilledKeys.current.delete(`${id}:desktop`);
    setCustomTokens((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── Copy handlers ──

  const handleCopyTypo = () => {
    navigator.clipboard.writeText(typoOutput).then(() => {
      setTypoCopied(true);
      setTimeout(() => setTypoCopied(false), 1400);
    });
  };

  const handleCopySpacing = () => {
    navigator.clipboard.writeText(spacingOutput).then(() => {
      setSpacingCopied(true);
      setTimeout(() => setSpacingCopied(false), 1400);
    });
  };

  return (
    <div className="tokens-page">
      {/* Toolbar */}
      <div className="tokens-viewport-bar">
        <span className="vp-bar-label">Preview at</span>
        <label className="vp-field">
          <span className="vp-label">Desktop</span>
          <input
            type="number"
            className="vp-input"
            min={800}
            step={1}
            value={previewDesktopWidth}
            onChange={(e) => setPreviewDesktopWidth(parseFloat(e.target.value) || 1920)}
          />
          <span className="vp-unit">px</span>
        </label>
        <label className="vp-field">
          <span className="vp-label">Mobile</span>
          <input
            type="number"
            className="vp-input"
            min={320}
            step={1}
            value={previewMobileWidth}
            onChange={(e) => setPreviewMobileWidth(parseFloat(e.target.value) || 390)}
          />
          <span className="vp-unit">px</span>
        </label>
        <button className="vp-clear-btn" onClick={handleClearAll}>全部清除</button>
      </div>

      {/* Main: input + preview */}
      <div className="tokens-body">
        <div className="tokens-input-col">
          <TokenInputGrid
            tokens={tokens}
            clampResults={clampResults}
            customTokens={customTokens}
            customResultMap={customResultMap}
            typoMb={typoMb}
            onTokenChange={handleTokenChange}
            onMbChange={handleMbChange}
            onClearToken={handleClearToken}
            onAddCustom={handleAddCustom}
            onCustomKeyChange={handleCustomKeyChange}
            onCustomChange={handleCustomChange}
            onCustomMbChange={handleCustomMbChange}
            onCustomDelete={handleCustomDelete}
          />
        </div>
        <div className="tokens-preview-col">
          <div className="panel-title" style={{ marginBottom: 12 }}>Layout Preview</div>
          <TokenLayoutPreview
            clampMathMap={mathMap}
            typoMb={typoMb}
            desktopWidth={previewDesktopWidth}
            mobileWidth={previewMobileWidth}
          />
        </div>
      </div>

      {/* Typography Output */}
      <div className="tokens-output panel">
        <div className="tokens-output-header">
          <div className="panel-title" style={{ marginBottom: 0 }}>Typography CSS</div>
          <button className="copy-btn" disabled={typoOutput === ''} onClick={handleCopyTypo}>
            {typoCopied ? '✓ 已複製' : '複製'}
          </button>
        </div>
        {typoOutput ? (
          <pre className="tokens-output-code">{typoOutput}</pre>
        ) : (
          <div className="tokens-output-empty">填入 min/max 值後才會輸出 CSS</div>
        )}
      </div>

      {/* Spacing Output */}
      <div className="tokens-output panel">
        <div className="tokens-output-header">
          <div className="panel-title" style={{ marginBottom: 0 }}>Spacing Variables</div>
          <button className="copy-btn" disabled={spacingOutput === ''} onClick={handleCopySpacing}>
            {spacingCopied ? '✓ 已複製' : '複製'}
          </button>
        </div>
        <div className="tokens-output-hint">
          貼至 <code>scss/_variables.scss</code> — 全站共用排版間距變數
        </div>
        {spacingOutput ? (
          <pre className="tokens-output-code">{spacingOutput}</pre>
        ) : (
          <div className="tokens-output-empty">填入 spacing min/max 值後才會輸出</div>
        )}
      </div>
    </div>
  );
};
