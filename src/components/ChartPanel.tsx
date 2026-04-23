import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceDot,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import type { ClampMetrics, ChartPoint } from '../types';
import { getChartData } from '../utils/clamp';

interface Props {
  metrics: ClampMetrics;
}

const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-vp">{label}px viewport</div>
      <div className="chart-tooltip-fs">{payload[0].value}px</div>
    </div>
  );
};

export const ChartPanel: React.FC<Props> = ({ metrics }) => {
  const data: ChartPoint[] = getChartData(metrics);
  const { minValue, maxValue, chartMinVp, chartMaxVp, desktopPoint, mobilePoint, mobileDesignPoint } = metrics;

  const yPad = (maxValue - minValue) * 0.2 || 4;
  const yMin = Math.max(0, Math.floor(minValue - yPad));
  const yMax = Math.ceil(maxValue + yPad);

  return (
    <div className="panel">
      <div className="panel-title">Clamp 曲線</div>
      <div className="chart-legend">
        <span className="legend-item legend-min">— min {minValue.toFixed(1)}px</span>
        <span className="legend-item legend-max">— max {maxValue.toFixed(1)}px</span>
        <span className="legend-item legend-fluid">— fluid</span>
        {desktopPoint && <span className="legend-item legend-dot">● target</span>}
        {mobileDesignPoint && <span className="legend-item legend-dot-dim">○ design</span>}
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 12, right: 28, left: 4, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
          <XAxis
            dataKey="viewport"
            type="number"
            domain={[chartMinVp, chartMaxVp]}
            tickCount={7}
            tick={{ fill: '#555', fontSize: 10, fontFamily: 'monospace' }}
            label={{ value: 'viewport (px)', position: 'insideBottom', offset: -14, fill: '#444', fontSize: 11 }}
          />
          <YAxis
            domain={[yMin, yMax]}
            tick={{ fill: '#555', fontSize: 10, fontFamily: 'monospace' }}
            tickFormatter={(v: number) => `${v}`}
            label={{ value: 'value (px)', angle: -90, position: 'insideLeft', offset: 14, fill: '#444', fontSize: 11 }}
            width={42}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* min / max reference lines */}
          <ReferenceLine y={minValue} stroke="#f87171" strokeDasharray="5 3" strokeWidth={1} />
          <ReferenceLine y={maxValue} stroke="#4ade80" strokeDasharray="5 3" strokeWidth={1} />

          {/* Desktop / mobile viewport vertical guides */}
          {desktopPoint && (
            <ReferenceLine
              x={desktopPoint.viewport}
              stroke="#fbbf24"
              strokeDasharray="3 4"
              strokeWidth={1}
              strokeOpacity={0.4}
            />
          )}
          {mobilePoint && (
            <ReferenceLine
              x={mobilePoint.viewport}
              stroke="#fbbf24"
              strokeDasharray="3 4"
              strokeWidth={1}
              strokeOpacity={0.4}
            />
          )}

          {/* Fluid curve */}
          <Line
            type="linear"
            dataKey="value"
            stroke="#60a5fa"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />

          {/* Design origin — dim hollow dot */}
          {mobileDesignPoint && (
            <ReferenceDot
              x={mobileDesignPoint.viewport}
              y={mobileDesignPoint.value}
              r={4}
              fill="transparent"
              stroke="#fbbf24"
              strokeWidth={1.5}
              strokeOpacity={0.4}
            />
          )}

          {/* Target points — solid yellow dots (on curve) */}
          {desktopPoint && (
            <ReferenceDot
              x={desktopPoint.viewport}
              y={desktopPoint.value}
              r={5}
              fill="#fbbf24"
              stroke="#111"
              strokeWidth={1.5}
            />
          )}
          {mobilePoint && (
            <ReferenceDot
              x={mobilePoint.viewport}
              y={mobilePoint.value}
              r={5}
              fill="#fbbf24"
              stroke="#111"
              strokeWidth={1.5}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
