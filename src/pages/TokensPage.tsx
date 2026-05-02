import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { TokenKey, TypographyTokenKey, TokenValueMap, ResponsiveTokenInput } from '../types';
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

function buildClampData(tokens: TokenValueMap): { results: ClampResultMap; mathMap: ClampMathMap } {
  const results = {} as ClampResultMap;
  const mathMap: ClampMathMap = {};

  const allKeys = [...TYPOGRAPHY_TOKEN_KEYS, ...SPACING_TOKEN_KEYS] as TokenKey[];

  for (const key of allKeys) {
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

  return { results, mathMap };
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
): string {
  const mobileTypoBlocks: string[] = [];
  const desktopTypoBlocks: string[] = [];

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

  const parts: string[] = [];
  if (mobileTypoBlocks.length > 0) parts.push(mobileTypoBlocks.join('\n\n'));
  if (desktopTypoBlocks.length > 0) {
    const inner = desktopTypoBlocks.map((b) => b.split('\n').map((l) => `  ${l}`).join('\n')).join('\n\n');
    parts.push(`@media (min-width: ${DESKTOP_BREAKPOINT}px) {\n${inner}\n}`);
  }
  return parts.join('\n\n');
}

function buildSpacingOutput(clampResults: ClampResultMap): string {
  const mobileLines: string[] = [];
  const desktopLines: string[] = [];

  for (const key of SPACING_TOKEN_KEYS) {
    const pair = clampResults[key];
    const scssName = '$' + key.replace(/^--/, '');
    if (pair.mobile) mobileLines.push(`${scssName}: ${pair.mobile};`);
    if (pair.desktop) desktopLines.push(`${scssName}-lg: ${pair.desktop};`);
  }

  const parts: string[] = [];
  if (mobileLines.length > 0) parts.push(`/* Section Spacing - Mobile */\n${mobileLines.join('\n')}`);
  if (desktopLines.length > 0) parts.push(`/* Section Spacing - Desktop */\n${desktopLines.join('\n')}`);
  return parts.join('\n\n');
}

// ── localStorage ──

const LS_TOKENS = 'clamptool-tokens-v2';
const LS_MB = 'clamptool-typomb-v2';

function loadTokens(): TokenValueMap {
  try {
    const raw = localStorage.getItem(LS_TOKENS);
    if (raw) {
      const stored = JSON.parse(raw) as Partial<TokenValueMap>;
      // Merge with defaults so newly-added token keys always exist
      return { ...buildDefaultTokenMap(), ...stored };
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

// ── Component ──

export const TokensPage: React.FC = () => {
  const [tokens, setTokens] = useState<TokenValueMap>(loadTokens);
  const [typoMb, setTypoMb] = useState<TypoMbMap>(loadTypoMb);
  const [previewDesktopWidth, setPreviewDesktopWidth] = useState(1920);
  const [previewMobileWidth, setPreviewMobileWidth] = useState(390);
  const [typoCopied, setTypoCopied] = useState(false);
  const [spacingCopied, setSpacingCopied] = useState(false);

  // Auto-save to localStorage
  useEffect(() => { localStorage.setItem(LS_TOKENS, JSON.stringify(tokens)); }, [tokens]);
  useEffect(() => { localStorage.setItem(LS_MB, JSON.stringify(typoMb)); }, [typoMb]);

  const { results: clampResults, mathMap } = useMemo(() => buildClampData(tokens), [tokens]);

  const typoOutput = useMemo(() => buildTypoOutput(tokens, clampResults, typoMb), [tokens, clampResults, typoMb]);
  const spacingOutput = useMemo(() => buildSpacingOutput(clampResults), [clampResults]);

  const handleTokenChange = useCallback(
    (key: TokenKey, scope: 'mobile' | 'desktop', field: 'minPx' | 'maxPx', raw: string) => {
      setTokens((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          [scope]: {
            ...prev[key][scope],
            [field]: raw === '' ? '' : parseFloat(raw),
          },
        },
      }));
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
    setTokens(buildDefaultTokenMap());
    setTypoMb({});
  }, []);

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
            typoMb={typoMb}
            onTokenChange={handleTokenChange}
            onMbChange={handleMbChange}
            onClearToken={handleClearToken}
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
