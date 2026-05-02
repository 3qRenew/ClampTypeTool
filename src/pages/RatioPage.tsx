import React, { useState, useMemo } from 'react';
import { getClosestRatio } from '../utils/ratio';
import { RatioPreview } from '../components/ratio/RatioPreview';

export const RatioPage: React.FC = () => {
  const [width, setWidth] = useState<number | ''>('');
  const [height, setHeight] = useState<number | ''>('');
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (width === '' || height === '') return null;
    return getClosestRatio(width, height);
  }, [width, height]);

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(`aspect-ratio: ${result.cssValue};`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  };

  return (
    <div className="ratio-page">
      <div className="ratio-inputs panel">
        <div className="panel-title">Image Ratio Tool</div>
        <div className="ratio-input-row">
          <label className="ratio-field">
            <span className="ratio-label">Width</span>
            <input
              type="number"
              className="ratio-input"
              min={1}
              step={1}
              placeholder="e.g. 1920"
              value={width}
              onChange={(e) => setWidth(e.target.value === '' ? '' : parseFloat(e.target.value))}
            />
            <span className="ratio-unit">px</span>
          </label>
          <span className="ratio-sep">×</span>
          <label className="ratio-field">
            <span className="ratio-label">Height</span>
            <input
              type="number"
              className="ratio-input"
              min={1}
              step={1}
              placeholder="e.g. 1080"
              value={height}
              onChange={(e) => setHeight(e.target.value === '' ? '' : parseFloat(e.target.value))}
            />
            <span className="ratio-unit">px</span>
          </label>
        </div>
      </div>

      {result && (
        <>
          <div className="ratio-results panel">
            <div className="ratio-result-row">
              <span className="ratio-result-label">Original ratio</span>
              <span className="ratio-result-value td-mono">{result.originalRatio.toFixed(3)}</span>
            </div>
            <div className="ratio-result-row">
              <span className="ratio-result-label">Closest ratio</span>
              <span className="ratio-result-value td-mono">
                {result.closest.a} / {result.closest.b}
                <span className={`ratio-quality ratio-quality--${result.quality}`}>
                  {result.quality}
                </span>
              </span>
            </div>
            <div className="ratio-result-row">
              <span className="ratio-result-label">Diff</span>
              <span className="ratio-result-value td-mono">{result.diff.toFixed(4)}</span>
            </div>
            <div className="ratio-output-row">
              <code className="ratio-css-output">aspect-ratio: {result.cssValue};</code>
              <button className="copy-btn ratio-copy-btn" onClick={handleCopy}>
                {copied ? '✓' : '複製'}
              </button>
            </div>
          </div>

          <RatioPreview width={width as number} height={height as number} result={result} />
        </>
      )}
    </div>
  );
};
