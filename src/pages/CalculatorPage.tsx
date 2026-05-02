import React, { useMemo, useState } from 'react';
import type { AppState, DualData } from '../types';
import {
  computeTwoPointMetrics,
  computeDualData,
  sampleClampValues,
  sampleDualValues,
} from '../utils/clamp';
import { FormPanel } from '../components/FormPanel';
import { PreviewPanel } from '../components/PreviewPanel';
import { ChartPanel } from '../components/ChartPanel';
import { ResultTable } from '../components/ResultTable';

const DEFAULT_STATE: AppState = {
  mode: 'single',
  single: {
    desktopViewportWidth: 1920,
    desktopValue: 66,
    mobileDesignWidth: 610,
    mobileDesignValue: 55,
    mobileTargetWidth: 375,
    propertyType: 'font-size',
  },
  dual: {
    propertyType: 'font-size',
    portrait: { minViewport: 375, minValue: 9.6, maxViewport: 991, maxValue: 25 },
    landscape: { minViewport: 992, minValue: 9.3, maxViewport: 1920, maxValue: 18 },
  },
  outputUnitMode: 'auto',
};

export const CalculatorPage: React.FC = () => {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);

  const singleMetrics = useMemo(
    () => computeTwoPointMetrics(state.single),
    [state.single],
  );

  const dualData = useMemo((): DualData | null => {
    if (state.mode !== 'dual') return null;
    return computeDualData(state.dual);
  }, [state.mode, state.dual]);

  const samples = useMemo(
    () => state.mode === 'dual' && dualData
      ? sampleDualValues(dualData)
      : sampleClampValues(singleMetrics),
    [state.mode, singleMetrics, dualData],
  );

  return (
    <div className="app-body">
      <aside className="app-sidebar">
        <FormPanel state={state} onStateChange={setState} />
      </aside>
      <main className="app-main">
        <PreviewPanel
          mode={state.mode}
          metrics={singleMetrics}
          dualData={dualData}
          outputUnitMode={state.outputUnitMode}
        />
        <ChartPanel
          mode={state.mode}
          metrics={singleMetrics}
          dualData={dualData}
        />
        <ResultTable
          mode={state.mode}
          samples={samples}
          metrics={singleMetrics}
          dualData={dualData}
        />
      </main>
    </div>
  );
};
