import React, { useState, useMemo } from 'react';
import type { AppState } from './types';
import { computeTwoPointMetrics, computeEstimateMetrics, sampleClampValues } from './utils/clamp';
import { FormPanel } from './components/FormPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { ChartPanel } from './components/ChartPanel';
import { ResultTable } from './components/ResultTable';
import './App.css';

const DEFAULT_STATE: AppState = {
  mode: 'two-point',
  twoPoint: {
    desktopViewportWidth: 1920,
    desktopValue: 66,
    mobileDesignWidth: 610,
    mobileDesignValue: 55,
    mobileTargetWidth: 375,
    propertyType: 'font-size',
  },
  estimate: {
    designSize: 24,
    type: 'body',
    minFontSize: 0,
    maxFontSize: 0,
    baseViewport: 1440,
    minViewport: 375,
    maxViewport: 1920,
    vwScale: 0.8,
  },
};

export const App: React.FC = () => {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);

  const metrics = useMemo(
    () =>
      state.mode === 'two-point'
        ? computeTwoPointMetrics(state.twoPoint)
        : computeEstimateMetrics(state.estimate),
    [state],
  );

  const samples = useMemo(() => sampleClampValues(metrics), [metrics]);

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-title">Clamp Curve Tool</span>
        <span className="app-desc">CSS clamp() 視覺化工具 · Typography & Spacing</span>
      </header>
      <div className="app-body">
        <aside className="app-sidebar">
          <FormPanel state={state} onStateChange={setState} />
        </aside>
        <main className="app-main">
          <PreviewPanel metrics={metrics} />
          <ChartPanel metrics={metrics} />
          <ResultTable samples={samples} metrics={metrics} />
        </main>
      </div>
    </div>
  );
};
