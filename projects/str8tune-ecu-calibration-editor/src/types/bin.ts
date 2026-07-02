// BIN File Type Definitions

export interface BinFile {
  data: ArrayBuffer;
  size: number;
}

export interface TableData {
  tableId: string;
  values: number[][]; // 2D array of scaled values
  rawValues: number[][]; // 2D array of raw binary values
  xAxisValues: number[]; // Breakpoint values for X axis
  yAxisValues: number[]; // Breakpoint values for Y axis
}

export interface CellChange {
  tableId: string;
  row: number;
  col: number;
  oldValue: number;
  newValue: number;
  oldRawValue: number;
  newRawValue: number;
}

export interface Selection {
  tableId: string;
  cells: Array<{ row: number; col: number }>;
  bounds: {
    minRow: number;
    maxRow: number;
    minCol: number;
    maxCol: number;
  };
}

