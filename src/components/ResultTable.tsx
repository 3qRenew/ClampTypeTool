import React from 'react';
import type { ClampMode, ClampMetrics, DualData, ViewportSample } from '../types';
import { getStrategyForPropertyType } from '../data/unitStrategy';

interface Props {
  mode: ClampMode;
  samples: ViewportSample[];
  metrics: ClampMetrics;
  dualData: DualData | null;
}

const getStatus = (value: number, minValue: number, maxValue: number): 'min' | 'max' | 'fluid' => {
  if (Math.abs(value - minValue) < 0.05) return 'min';
  if (Math.abs(value - maxValue) < 0.05) return 'max';
  return 'fluid';
};

export const ResultTable: React.FC<Props> = ({ mode, samples, metrics, dualData }) => {
  const propertyType = mode === 'dual' && dualData ? dualData.propertyType : metrics.propertyType;
  const strategy = getStrategyForPropertyType(propertyType);
  const supportsClamp = strategy?.supportsClamp ?? true;

  if (mode === 'dual' && dualData) {
    const portraitSamples = samples.filter((s) => s.segment === 'portrait');
    const landscapeSamples = samples.filter((s) => s.segment === 'landscape');

    return (
      <div className="panel">
        <div className="panel-title">取樣表</div>
        {!supportsClamp && (
          <div className="clamp-warn-banner">此屬性不建議使用 clamp()，數值僅供參考。</div>
        )}
        <table className="result-table">
          <thead>
            <tr>
              <th>Viewport</th>
              <th>Value</th>
              <th>State</th>
            </tr>
          </thead>
          <tbody>
            {/* Portrait segment */}
            <tr className="tr-segment-header">
              <td colSpan={3} className="td-segment-label portrait-segment-label">
                <span className="segment-dot portrait-dot-sm" />
                直向 Portrait ({dualData.portrait.chartMinVp}–{dualData.portrait.chartMaxVp}px)
              </td>
            </tr>
            {portraitSamples.map(({ viewport, value, isDesignPoint }) => {
              const status = getStatus(value, dualData.portrait.minValue, dualData.portrait.maxValue);
              return (
                <tr key={`p-${viewport}`} className={isDesignPoint ? 'tr-design-point' : ''}>
                  <td className="td-mono">
                    {viewport}px
                    {isDesignPoint && <span className="dp-tag">anchor</span>}
                  </td>
                  <td className="td-mono td-prominent">{value.toFixed(2)}px</td>
                  <td><span className={`status-badge status-${status}`}>{status}</span></td>
                </tr>
              );
            })}

            {/* Breakpoint divider row */}
            <tr className="tr-breakpoint">
              <td colSpan={3} className="td-breakpoint">
                @media (min-width: {dualData.breakpoint}px)
              </td>
            </tr>

            {/* Landscape segment */}
            <tr className="tr-segment-header">
              <td colSpan={3} className="td-segment-label landscape-segment-label">
                <span className="segment-dot landscape-dot-sm" />
                橫向 Landscape ({dualData.landscape.chartMinVp}–{dualData.landscape.chartMaxVp}px)
              </td>
            </tr>
            {landscapeSamples.map(({ viewport, value, isDesignPoint }) => {
              const status = getStatus(value, dualData.landscape.minValue, dualData.landscape.maxValue);
              return (
                <tr key={`l-${viewport}`} className={isDesignPoint ? 'tr-design-point' : ''}>
                  <td className="td-mono">
                    {viewport}px
                    {isDesignPoint && <span className="dp-tag">anchor</span>}
                  </td>
                  <td className="td-mono td-prominent">{value.toFixed(2)}px</td>
                  <td><span className={`status-badge status-${status}`}>{status}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-title">取樣表</div>
      {!supportsClamp && (
        <div className="clamp-warn-banner">此屬性不建議使用 clamp()，數值僅供參考。</div>
      )}
      <table className="result-table">
        <thead>
          <tr>
            <th>Viewport</th>
            <th>Value</th>
            <th>State</th>
          </tr>
        </thead>
        <tbody>
          {samples.map(({ viewport, value, isDesignPoint }) => {
            const status = getStatus(value, metrics.minValue, metrics.maxValue);
            return (
              <tr key={viewport} className={isDesignPoint ? 'tr-design-point' : ''}>
                <td className="td-mono">
                  {viewport}px
                  {isDesignPoint && <span className="dp-tag">design</span>}
                </td>
                <td className="td-mono td-prominent">{value.toFixed(2)}px</td>
                <td><span className={`status-badge status-${status}`}>{status}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
