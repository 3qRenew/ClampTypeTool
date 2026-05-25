import React from 'react';
import { getClampedValueAtViewport } from '../../utils/clamp';
import type { ClampMathPair } from '../../pages/TokensPage';
import type { TypoMbMap } from './TokenInputGrid';
import type { TypographyTokenKey } from '../../types';

// ── Internal types ──

interface ClampMath {
  minValue: number;
  basePx: number;
  slopeVw: number;
  maxValue: number;
}

type ClampMathMap = Partial<Record<string, ClampMathPair>>;

interface ResolvedSpacing {
  sectionPy: number;
  contentEdge: number;
  containerMaxWidth: number;
  txtPx: number;
  txtPy: number;
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
    sectionPy: get('--section-py'),
    contentEdge: get('--content-edge'),
    containerMaxWidth: get('--container-max-width'),
    txtPx: get('--txt-px'),
    txtPy: get('--txt-py'),
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
    bodyP: get('body'),
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
    <div style={{ fontSize: size, color, lineHeight: 1.3, position: 'relative', paddingBottom: marginBottom }}>
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
  // aspect-ratio: 16/9 (desktop) | 9/16 (mobile)
  const displayHeight = isMobile
    ? Math.round(displayWidth * 16 / 9)
    : Math.round(displayWidth * 9 / 16);

  // Scale & cap spacing so the canvas doesn't collapse
  const sectionPy  = Math.min(spacing.sectionPy  * scale, displayHeight * 0.22);
  const contentEdge = Math.min(spacing.contentEdge * scale, displayWidth  * 0.32);
  const txtPx = Math.min(spacing.txtPx * scale, (displayWidth  - 2 * contentEdge) * 0.25);
  const txtPy = Math.min(spacing.txtPy * scale, (displayHeight - 2 * sectionPy)   * 0.22);

  const containerLeft  = contentEdge;
  const containerWidth = Math.max(displayWidth - 2 * contentEdge, 16);

  // margin-bottom helper — fall back to 0 if not set
  const mb = (key: string): number => {
    const v = typoMb[key as TypographyTokenKey];
    return v !== '' && v !== undefined ? (v as number) * scale : 0;
  };

  const txtTitleMb = mb('.txt-title');
  const txtBodyMb  = mb('.txt-body');
  const fs = (v: number | null) => (v ? v * scale : null);

  const textContent = (
    <div style={{ overflow: 'hidden', position: 'relative' }}>
      {/* txt-py top teal slab */}
      {txtPy > 0 && (
        <div style={{ height: txtPy, background: 'rgba(20,184,166,0.18)', position: 'relative', zIndex: 1 }}>
          <span style={{ position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)', fontSize: Math.max(6 * scale, 6), color: 'rgba(20,184,166,0.7)', fontFamily: 'monospace' }}>
            txt-py
          </span>
        </div>
      )}

      {/* Inner content with txt-px side padding */}
      <div style={{ paddingLeft: txtPx, paddingRight: txtPx, position: 'relative' }}>
        {/* txt-px left/right teal slabs */}
        {txtPx > 0 && <>
          <div style={{ position: 'absolute', inset: '0 auto 0 0', width: txtPx, background: 'rgba(20,184,166,0.12)', pointerEvents: 'none', zIndex: 1 }} />
          <div style={{ position: 'absolute', inset: '0 0 0 auto', width: txtPx, background: 'rgba(20,184,166,0.12)', pointerEvents: 'none', zIndex: 1 }} />
        </>}

        {/* .txt-title block */}
        <TextLine size={fs(typo.enLabel)}    color="#60a5fa"  marginBottom={mb('.page-en-label')}>EN LABEL</TextLine>
        <TextLine size={fs(typo.zhLabel)}    color="#a0a0a0"  marginBottom={mb('.page-zh-label')}>中文標籤</TextLine>
        <TextLine size={fs(typo.enTitle)}    color="#ffffff"  marginBottom={mb('.page-en-title')}>English Title</TextLine>
        <TextLine size={fs(typo.zhTitle)}    color="#f0f0f0"  marginBottom={mb('.page-zh-title')}>中文主標題</TextLine>
        <TextLine size={fs(typo.zhSubtitle)} color="#c0c0c0"  marginBottom={mb('.page-zh-subtitle')}>中文副標題文字</TextLine>
        <TextLine size={fs(typo.enSubtitle)} color="#a8a8a8"  marginBottom={0}>English Subtitle</TextLine>

        {/* .txt-title wrapper margin-bottom spacer */}
        {txtTitleMb > 0 && (
          <div style={{ height: txtTitleMb, background: 'rgba(251,191,36,0.18)', position: 'relative' }}>
            <span style={{ position: 'absolute', right: 0, top: 0, fontSize: Math.max(6 * scale, 6), color: '#fbbf24', fontFamily: 'monospace' }}>.txt-title mb</span>
          </div>
        )}

        {/* .txt-body block */}
        <TextLine size={fs(typo.bodyP)}   color="#888" marginBottom={0}>
          內文段落 Body paragraph text.
        </TextLine>

        {txtBodyMb > 0 && (
          <div style={{ height: txtBodyMb, background: 'rgba(251,191,36,0.12)', position: 'relative' }}>
            <span style={{ position: 'absolute', right: 0, top: 0, fontSize: Math.max(6 * scale, 6), color: '#fbbf24', fontFamily: 'monospace' }}>.txt-body mb</span>
          </div>
        )}

        <TextLine size={fs(typo.caption)} color="#666" marginBottom={0}>
          圖片僅供參考，實際以現場為準
        </TextLine>

        {/* slogan block */}
        <TextLine size={fs(typo.sloganH1)}    color="#e0e0e0" marginBottom={mb('.page-slogan-heading1')}>Slogan Heading 1</TextLine>
        <TextLine size={fs(typo.sloganH2)}    color="#d0d0d0" marginBottom={mb('.page-slogan-heading2')}>Slogan Heading 2</TextLine>
        <TextLine size={fs(typo.sloganH3)}    color="#c8c8c8" marginBottom={mb('.page-slogan-heading3')}>Slogan Heading 3</TextLine>
        <TextLine size={fs(typo.sloganLabel)} color="#8888aa" marginBottom={mb('.page-slogan-label')}>Slogan Label</TextLine>
      </div>

      {/* txt-py bottom teal slab */}
      {txtPy > 0 && (
        <div style={{ height: txtPy, background: 'rgba(20,184,166,0.18)' }} />
      )}
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
        {/* ── section-py: top + bottom blue slabs ── */}
        {sectionPy > 0 && <>
          <div style={{ position: 'absolute', inset: '0 0 auto 0', height: sectionPy, background: 'rgba(59,130,246,0.22)', zIndex: 3, pointerEvents: 'none' }}>
            <span style={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)', fontSize: Math.max(6 * scale, 6), color: 'rgba(96,165,250,0.75)', fontFamily: 'monospace' }}>section-py</span>
          </div>
          <div style={{ position: 'absolute', inset: 'auto 0 0 0', height: sectionPy, background: 'rgba(59,130,246,0.22)', zIndex: 3, pointerEvents: 'none' }} />
        </>}

        {/* ── content-edge: left + right orange slabs ── */}
        {contentEdge > 0 && <>
          <div style={{ position: 'absolute', inset: '0 auto 0 0', width: contentEdge, background: 'rgba(251,146,60,0.20)', zIndex: 3, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: '0 0 0 auto', width: contentEdge, background: 'rgba(251,146,60,0.20)', zIndex: 3, pointerEvents: 'none' }} />
        </>}

        {/* ── container area: clipped region between edges ── */}
        <div style={{
          position: 'absolute',
          top: sectionPy,
          left: containerLeft,
          width: containerWidth,
          bottom: sectionPy,
          overflow: 'hidden',
        }}>
          {textContent}
        </div>

        {/* ── container-max-width label (desktop only) ── */}
        {!isMobile && spacing.containerMaxWidth > 0 && (
          <div style={{
            position: 'absolute',
            bottom: sectionPy + 4,
            left: containerLeft,
            width: containerWidth,
            textAlign: 'center',
            pointerEvents: 'none',
            zIndex: 4,
          }}>
            <span style={{ fontSize: Math.max(6 * scale, 7), color: 'rgba(251,146,60,0.6)', fontFamily: 'monospace' }}>
              container {Math.round(spacing.containerMaxWidth)}px
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main export ──

export const TokenLayoutPreview: React.FC<Props> = ({
  clampMathMap, typoMb, desktopWidth, mobileWidth,
}) => {
  const desktopSpacing = resolveSpacing('desktop', desktopWidth, clampMathMap);
  const mobileSpacing  = resolveSpacing('mobile',  mobileWidth,  clampMathMap);
  const desktopTypo    = resolveTypography('desktop', desktopWidth, clampMathMap);
  const mobileTypo     = resolveTypography('mobile',  mobileWidth,  clampMathMap);

  const DESKTOP_DISPLAY = 780;
  const MOBILE_DISPLAY  = 220;

  return (
    <div className="token-layout-preview">
      <div className="token-preview-legend">
        <span className="tpl-legend tpl-blue">section-py</span>
        <span className="tpl-legend tpl-orange">content-edge</span>
        <span className="tpl-legend tpl-teal">txt-padding</span>
        <span className="tpl-legend tpl-green">margin-bottom</span>
      </div>
      <div className="token-preview-canvases">
        <PreviewCanvas
          label={`Desktop (${desktopWidth}px) · 16/9`}
          displayWidth={DESKTOP_DISPLAY}
          isMobile={false}
          spacing={desktopSpacing}
          typo={desktopTypo}
          typoMb={typoMb}
          scale={DESKTOP_DISPLAY / desktopWidth}
        />
        <PreviewCanvas
          label={`Mobile (${mobileWidth}px) · 9/16`}
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
