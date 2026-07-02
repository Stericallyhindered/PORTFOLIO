import { useState } from 'react';
import { useStore } from '../store/useStore';
import { ParsedTable } from '../types/xdf';
import {
  applyOffset,
  applyScale,
  getSelectionStats,
  setValue as fillCellsWithValue,
  smoothLinear,
  smoothGaussian,
  fillLinearGradient,
  fillRadialGradient,
} from '../utils/tableOperations';
import { roundValue } from '../utils/dataConversion';
import { clampValue } from '../utils/validation';
import { commitFullTableValues } from '../utils/tableCommit';
import { Minus, Plus, Percent, Move } from 'lucide-react';

interface TableEditorProps {
  table: ParsedTable;
}

type OperationType =
  | 'offset'
  | 'percentage'
  | 'scale'
  | 'fill'
  | 'smoothLinear'
  | 'smoothGaussian'
  | 'gradLinearH'
  | 'gradLinearV'
  | 'gradLinearDiag'
  | 'gradRadial';

function roundMatrix(values: number[][], table: ParsedTable): number[][] {
  return values.map((row) =>
    row.map((v) => clampValue(roundValue(v, table.decimalPlaces), table.min, table.max))
  );
}

export function TableEditor({ table }: TableEditorProps) {
  const { tableData, binBuffer, setTableData, selection, addChange, showRawHex } = useStore();
  const [operation, setOperation] = useState<OperationType>('offset');
  const [value, setValue] = useState<string>('0');
  const [value2, setValue2] = useState<string>('0');

  const data = tableData.get(table.id);
  const hasSelection = selection && selection.tableId === table.id && selection.cells.length > 0;

  if (!data || !hasSelection) {
    return null;
  }

  if (showRawHex) {
    return (
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-2 py-1.5 mb-2 text-xs text-amber-200/90">
        Table functions apply to <strong>scaled</strong> values. Switch to <strong>Scaled</strong> (not Raw) to use the toolbox, matching TunerPro behavior.
      </div>
    );
  }

  const stats = getSelectionStats(data.values, selection!);

  const applyAndCommit = (newValues: number[][]) => {
    if (!binBuffer) return;
    const rounded = roundMatrix(newValues, table);
    const next = commitFullTableValues(binBuffer, table, data, rounded, addChange);
    setTableData(table.id, next);
    setValue('0');
    setValue2('0');
  };

  const handleExecute = () => {
    if (!binBuffer || !selection || selection.tableId !== table.id) return;

    const numValue = parseFloat(value);
    const numValue2 = parseFloat(value2);
    const noPrimaryValue = ['smoothLinear', 'smoothGaussian'].includes(operation);
    if (!noPrimaryValue && isNaN(numValue)) return;

    let newValues: number[][];

    switch (operation) {
      case 'offset':
        newValues = applyOffset(data.values, selection, numValue);
        break;
      case 'percentage': {
        const factor = 1 + numValue / 100;
        newValues = applyScale(data.values, selection, factor);
        break;
      }
      case 'scale':
        newValues = applyScale(data.values, selection, numValue);
        break;
      case 'fill':
        newValues = fillCellsWithValue(data.values, selection, numValue);
        break;
      case 'smoothLinear':
        newValues = smoothLinear(data.values, selection);
        break;
      case 'smoothGaussian':
        newValues = smoothGaussian(data.values, selection, 1);
        break;
      case 'gradLinearH':
        if (isNaN(numValue2)) return;
        newValues = fillLinearGradient(data.values, selection, numValue, numValue2, 'horizontal');
        break;
      case 'gradLinearV':
        if (isNaN(numValue2)) return;
        newValues = fillLinearGradient(data.values, selection, numValue, numValue2, 'vertical');
        break;
      case 'gradLinearDiag':
        if (isNaN(numValue2)) return;
        newValues = fillLinearGradient(data.values, selection, numValue, numValue2, 'diagonal');
        break;
      case 'gradRadial':
        if (isNaN(numValue2)) return;
        newValues = fillRadialGradient(data.values, selection, numValue, numValue2);
        break;
      default:
        return;
    }

    applyAndCommit(newValues);
  };

  const handleQuickOffset = (delta: number) => {
    if (!binBuffer || !selection || selection.tableId !== table.id) return;
    const newValues = applyOffset(data.values, selection, delta);
    applyAndCommit(newValues);
  };

  const handleQuickPercentage = (delta: number) => {
    if (!binBuffer || !selection || selection.tableId !== table.id) return;
    const factor = 1 + delta / 100;
    const newValues = applyScale(data.values, selection, factor);
    applyAndCommit(newValues);
  };

  const needsSecondValue =
    operation === 'gradLinearH' ||
    operation === 'gradLinearV' ||
    operation === 'gradLinearDiag' ||
    operation === 'gradRadial';

  return (
    <div className="bg-dark-surface border border-dark-border rounded-lg p-2 mb-2">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <label className="text-xs text-dark-text2 whitespace-nowrap">Function:</label>
          <select
            value={operation}
            onChange={(e) => setOperation(e.target.value as OperationType)}
            className="bg-dark-surface2 border border-dark-border rounded px-2 py-1 text-xs max-w-[200px] focus:outline-none focus:ring-1 focus:ring-dark-accent"
          >
            <option value="offset">Offset (+/-)</option>
            <option value="percentage">Percentage (%)</option>
            <option value="scale">Scale (×)</option>
            <option value="fill">Fill with value</option>
            <option value="smoothGaussian">Smooth (Gaussian)</option>
            <option value="smoothLinear">Smooth (linear blend)</option>
            <option value="gradLinearH">Gradient → horizontal</option>
            <option value="gradLinearV">Gradient → vertical</option>
            <option value="gradLinearDiag">Gradient → diagonal</option>
            <option value="gradRadial">Gradient → radial</option>
          </select>
        </div>

        <div className="flex items-center gap-1">
          <label className="text-xs text-dark-text2 whitespace-nowrap">
            {operation === 'gradRadial' ? 'Center' : needsSecondValue ? 'Start' : 'Value'}:
          </label>
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            step={operation === 'percentage' ? '1' : '0.1'}
            className="bg-dark-surface2 border border-dark-border rounded px-2 py-1 text-xs w-20 focus:outline-none focus:ring-1 focus:ring-dark-accent"
            placeholder="0"
          />
        </div>

        {needsSecondValue && (
          <div className="flex items-center gap-1">
            <label className="text-xs text-dark-text2 whitespace-nowrap">
              {operation === 'gradRadial' ? 'Edge' : 'End'}:
            </label>
            <input
              type="number"
              value={value2}
              onChange={(e) => setValue2(e.target.value)}
              step="0.1"
              className="bg-dark-surface2 border border-dark-border rounded px-2 py-1 text-xs w-20 focus:outline-none focus:ring-1 focus:ring-dark-accent"
              placeholder="0"
            />
          </div>
        )}

        <button
          onClick={handleExecute}
          className="flex items-center gap-1 px-2 py-1 bg-dark-accent hover:bg-dark-accentHover text-white rounded text-xs transition-colors font-medium"
        >
          <Move className="w-3 h-3" />
          Execute
        </button>

        <div className="flex items-center gap-1 border-l border-dark-border pl-2">
          <span className="text-xs text-dark-text2">Quick:</span>
          <button
            type="button"
            onClick={() => handleQuickOffset(-1)}
            className="p-1 hover:bg-dark-border rounded transition-colors"
            title="Offset -1"
          >
            <Minus className="w-3 h-3 text-dark-text2" />
          </button>
          <button
            type="button"
            onClick={() => handleQuickOffset(1)}
            className="p-1 hover:bg-dark-border rounded transition-colors"
            title="Offset +1"
          >
            <Plus className="w-3 h-3 text-dark-text2" />
          </button>
          <button
            type="button"
            onClick={() => handleQuickPercentage(-5)}
            className="p-1 hover:bg-dark-border rounded transition-colors"
            title="Percentage -5%"
          >
            <Percent className="w-3 h-3 text-dark-text2" />
            <span className="text-xs ml-0.5">-5</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickPercentage(5)}
            className="p-1 hover:bg-dark-border rounded transition-colors"
            title="Percentage +5%"
          >
            <Percent className="w-3 h-3 text-dark-text2" />
            <span className="text-xs ml-0.5">+5</span>
          </button>
        </div>

        {hasSelection && (
          <div className="flex items-center gap-2 border-l border-dark-border pl-2 ml-auto text-xs text-dark-text2">
            <span>Selected: {selection.cells.length}</span>
            <span>Min: {stats.min.toFixed(2)}</span>
            <span>Max: {stats.max.toFixed(2)}</span>
            <span>Avg: {stats.avg.toFixed(2)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
