import React from 'react';
import type { RatioResult } from '../../utils/ratio';

interface Props {
  width: number;
  height: number;
  result: RatioResult;
}

const BOX_MAX_W = 200;
const BOX_MAX_H = 160;

function scaledDimensions(a: number, b: number): { w: number; h: number } {
  const ratio = a / b;
  if (ratio >= BOX_MAX_W / BOX_MAX_H) {
    return { w: BOX_MAX_W, h: Math.round(BOX_MAX_W / ratio) };
  }
  return { w: Math.round(BOX_MAX_H * ratio), h: BOX_MAX_H };
}

export const RatioPreview: React.FC<Props> = ({ width, height, result }) => {
  const orig = scaledDimensions(width, height);
  const std = scaledDimensions(result.closest.a, result.closest.b);

  return (
    <div className="ratio-preview">
      <div className="ratio-preview-item">
        <div className="ratio-preview-label">原始比例</div>
        <div
          className="ratio-preview-box ratio-preview-box--original"
          style={{ width: orig.w, height: orig.h }}
        />
        <div className="ratio-preview-dim">{width} × {height}</div>
      </div>
      <div className="ratio-preview-item">
        <div className="ratio-preview-label">標準比例</div>
        <div
          className="ratio-preview-box ratio-preview-box--standard"
          style={{ width: std.w, height: std.h }}
        />
        <div className="ratio-preview-dim">{result.closest.a} / {result.closest.b}</div>
      </div>
    </div>
  );
};
