import { Selection } from '../types/bin';

/**
 * Expand selection to include adjacent cells
 */
export function expandSelection(
  selection: Selection,
  direction: 'up' | 'down' | 'left' | 'right',
  amount: number = 1
): Selection {
  const { bounds } = selection;
  const newCells = [...selection.cells];
  
  if (direction === 'up' && bounds.minRow > 0) {
    for (let col = bounds.minCol; col <= bounds.maxCol; col++) {
      for (let i = 1; i <= amount; i++) {
        const row = bounds.minRow - i;
        if (row >= 0 && !newCells.some(c => c.row === row && c.col === col)) {
          newCells.push({ row, col });
        }
      }
    }
  } else if (direction === 'down') {
    // Implementation for other directions
  }
  
  return {
    ...selection,
    cells: newCells,
    bounds: {
      minRow: Math.max(0, bounds.minRow - (direction === 'up' ? amount : 0)),
      maxRow: bounds.maxRow,
      minCol: bounds.minCol,
      maxCol: bounds.maxCol,
    },
  };
}

/**
 * Select entire row
 */
export function selectRow(tableId: string, row: number, colCount: number): Selection {
  const cells: Array<{ row: number; col: number }> = [];
  for (let col = 0; col < colCount; col++) {
    cells.push({ row, col });
  }
  
  return {
    tableId,
    cells,
    bounds: { minRow: row, maxRow: row, minCol: 0, maxCol: colCount - 1 },
  };
}

/**
 * Select entire column
 */
export function selectColumn(tableId: string, col: number, rowCount: number): Selection {
  const cells: Array<{ row: number; col: number }> = [];
  for (let row = 0; row < rowCount; row++) {
    cells.push({ row, col });
  }
  
  return {
    tableId,
    cells,
    bounds: { minRow: 0, maxRow: rowCount - 1, minCol: col, maxCol: col },
  };
}

/**
 * Select all cells in table
 */
export function selectAll(tableId: string, rowCount: number, colCount: number): Selection {
  const cells: Array<{ row: number; col: number }> = [];
  for (let row = 0; row < rowCount; row++) {
    for (let col = 0; col < colCount; col++) {
      cells.push({ row, col });
    }
  }
  
  return {
    tableId,
    cells,
    bounds: { minRow: 0, maxRow: rowCount - 1, minCol: 0, maxCol: colCount - 1 },
  };
}

