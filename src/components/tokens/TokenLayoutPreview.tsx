import React from 'react';
import { getClampedValueAtViewport } from '../../utils/clamp';
import type { ClampMathPair } from '../../pages/TokensPage';
import type { TypoMbMap } from './TokenInputGrid';

// ── Internal types ──

interface ClampMath {
  minValue: number;
  basePx: number;
  slopeVw: number;
  maxValue: number;
}

type ClampMathMap = Partial<Record<string, ClampMathPair>>;

interface ResolvedSpacing {
  paddingX: number;
  paddingY: number;
  gutterX: number;
  gutterY: number;
  textStackGap: number;
}

interface ResolvedTypography {
  enTitle: number | null;
  zhTitle: number | null;
  zhSubtitle: number | null;
  enSubtitle: number | null;
  zhLabel: number | null;
  enLabel: number | null;
  sloganH1: number | null;
  sloganH2: number | null;
  sloganH3: number | null;
  sloganLabel: number | null;
  bodyP: number | null;
  caption: number | null;
}

interface Props {
  clampMathMap: ClampMathMap;
  typoMb: TypoMbMap;
  desktopWidth: number;
  mobileWidth: number;
}

// ── Resolution helpers ──

function resolveAt(math: ClampMath | null | undefined, viewport: number): number | null {
  if (!math) return null;
  return getClampedValueAtViewport(viewport, math.minValue, math.basePx, math.slopeVw, math.maxValue);
}

function getMath(pair: ClampMathPair | undefined, scope: 'mobile' | 'desktop'): ClampMath | null | undefined {
  return pair?.[scope];
}

function resolveSpacing(
  scope: 'mobile' | 'desktop',
  viewport: number,
  clampMathMap: ClampMathMap,
): ResolvedSpacing {
  const get = (key: string) =>
    resolveAt(getMath(clampMathMap[key], scope), viewport) ?? 0;
  return {
    paddingX: get('--section-padding-px'),
    paddingY: get('--section-padding-py'),
    gutterX: get('--section-gutter-x'),
    gutterY: get('--section-gutter-y'),
    textStackGap: get('--text-stack-gap'),
  };
}

function resolveTypography(
  scope: 'mobile' | 'desktop',
  viewport: number,
  clampMathMap: ClampMathMap,
): ResolvedTypography {
  const get = (key: string) => resolveAt(getMath(clampMathMap[key], scope), viewport);
  return {
    enTitle: get('.page-en-title'),
    zhTitle: get('.page-zh-title'),
    zhSubtitle: get('.page-zh-subtitle'),
    enSubtitle: get('.page-en-subtitle'),
    zhLabel: get('.page-zh-label'),
    enLabel: get('.page-en-label'),
    sloganH1: get('.page-slogan-heading1'),
    sloganH2: get('.page-slogan-heading2'),
    sloganH3: get('.page-slogan-heading3'),
    sloganLabel: get('.page-slogan-label'),
    bodyP: get('.txt-body p'),
    caption: get('.page-caption'),
  };
}

// ── Sub-components ──

interface TextLineProps {
  size: number | null;
  children: string;
  color?: string;
  marginBottom: number;
}

const TextLine: React.FC<TextLineProps> = ({ size, children, color = '#d4d4d4', marginBottom }) => {
  if (!size) return null;
  return (
    <div style={{ fontSize: size, color, lineHeight: 1.3, marginBottom: 0, position: 'relative', paddingBottom: marginBottom }}>
      {children}
      {marginBottom > 0 && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: marginBottom,
          background: 'rgba(74,222,128,0.22)',
          pointerEvents: 'none',
        }} />
      )}
    </div>
  );
};

interface CanvasProps {
  label: string;
  displayWidth: number;
  isMobile: boolean;
  spacing: ResolvedSpacing;
  typo: ResolvedTypography;
  typoMb: TypoMbMap;
  scale: number;
}

const PreviewCanvas: React.FC<CanvasProps> = ({
  label, displayWidth, isMobile, spacing, typo, typoMb, scale,
}) => {
  const displayHeight = isMobile ? displayWidth * 1.9 : displayWidth * 0.46;

  // Cap paddings so content area never collapses to zero
  const paddingXScaled = Math.min(spacing.paddingX * scale, displayWidth * 0.32);
  const paddingYScaled = Math.min(spacing.paddingY * scale, displayHeight * 0.28);
  const gutterXScaled = Math.min(spacing.gutterX * scale, (displayWidth - 2 * paddingXScaled) * 0.3);
  const gutterYScaled = Math.max(spacing.gutterY * scale, isMobile ? 8 : 0);

  // Per-token margin-bottom (scaled); fall back to --text-stack-gap then 0
  const globalGapScaled = spacing.textStackGap * scale;
  const mb = (key: string) => {
    const v = typoMb[key as keyof typeof typoMb];
    if (v !== '' && v !== undefined) return (v as number) * scale;
    return globalGapScaled;
  };

  // .txt-title and .txt-body mb are wrapper gaps — rendered as spacer divs
  const txtTitleMb = mb('.txt-title');
  const txtBodyMb = mb('.txt-body');

  const textColumn = (
    <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
      {/* .txt-title block */}
      <TextLine size={typo.enLabel && typo.enLabel * scale} color="#60a5fa" marginBottom={mb('.page-en-label')}>
        EN LABEL
      </TextLine>
      <TextLine size={typo.zhLabel && typo.zhLabel * scale} color="#a0a0a0" marginBottom={mb('.page-zh-label')}>
        中文標籤
      </TextLine>
      <TextLine size={typo.enTitle && typo.enTitle * scale} color="#ffffff" marginBottom={mb('.page-en-title')}>
        English Title
      </TextLine>
      <TextLine size={typo.zhTitle && typo.zhTitle * scale} color="#f0f0f0" marginBottom={mb('.page-zh-title')}>
        中文主標題
      </TextLine>
      <TextLine size={typo.zhSubtitle && typo.zhSubtitle * scale} color="#c0c0c0" marginBottom={mb('.page-zh-subtitle')}>
        中文副標題文字
      </TextLine>
      <TextLine size={typo.enSubtitle && typo.enSubtitle * scale} color="#a8a8a8" marginBottom={0}>
        English Subtitle
      </TextLine>
      {/* .txt-title margin-bottom spacer */}
      {txtTitleMb > 0 && (
        <div style={{ height: txtTitleMb, background: 'rgba(251,191,36,0.18)', position: 'relative' }}>
          <span style={{ position: 'absolute', right: 0, top: 0, fontSize: Math.max(7 * scale, 6), color: '#fbbf24', fontFamily: 'monospace' }}>.txt-title mb</span>
        </div>
      )}
      {/* .txt-body block */}
      <TextLine size={typo.bodyP && typo.bodyP * scale} color="#888" marginBottom={0}>
        內文段落 Body paragraph text goes here.
      </TextLine>
      {/* .txt-body margin-bottom spacer */}
      {txtBodyMb > 0 && (
        <div style={{ height: txtBodyMb, background: 'rgba(251,191,36,0.12)', position: 'relative' }}>
          <span style={{ position: 'absolute', right: 0, top: 0, fontSize: Math.max(7 * scale, 6), color: '#fbbf24', fontFamily: 'monospace' }}>.txt-body mb</span>
        </div>
      )}
      {/* caption */}
      <TextLine size={typo.caption && typo.caption * scale} color="#666" marginBottom={0}>
        圖片僅供參考，實際以現場為準
      </TextLine>
      {/* slogan block */}
      <TextLine size={typo.sloganH1 && typo.sloganH1 * scale} color="#e0e0e0" marginBottom={mb('.page-slogan-heading1')}>
        Slogan Heading 1
      </TextLine>
      <TextLine size={typo.sloganH2 && typo.sloganH2 * scale} color="#d0d0d0" marginBottom={mb('.page-slogan-heading2')}>
        Slogan Heading 2
      </TextLine>
      <TextLine size={typo.sloganH3 && typo.sloganH3 * scale} color="#c8c8c8" marginBottom={mb('.page-slogan-heading3')}>
        Slogan Heading 3
      </TextLine>
      <TextLine size={typo.sloganLabel && typo.sloganLabel * scale} color="#8888aa" marginBottom={mb('.page-slogan-label')}>
        Slogan Label
      </TextLine>
    </div>
  );

  const imagePlaceholder = (
    <div style={{
      flex: isMobile ? 'none' : 1,
      height: isMobile ? displayWidth * 0.48 : undefined,
      background: '#1a2030',
      borderRadius: 3,
      border: '1px solid #2a3550',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
      <span style={{ fontSize: Math.max(10 * scale, 8), color: '#3a4a65', fontFamily: 'monospace' }}>
        image
      </span>
    </div>
  );

  return (
    <div className="preview-canvas-wrap">
      <div className="preview-canvas-label">{label}</div>
      <div style={{
        width: displayWidth,
        height: displayHeight,
        background: '#111418',
        border: '1px solid #2a2a2a',
        borderRadius: 4,
        overflow: 'hidden',
        position: 'relative',
        flexShrink: 0,
      }}>
        {/* Blue section-padding overlays */}
        {paddingYScaled > 0 && <>
          <div style={{ position: 'absolute', inset: '0 0 auto 0', height: paddingYScaled, background: 'rgba(59,130,246,0.18)', zIndex: 2, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: 'auto 0 0 0', height: paddingYScaled, background: 'rgba(59,130,246,0.18)', zIndex: 2, pointerEvents: 'none' }} />
        </>}
        {paddingXScaled > 0 && <>
          <div style={{ position: 'absolute', inset: '0 auto 0 0', width: paddingXScaled, background: 'rgba(59,130,246,0.18)', zIndex: 2, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: '0 0 0 auto', width: paddingXScaled, background: 'rgba(59,130,246,0.18)', zIndex: 2, pointerEvents: 'none' }} />
        </>}

        {/* Content area inside padding */}
        <div style={{
          position: 'absolute',
          inset: `${paddingYScaled}px ${paddingXScaled}px`,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          overflow: 'hidden',
          gap: isMobile ? gutterYScaled : 0,
        }}>
          {isMobile ? (
            <>
              {textColumn}
              {imagePlaceholder}
            </>
          ) : (
            <>
              {imagePlaceholder}
              {/* Purple gutter-x */}
              {gutterXScaled > 0 && (
                <div style={{
                  width: gutterXScaled,
                  flexShrink: 0,
                  background: 'rgba(139,92,246,0.25)',
                }} />
              )}
              {textColumn}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main export ──

export const TokenLayoutPreview: React.FC<Props> = ({
  clampMathMap, typoMb, desktopWidth, mobileWidth,
}) => {
  const desktopSpacing = resolveSpacing('desktop', desktopWidth, clampMathMap);
  const mobileSpacing = resolveSpacing('mobile', mobileWidth, clampMathMap);
  const desktopTypo = resolveTypography('desktop', desktopWidth, clampMathMap);
  const mobileTypo = resolveTypography('mobile', mobileWidth, clampMathMap);

  const DESKTOP_DISPLAY = 780;
  const MOBILE_DISPLAY = 220;

  return (
    <div className="token-layout-preview">
      <div className="token-preview-legend">
        <span className="tpl-legend tpl-blue">section-padding</span>
        <span className="tpl-legend tpl-purple">gutter-x</span>
        <span className="tpl-legend tpl-green">margin-bottom</span>
      </div>
      <div className="token-preview-canvases">
        <PreviewCanvas
          label={`Desktop (${desktopWidth}px)`}
          displayWidth={DESKTOP_DISPLAY}
          isMobile={false}
          spacing={desktopSpacing}
          typo={desktopTypo}
          typoMb={typoMb}
          scale={DESKTOP_DISPLAY / desktopWidth}
        />
        <PreviewCanvas
          label={`Mobile (${mobileWidth}px)`}
          displayWidth={MOBILE_DISPLAY}
          isMobile={true}
          spacing={mobileSpacing}
          typo={mobileTypo}
          typoMb={typoMb}
          scale={MOBILE_DISPLAY / mobileWidth}
        />
      </div>
    </div>
  );
};
