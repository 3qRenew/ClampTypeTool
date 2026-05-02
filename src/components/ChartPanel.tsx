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
import type { ClampMode, ClampMetrics, DualData, ChartPoint } from '../types';
import { getChartData, getDualChartData } from '../utils/clamp';
import { getStrategyForPropertyType } from '../data/unitStrategy';

interface Props {
  mode: ClampMode;
  metrics: ClampMetrics;
  dualData: DualData | null;
}

const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const val = payload.find((p) => p.value !== undefined)?.value;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-vp">{label}px viewport</div>
      <div className="chart-tooltip-fs">{val}px</div>
    </div>
  );
};

// ── Single chart ──

const SingleChart: React.FC<{ metrics: ClampMetrics }> = ({ metrics }) => {
  const data = getChartData(metrics);
  const { minValue, maxValue, chartMinVp, chartMaxVp, desktopPoint, mobilePoint, mobileDesignPoint } = metrics;
  const yPad = (maxValue - minValue) * 0.2 || 4;
  const yMin = Math.max(0, Math.floor(minValue - yPad));
  const yMax = Math.ceil(maxValue + yPad);

  return (
    <>
      <div className="chart-legend">
        <span className="legend-item legend-min">— min {minValue.toFixed(1)}px</span>
        <span className="legend-item legend-max">— max {maxValue.toFixed(1)}px</span>
        <span className="legend-item legend-fluid">— fluid</span>
        {desktopPoint    && <span className="legend-item legend-dot">● target</span>}
        {mobileDesignPoint && <span className="legend-item legend-dot-dim">○ design</span>}
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 12, right: 28, left: 4, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
          <XAxis dataKey="viewport" type="number" domain={[chartMinVp, chartMaxVp]} tickCount={7}
            tick={{ fill: '#555', fontSize: 10, fontFamily: 'monospace' }}
            label={{ value: 'viewport (px)', position: 'insideBottom', offset: -14, fill: '#444', fontSize: 11 }} />
          <YAxis domain={[yMin, yMax]} tick={{ fill: '#555', fontSize: 10, fontFamily: 'monospace' }}
            tickFormatter={(v: number) => `${v}`}
            label={{ value: 'value (px)', angle: -90, position: 'insideLeft', offset: 14, fill: '#444', fontSize: 11 }}
            width={42} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={minValue} stroke="#f87171" strokeDasharray="5 3" strokeWidth={1} />
          <ReferenceLine y={maxValue} stroke="#4ade80" strokeDasharray="5 3" strokeWidth={1} />
          {desktopPoint && <ReferenceLine x={desktopPoint.viewport} stroke="#fbbf24" strokeDasharray="3 4" strokeWidth={1} strokeOpacity={0.4} />}
          {mobilePoint  && <ReferenceLine x={mobilePoint.viewport}  stroke="#fbbf24" strokeDasharray="3 4" strokeWidth={1} strokeOpacity={0.4} />}
          <Line type="linear" dataKey="value" stroke="#60a5fa" strokeWidth={2} dot={false} isAnimationActive={false} />
          {mobileDesignPoint && (
            <ReferenceDot x={mobileDesignPoint.viewport} y={mobileDesignPoint.value}
              r={4} fill="transparent" stroke="#fbbf24" strokeWidth={1.5} strokeOpacity={0.4} />
          )}
          {desktopPoint && (
            <ReferenceDot x={desktopPoint.viewport} y={desktopPoint.value}
              r={5} fill="#fbbf24" stroke="#111" strokeWidth={1.5} />
          )}
          {mobilePoint && (
            <ReferenceDot x={mobilePoint.viewport} y={mobilePoint.value}
              r={5} fill="#fbbf24" stroke="#111" strokeWidth={1.5} />
          )}
        </LineChart>
      </ResponsiveContainer>
    </>
  );
};

// ── Dual chart ──

const DualChart: React.FC<{ dualData: DualData }> = ({ dualData }) => {
  const data: ChartPoint[] = getDualChartData(dualData);
  const { portrait: p, landscape: l, breakpoint } = dualData;

  const allValues = [p.minValue, p.maxValue, l.minValue, l.maxValue];
  const globalMin = Math.min(...allValues);
  const globalMax = Math.max(...allValues);
  const yPad = (globalMax - globalMin) * 0.15 || 4;
  const yMin = Math.max(0, Math.floor(globalMin - yPad));
  const yMax = Math.ceil(globalMax + yPad);
  const xMin = p.chartMinVp;
  const xMax = l.chartMaxVp;

  return (
    <>
      <div className="chart-legend">
        <span className="legend-item" style={{ color: '#fb923c' }}>— 直向 portrait</span>
        <span className="legend-item" style={{ color: '#60a5fa' }}>— 橫向 landscape</span>
        <span className="legend-item legend-dot" style={{ opacity: 0.6 }}>| @media {breakpoint}px</span>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 12, right: 28, left: 4, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
          <XAxis dataKey="viewport" type="number" domain={[xMin, xMax]} tickCount={8}
            tick={{ fill: '#555', fontSize: 10, fontFamily: 'monospace' }}
            label={{ value: 'viewport (px)', position: 'insideBottom', offset: -14, fill: '#444', fontSize: 11 }} />
          <YAxis domain={[yMin, yMax]} tick={{ fill: '#555', fontSize: 10, fontFamily: 'monospace' }}
            tickFormatter={(v: number) => `${v}`}
            label={{ value: 'value (px)', angle: -90, position: 'insideLeft', offset: 14, fill: '#444', fontSize: 11 }}
            width={42} />
          <Tooltip content={<CustomTooltip />} />

          {/* Breakpoint line */}
          <ReferenceLine x={breakpoint} stroke="#a78bfa" strokeDasharray="4 3" strokeWidth={1.5} strokeOpacity={0.7} />

          {/* Portrait curve */}
          <Line type="linear" dataKey="portrait" stroke="#fb923c" strokeWidth={2}
            dot={false} isAnimationActive={false} connectNulls={false} />

          {/* Landscape curve */}
          <Line type="linear" dataKey="landscape" stroke="#60a5fa" strokeWidth={2}
            dot={false} isAnimationActive={false} connectNulls={false} />

          {/* Design point dots */}
          <ReferenceDot x={p.chartMinVp}  y={p.minValue}  r={5} fill="#fb923c" stroke="#111" strokeWidth={1.5} />
          <ReferenceDot x={p.chartMaxVp}  y={p.maxValue}  r={5} fill="#fb923c" stroke="#111" strokeWidth={1.5} />
          <ReferenceDot x={l.chartMinVp}  y={l.minValue}  r={5} fill="#60a5fa" stroke="#111" strokeWidth={1.5} />
          <ReferenceDot x={l.chartMaxVp}  y={l.maxValue}  r={5} fill="#60a5fa" stroke="#111" strokeWidth={1.5} />
        </LineChart>
      </ResponsiveContainer>
    </>
  );
};

// ── Main ──

export const ChartPanel: React.FC<Props> = ({ mode, metrics, dualData }) => {
  const strategy = getStrategyForPropertyType(
    mode === 'dual' && dualData ? dualData.propertyType : metrics.propertyType
  );
  const supportsClamp = strategy?.supportsClamp ?? true;

  return (
    <div className="panel">
      <div className="panel-title">Clamp 曲線</div>
      {!supportsClamp && (
        <div className="clamp-warn-banner">此屬性不建議使用 clamp()，曲線僅供參考。</div>
      )}
      {mode === 'dual' && dualData && dualData.isValid
        ? <DualChart dualData={dualData} />
        : <SingleChart metrics={metrics} />
      }
    </div>
  );
};
