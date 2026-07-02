import { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { useStore } from '../store/useStore';
import { TUNING_CELL_HEATMAP } from '../types/uiPreferences';
import { plotlyColorscaleFromStops } from '../utils/heatmap';
import { ParsedTable } from '../types/xdf';

interface Table3DProps {
  table: ParsedTable;
}

export function Table3D({ table }: Table3DProps) {
  const { tableData } = useStore();
  const data = tableData.get(table.id);
  const heatmapPrefs = TUNING_CELL_HEATMAP;

  const plotlyColorscale = useMemo(
    () => plotlyColorscaleFromStops(heatmapPrefs.colorStops),
    [heatmapPrefs.colorStops]
  );
  
  const plotData = useMemo(() => {
    if (!data) return null;
    
    const xAxisLabels = data.xAxisValues.length > 0 
      ? data.xAxisValues 
      : Array.from({ length: table.colCount }, (_, i) => i);
    const yAxisLabels = data.yAxisValues.length > 0 
      ? data.yAxisValues 
      : Array.from({ length: table.rowCount }, (_, i) => i);
    
    // Create meshgrid
    const x: number[] = [];
    const y: number[] = [];
    const z: number[][] = [];
    
    for (let row = 0; row < table.rowCount; row++) {
      z[row] = [];
      for (let col = 0; col < table.colCount; col++) {
        if (row === 0) {
          x.push(xAxisLabels[col]);
        }
        z[row][col] = data.values[row][col];
      }
      y.push(yAxisLabels[row]);
    }
    
    return {
      x: xAxisLabels,
      y: yAxisLabels,
      z: data.values,
    };
  }, [data, table]);
  
  if (!data || !plotData) {
    return (
      <div className="bg-dark-surface border border-dark-border rounded-lg p-2">
        <p className="text-xs text-dark-text2">No data available for 3D visualization</p>
      </div>
    );
  }
  
  return (
    <div className="bg-dark-surface border border-dark-border rounded-lg p-2 h-full min-h-[min(50dvh,420px)] flex flex-col">
      <h3 className="text-xs font-semibold mb-2 flex-shrink-0">3D Visualization</h3>
      <div className="bg-dark-bg rounded flex-1 min-h-[min(45dvh,380px)] w-full min-w-0 relative">
        <Plot
          data={[
            {
              type: 'surface',
              x: plotData.x,
              y: plotData.y,
              z: plotData.z,
              colorscale: heatmapPrefs.enabled
                ? plotlyColorscale
                : [
                    [0, '#262626'],
                    [1, '#a3a3a3'],
                  ],
              showscale: true,
              colorbar: {
                title: {
                  text: table.units || 'Value',
                  font: { color: '#e5e5e5', size: 10 },
                },
                tickfont: { color: '#e5e5e5', size: 9 },
              },
            },
          ]}
          layout={{
            autosize: true,
            margin: { l: 40, r: 40, t: 30, b: 40 },
            scene: {
              xaxis: {
                title: table.xAxis.units || 'X Axis',
                titlefont: { color: '#e5e5e5', size: 10 },
                tickfont: { color: '#a3a3a3', size: 9 },
                gridcolor: '#2a2a2a',
              },
              yaxis: {
                title: table.yAxis.units || 'Y Axis',
                titlefont: { color: '#e5e5e5', size: 10 },
                tickfont: { color: '#a3a3a3', size: 9 },
                gridcolor: '#2a2a2a',
              },
              zaxis: {
                title: table.units || 'Z Axis',
                titlefont: { color: '#e5e5e5', size: 10 },
                tickfont: { color: '#a3a3a3', size: 9 },
                gridcolor: '#2a2a2a',
              },
              bgcolor: '#0a0a0a',
              camera: {
                eye: { x: 1.5, y: 1.5, z: 1.5 },
              },
            },
            paper_bgcolor: '#151515',
            plot_bgcolor: '#0a0a0a',
            font: { color: '#e5e5e5', size: 10 },
            height: undefined,
          }}
          useResizeHandler
          config={{
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['lasso2d', 'select2d'],
            toImageButtonOptions: {
              format: 'png',
              filename: `${table.title}_3d`,
              height: 800,
              width: 1200,
              scale: 2,
            },
          }}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
}

