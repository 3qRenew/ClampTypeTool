import React from 'react';
import type { ViewportSample, ClampMetrics } from '../types';
import { getClampedValueAtViewport } from '../utils/clamp';

interface Props {
  samples: ViewportSample[];
  metrics: ClampMetrics;
}

export const ResultTable: React.FC<Props> = ({ samples, metrics }) => {
  const getStatus = (value: number): 'min' | 'max' | 'fluid' => {
    if (Math.abs(value - metrics.minValue) < 0.05) return 'min';
    if (Math.abs(value - metrics.maxValue) < 0.05) return 'max';
    return 'fluid';
  };

  return (
    <div className="panel">
      <div className="panel-title">取樣表</div>
      <table className="result-table">
        <thead>
          <tr>
            <th>Viewport</th>
            <th>Value</th>
            <th>State</th>
          </tr>
        </thead>
        <tbody>
          {samples.map(({ viewport, isDesignPoint }) => {
            const value = getClampedValueAtViewport(
              viewport,
              metrics.minValue,
              metrics.basePx,
              metrics.slopeVw,
              metrics.maxValue,
            );
            const status = getStatus(value);
            return (
              <tr key={viewport} className={isDesignPoint ? 'tr-design-point' : ''}>
                <td className="td-mono">
                  {viewport}px
                  {isDesignPoint && <span className="dp-tag">design</span>}
                </td>
                <td className="td-mono td-prominent">{value.toFixed(2)}px</td>
                <td>
                  <span className={`status-badge status-${status}`}>{status}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
