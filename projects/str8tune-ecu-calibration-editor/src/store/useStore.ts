import { create } from 'zustand';
import { ParsedTable } from '../types/xdf';
import { TableData, Selection, CellChange } from '../types/bin';
import { applyCellChange, writeTableData } from '../parsers/binWriter';
import { readAllTables } from '../parsers/binReader';

/** Rebuild per-table change lists from the global chronological list. */
function rebuildTableChanges(changes: CellChange[]): Map<string, CellChange[]> {
  const tableChanges = new Map<string, CellChange[]>();
  for (const c of changes) {
    const list = tableChanges.get(c.tableId) ?? [];
    tableChanges.set(c.tableId, [...list, c]);
  }
  return tableChanges;
}

interface AppState {
  // Files
  xdfContent: string | null;
  xdfFileName: string | null;
  binBuffer: ArrayBuffer | null;
  binFileName: string | null;

  /** Optional compare BIN (same XDF layout) for diff overlay */
  compareBinBuffer: ArrayBuffer | null;
  compareBinFileName: string | null;
  compareTableData: Map<string, TableData>;
  compareMode: boolean;
  
  // Parsed data
  xdfHeader: any | null;
  tables: ParsedTable[];
  tableData: Map<string, TableData>;
  originalTableData: Map<string, TableData>; // Store original data for revert
  
  // UI state
  selectedTableId: string | null;
  selection: Selection | null;
  showRawHex: boolean;
  /** MHD / OpenRouter chat panel */
  assistantOpen: boolean;
  
  // Change tracking (global stack — last edit may be on any table)
  changes: CellChange[];
  /** Undone edits, most recent last — cleared when a new edit is made */
  redoStack: CellChange[];
  tableChanges: Map<string, CellChange[]>; // Derived from `changes` per table
  
  // Actions
  setXDFContent: (content: string, filename?: string | null) => void;
  setBinBuffer: (buffer: ArrayBuffer, filename: string) => void;
  setCompareBin: (buffer: ArrayBuffer, filename: string) => void;
  clearCompareBin: () => void;
  /** Re-parse compare BIN against current XDF tables (call after XDF loads if compare was loaded first). */
  refreshCompareTableData: () => void;
  setCompareMode: (on: boolean) => void;
  setTables: (tables: ParsedTable[]) => void;
  setTableData: (tableId: string, data: TableData) => void;
  setOriginalTableData: (tableId: string, data: TableData) => void;
  setSelectedTable: (tableId: string | null) => void;
  setSelection: (selection: Selection | null) => void;
  toggleRawHex: () => void;
  setAssistantOpen: (open: boolean) => void;
  addChange: (change: CellChange) => void;
  clearChanges: () => void;
  revertTable: (tableId: string) => void;
  saveTable: (tableId: string) => void;
  getTableChanges: (tableId: string) => CellChange[];
  undo: () => void;
  redo: () => void;
  
  // Computed
  getSelectedTable: () => ParsedTable | undefined;
  getTableData: (tableId: string) => TableData | undefined;
}

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  xdfContent: null,
  xdfFileName: null,
  binBuffer: null,
  binFileName: null,
  compareBinBuffer: null,
  compareBinFileName: null,
  compareTableData: new Map(),
  compareMode: false,
  xdfHeader: null,
  tables: [],
  tableData: new Map(),
  originalTableData: new Map(),
  selectedTableId: null,
  selection: null,
  showRawHex: false,
  assistantOpen: false,
  changes: [],
  redoStack: [],
  tableChanges: new Map(),
  
  // Actions
  setXDFContent: (content, filename) =>
    set((state) => ({
      xdfContent: content,
      xdfFileName:
        filename !== undefined ? filename : !content ? null : state.xdfFileName,
    })),
  
  setBinBuffer: (buffer, filename) => set({ binBuffer: buffer, binFileName: filename }),

  setCompareBin: (buffer, filename) => {
    const tables = get().tables;
    let compareTableData = new Map<string, TableData>();
    if (tables.length > 0) {
      compareTableData = readAllTables(buffer, tables);
    }
    set({
      compareBinBuffer: buffer,
      compareBinFileName: filename,
      compareTableData,
      compareMode: true,
    });
  },

  refreshCompareTableData: () => {
    const { compareBinBuffer, tables } = get();
    if (!compareBinBuffer || tables.length === 0) return;
    set({ compareTableData: readAllTables(compareBinBuffer, tables) });
  },

  clearCompareBin: () =>
    set({
      compareBinBuffer: null,
      compareBinFileName: null,
      compareTableData: new Map(),
      compareMode: false,
    }),

  setCompareMode: (on) => set({ compareMode: on }),
  
  setTables: (tables) => set({ tables }),
  
  setTableData: (tableId, data) => {
    const tableData = new Map(get().tableData);
    tableData.set(tableId, data);
    set({ tableData });
  },
  
  setOriginalTableData: (tableId, data) => {
    const originalTableData = new Map(get().originalTableData);
    originalTableData.set(tableId, data);
    set({ originalTableData });
  },
  
  setSelectedTable: (tableId) => {
    // Clear selection when switching tables
    set({ selectedTableId: tableId, selection: null });
  },
  
  setSelection: (selection) => set({ selection }),
  
  toggleRawHex: () => set((state) => ({ showRawHex: !state.showRawHex })),

  setAssistantOpen: (open) => set({ assistantOpen: open }),
  
  addChange: (change) => {
    const changes = [...get().changes, change];
    set({
      changes,
      tableChanges: rebuildTableChanges(changes),
      redoStack: [],
    });
  },

  clearChanges: () =>
    set({ changes: [], redoStack: [], tableChanges: new Map() }),
  
  getTableChanges: (tableId) => {
    return get().tableChanges.get(tableId) || [];
  },
  
  revertTable: (tableId) => {
    const originalData = get().originalTableData.get(tableId);
    if (!originalData) return;
    
    // Restore original table data
    const tableData = new Map(get().tableData);
    tableData.set(tableId, JSON.parse(JSON.stringify(originalData))); // Deep copy
    
    // Write original data back to binBuffer
    const binBuffer = get().binBuffer;
    const table = get().tables.find(t => t.id === tableId);
    
    if (binBuffer && table && table.address !== undefined) {
      writeTableData(binBuffer, table, originalData, false, true);
    }
    
    const changes = get().changes.filter((c) => c.tableId !== tableId);

    set({
      tableData,
      changes,
      tableChanges: rebuildTableChanges(changes),
      redoStack: [],
    });
  },
  
  saveTable: (tableId) => {
    const tableData = get().tableData.get(tableId);
    const binBuffer = get().binBuffer;
    const table = get().tables.find(t => t.id === tableId);
    
    if (!tableData || !binBuffer || !table || !table.address) {
      return;
    }
    
    // Write current table data to buffer (ensures all changes are synced)
    writeTableData(binBuffer, table, tableData, false, true);
    
    console.log(`Saved table ${table.title} (${tableId})`);
  },
  
  undo: () => {
    const changes = get().changes;
    if (changes.length === 0) return;

    const last = changes[changes.length - 1];
    const binBuffer = get().binBuffer;
    const table = get().tables.find((t) => t.id === last.tableId);
    const data = get().tableData.get(last.tableId);
    if (!binBuffer || !table?.address || !data) return;

    const reverse: CellChange = {
      ...last,
      newValue: last.oldValue,
      newRawValue: last.oldRawValue,
    };
    applyCellChange(binBuffer, table, reverse);

    const newValues = data.values.map((row) => [...row]);
    const newRaws = data.rawValues.map((row) => [...row]);
    newValues[last.row][last.col] = last.oldValue;
    newRaws[last.row][last.col] = last.oldRawValue;

    const updated = { ...data, values: newValues, rawValues: newRaws };
    const tableData = new Map(get().tableData);
    tableData.set(last.tableId, updated);

    const newChanges = changes.slice(0, -1);
    set({
      changes: newChanges,
      tableChanges: rebuildTableChanges(newChanges),
      tableData,
      redoStack: [...get().redoStack, last],
    });
  },

  redo: () => {
    const redoStack = get().redoStack;
    if (redoStack.length === 0) return;

    const last = redoStack[redoStack.length - 1];
    const binBuffer = get().binBuffer;
    const table = get().tables.find((t) => t.id === last.tableId);
    const data = get().tableData.get(last.tableId);
    if (!binBuffer || !table?.address || !data) return;

    applyCellChange(binBuffer, table, last);

    const newValues = data.values.map((row) => [...row]);
    const newRaws = data.rawValues.map((row) => [...row]);
    newValues[last.row][last.col] = last.newValue;
    newRaws[last.row][last.col] = last.newRawValue;

    const updated = { ...data, values: newValues, rawValues: newRaws };
    const tableData = new Map(get().tableData);
    tableData.set(last.tableId, updated);

    const newChanges = [...get().changes, last];
    set({
      changes: newChanges,
      tableChanges: rebuildTableChanges(newChanges),
      tableData,
      redoStack: redoStack.slice(0, -1),
    });
  },
  
  // Computed
  getSelectedTable: () => {
    const { tables, selectedTableId } = get();
    return tables.find(t => t.id === selectedTableId);
  },
  
  getTableData: (tableId) => {
    return get().tableData.get(tableId);
  },
}));

