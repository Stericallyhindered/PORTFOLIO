import { ParsedTable } from '../types/xdf';
import { CellChange, TableData } from '../types/bin';
import { unscaleValue } from './dataConversion';
import { applyCellChange } from '../parsers/binWriter';

/**
 * Apply a new values matrix for the whole table, recording changes and updating raw values.
 */
export function commitFullTableValues(
  binBuffer: ArrayBuffer,
  table: ParsedTable,
  data: TableData,
  newValues: number[][],
  addChange: (c: CellChange) => void
): TableData {
  const newRawValues = data.rawValues.map((row, r) =>
    row.map((_val, c) => {
      const nv = newValues[r][c];
      return Math.round(unscaleValue(nv, table.mathEquation));
    })
  );

  for (let r = 0; r < newValues.length; r++) {
    for (let c = 0; c < newValues[r].length; c++) {
      const oldValue = data.values[r][c];
      const newValue = newValues[r][c];
      if (oldValue === newValue) continue;
      const change: CellChange = {
        tableId: table.id,
        row: r,
        col: c,
        oldValue,
        newValue,
        oldRawValue: data.rawValues[r][c],
        newRawValue: newRawValues[r][c],
      };
      applyCellChange(binBuffer, table, change);
      addChange(change);
    }
  }

  return {
    ...data,
    values: newValues.map((row) => [...row]),
    rawValues: newRawValues,
  };
}
