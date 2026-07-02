import { TableData } from '../types/bin';

export interface CellDifference {
  row: number;
  col: number;
  value1: number;
  value2: number;
  diff: number;
  diffPercent: number;
}

export interface TableDifference {
  tableId: string;
  totalCells: number;
  differentCells: number;
  differences: CellDifference[];
  maxDiff: number;
  maxDiffPercent: number;
}

/**
 * Compare two table data objects and return differences
 */
export function compareTables(
  table1: TableData | undefined,
  table2: TableData | undefined,
  tolerance: number = 0.0001
): TableDifference | null {
  if (!table1 || !table2) {
    return null;
  }

  const differences: CellDifference[] = [];
  let maxDiff = 0;
  let maxDiffPercent = 0;
  let totalCells = 0;

  const maxRows = Math.max(table1.values.length, table2.values.length);
  const maxCols = Math.max(
    table1.values[0]?.length || 0,
    table2.values[0]?.length || 0
  );

  for (let row = 0; row < maxRows; row++) {
    for (let col = 0; col < maxCols; col++) {
      totalCells++;
      const val1 = table1.values[row]?.[col] ?? 0;
      const val2 = table2.values[row]?.[col] ?? 0;

      const diff = Math.abs(val1 - val2);
      const avg = (Math.abs(val1) + Math.abs(val2)) / 2;
      const diffPercent = avg !== 0 ? (diff / avg) * 100 : (diff !== 0 ? 100 : 0);

      if (diff > tolerance) {
        differences.push({
          row,
          col,
          value1: val1,
          value2: val2,
          diff,
          diffPercent,
        });

        if (diff > maxDiff) {
          maxDiff = diff;
        }
        if (diffPercent > maxDiffPercent) {
          maxDiffPercent = diffPercent;
        }
      }
    }
  }

  return {
    tableId: table1.tableId,
    totalCells,
    differentCells: differences.length,
    differences,
    maxDiff,
    maxDiffPercent,
  };
}

/**
 * Check if a cell has differences
 */
export function isCellDifferent(
  row: number,
  col: number,
  diff: TableDifference | null
): boolean {
  if (!diff) return false;
  return diff.differences.some(d => d.row === row && d.col === col);
}

/**
 * Get the difference for a specific cell
 */
export function getCellDifference(
  row: number,
  col: number,
  diff: TableDifference | null
): CellDifference | null {
  if (!diff) return null;
  return diff.differences.find(d => d.row === row && d.col === col) || null;
}

/**
 * Compare all tables between two BIN files
 */
export function compareAllTables(
  tables1: Map<string, TableData>,
  tables2: Map<string, TableData>
): Map<string, TableDifference> {
  const results = new Map<string, TableDifference>();
  const allTableIds = new Set([...tables1.keys(), ...tables2.keys()]);

  allTableIds.forEach(tableId => {
    const table1 = tables1.get(tableId);
    const table2 = tables2.get(tableId);
    const diff = compareTables(table1, table2);
    if (diff) {
      results.set(tableId, diff);
    }
  });

  return results;
}





