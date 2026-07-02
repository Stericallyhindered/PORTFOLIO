import { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { TUNING_CELL_HEATMAP } from '../types/uiPreferences';
import { ParsedTable } from '../types/xdf';
import { CellChange } from '../types/bin';
import { formatValue, formatDeltaDisplay, roundValue, unscaleValue } from '../utils/dataConversion';
import { clampValue } from '../utils/validation';
import { applyCellChange, writeTableData } from '../parsers/binWriter';
import { commitFullTableValues } from '../utils/tableCommit';
import {
  getHeatmapRange,
  valueToHeatmapColor,
  textColorForBackground,
  deltaLineStyleForBackground,
} from '../utils/heatmap';
import {
  Eye,
  EyeOff,
  ArrowDownToLine,
  RotateCcw,
  Undo2,
  Redo2,
  CheckCircle2,
} from 'lucide-react';
import { TableEditor } from './TableEditor';

interface Table2DProps {
  table: ParsedTable;
}

const paddingClass = {
  compact: 'px-1.5 py-1',
  normal: 'px-2.5 py-1.5',
  relaxed: 'px-3 py-2',
} as const;

export function Table2D({ table }: Table2DProps) {
  const {
    tableData,
    originalTableData,
    showRawHex,
    binBuffer,
    setTableData,
    addChange,
    setSelection,
    selection,
    revertTable,
    saveTable,
    getTableChanges,
    undo,
    redo,
    changes,
    redoStack,
    compareMode,
    compareTableData,
    compareBinBuffer,
    compareBinFileName,
  } = useStore();
  const heatmapPrefs = TUNING_CELL_HEATMAP;

  const data = tableData.get(table.id);
  const values = data ? (showRawHex ? data.rawValues : data.values) : [];
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [selecting, setSelecting] = useState(false);
  const [selectStart, setSelectStart] = useState<{ row: number; col: number } | null>(null);
  const dragHappenedRef = useRef(false);
  const selectStartRef = useRef<{ row: number; col: number } | null>(null);
  const lastPointerTypeRef = useRef<string | null>(null);
  const lastTouchTapRef = useRef<{ row: number; col: number; t: number } | null>(null);
  const pointerListenersCleanupRef = useRef<(() => void) | null>(null);
  const gridScrollRef = useRef<HTMLDivElement>(null);
  const fitGridContainerRef = useRef<HTMLDivElement>(null);
  const tableMeasureRef = useRef<HTMLTableElement>(null);
  /** Phones & tablets: scale grid to fill space below tools (any orientation, any typical device width). */
  const [compactFitMode, setCompactFitMode] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 1536px)').matches : false
  );
  const [fitBox, setFitBox] = useState({ w: 0, h: 0, s: 1 });
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const saveNoticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** When on: tap/click cells to toggle inclusion (touch-friendly; no drag). Scroll is not blocked. */
  const [cellSelectMode, setCellSelectMode] = useState(false);

  useEffect(() => {
    return () => {
      if (saveNoticeTimerRef.current) clearTimeout(saveNoticeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    return () => {
      pointerListenersCleanupRef.current?.();
      pointerListenersCleanupRef.current = null;
    };
  }, []);

  useEffect(() => {
    selectStartRef.current = selectStart;
  }, [selectStart]);

  useEffect(() => {
    setCellSelectMode(false);
  }, [table.id]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1536px)');
    const apply = () => setCompactFitMode(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    setFitBox({ w: 0, h: 0, s: 1 });
  }, [table.id]);

  const fitTableToViewport = compactFitMode && Boolean(data);

  useLayoutEffect(() => {
    if (!fitTableToViewport) {
      setFitBox({ w: 0, h: 0, s: 1 });
      return;
    }
    const run = () => {
      const t = tableMeasureRef.current;
      const c = fitGridContainerRef.current;
      if (!t || !c) return;
      const tw = t.offsetWidth;
      const th = t.offsetHeight;
      const cw = c.clientWidth;
      const ch = c.clientHeight;
      if (tw < 1 || th < 1 || cw < 1 || ch < 1) return;
      const s = Math.min(cw / tw, ch / th, 1);
      setFitBox({ w: tw, h: th, s });
    };
    run();
    const id = requestAnimationFrame(run);
    const ro = new ResizeObserver(run);
    if (fitGridContainerRef.current) ro.observe(fitGridContainerRef.current);
    if (tableMeasureRef.current) ro.observe(tableMeasureRef.current);
    window.addEventListener('orientationchange', run);
    window.addEventListener('resize', run);
    return () => {
      cancelAnimationFrame(id);
      ro.disconnect();
      window.removeEventListener('orientationchange', run);
      window.removeEventListener('resize', run);
    };
  }, [
    fitTableToViewport,
    data,
    table.id,
    values,
    compareMode,
    compareBinFileName,
    showRawHex,
    editingCell,
    cellSelectMode,
    table.rowCount,
    table.colCount,
  ]);

  useEffect(() => {
    if (!data) return;
    const root = gridScrollRef.current;
    if (!root) return;
    const blockSelectStart = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (t.closest('input, textarea')) return;
      e.preventDefault();
    };
    root.addEventListener('selectstart', blockSelectStart, true);
    return () => root.removeEventListener('selectstart', blockSelectStart, true);
  }, [data]);

  const allFlat = useMemo(() => values.flat(), [values]);

  const selectionFlat = useMemo(() => {
    if (!selection || selection.tableId !== table.id || selection.cells.length === 0) return null;
    return selection.cells.map((c) => values[c.row][c.col]);
  }, [selection, table.id, values]);

  const heatRange = useMemo(() => {
    if (allFlat.length === 0) return { min: 0, max: 1 };
    return getHeatmapRange(
      allFlat,
      heatmapPrefs.rangeMode,
      selectionFlat,
      heatmapPrefs.fixedMin,
      heatmapPrefs.fixedMax
    );
  }, [allFlat, heatmapPrefs.rangeMode, heatmapPrefs.fixedMin, heatmapPrefs.fixedMax, selectionFlat]);

  const getCellColor = useCallback(
    (value: number) => valueToHeatmapColor(value, heatmapPrefs, heatRange),
    [heatmapPrefs, heatRange]
  );

  const applyDragSelection = useCallback(
    (row: number, col: number) => {
      const ss = selectStartRef.current;
      if (!ss) return;
      dragHappenedRef.current = true;
      const minRow = Math.min(ss.row, row);
      const maxRow = Math.max(ss.row, row);
      const minCol = Math.min(ss.col, col);
      const maxCol = Math.max(ss.col, col);
      const cells: Array<{ row: number; col: number }> = [];
      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          cells.push({ row: r, col: c });
        }
      }
      setSelection({
        tableId: table.id,
        cells,
        bounds: { minRow, maxRow, minCol, maxCol },
      });
    },
    [setSelection, table.id]
  );

  if (!data) {
    return (
      <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
        <p className="text-dark-text2">No data available for this table</p>
      </div>
    );
  }

  const xAxisLabels =
    data.xAxisValues.length > 0 ? data.xAxisValues : Array.from({ length: table.colCount }, (_, i) => i);
  const yAxisLabels =
    data.yAxisValues.length > 0 ? data.yAxisValues : Array.from({ length: table.rowCount }, (_, i) => i);

  const compareData = compareTableData?.get(table.id);
  const compareValues =
    compareMode && compareData
      ? showRawHex
        ? compareData.rawValues
        : compareData.values
      : undefined;

  const binsAreIdentical = useMemo(() => {
    const a = binBuffer;
    const b = compareBinBuffer;
    if (!a || !b || a.byteLength === 0 || b.byteLength === 0) return false;
    if (a.byteLength !== b.byteLength) return false;
    const va = new Uint8Array(a);
    const vb = new Uint8Array(b);
    for (let i = 0; i < va.length; i++) {
      if (va[i] !== vb[i]) return false;
    }
    return true;
  }, [binBuffer, compareBinBuffer]);

  const compareSummary = useMemo(() => {
    if (!compareMode || !compareBinFileName) return null;
    if (!compareData || !data) return { kind: 'missing' as const };
    const a = showRawHex ? data.rawValues : data.values;
    const b = showRawHex ? compareData.rawValues : compareData.values;
    if (!a?.length || !b?.length) return { kind: 'missing' as const };
    let diffCells = 0;
    let maxAbs = 0;
    for (let r = 0; r < a.length; r++) {
      const ar = a[r];
      const br = b[r];
      if (!ar || !br) continue;
      for (let c = 0; c < ar.length; c++) {
        if (c >= br.length) continue;
        const d = ar[c] - br[c];
        const ad = Math.abs(d);
        if (ad > 1e-12) {
          diffCells++;
          maxAbs = Math.max(maxAbs, ad);
        }
      }
    }
    return { kind: 'ok' as const, diffCells, maxAbs };
  }, [compareMode, compareBinFileName, compareData, data, showRawHex]);

  const handleCellClick = (row: number, col: number, e: React.MouseEvent) => {
    if (dragHappenedRef.current) {
      dragHappenedRef.current = false;
      return;
    }
    if (cellSelectMode) {
      const existing =
        selection?.tableId === table.id ? selection.cells : [];
      const cellExists = existing.some((c) => c.row === row && c.col === col);
      if (cellExists) {
        const filtered = existing.filter((c) => !(c.row === row && c.col === col));
        if (filtered.length === 0) {
          setSelection(null);
          setSelectStart(null);
        } else {
          let minRow = filtered[0].row,
            maxRow = filtered[0].row,
            minCol = filtered[0].col,
            maxCol = filtered[0].col;
          filtered.forEach((c) => {
            minRow = Math.min(minRow, c.row);
            maxRow = Math.max(maxRow, c.row);
            minCol = Math.min(minCol, c.col);
            maxCol = Math.max(maxCol, c.col);
          });
          setSelection({
            tableId: table.id,
            cells: filtered,
            bounds: { minRow, maxRow, minCol, maxCol },
          });
          setSelectStart({ row, col });
        }
      } else {
        const cells = [...existing, { row, col }];
        let minRow = row,
          maxRow = row,
          minCol = col,
          maxCol = col;
        cells.forEach((c) => {
          minRow = Math.min(minRow, c.row);
          maxRow = Math.max(maxRow, c.row);
          minCol = Math.min(minCol, c.col);
          maxCol = Math.max(maxCol, c.col);
        });
        setSelection({
          tableId: table.id,
          cells,
          bounds: { minRow, maxRow, minCol, maxCol },
        });
        setSelectStart({ row, col });
      }
      return;
    }
    if (
      lastPointerTypeRef.current === 'touch' &&
      !e.shiftKey &&
      !e.ctrlKey &&
      !e.metaKey
    ) {
      const now = Date.now();
      const prev = lastTouchTapRef.current;
      if (prev && prev.row === row && prev.col === col && now - prev.t < 400) {
        lastTouchTapRef.current = null;
        lastPointerTypeRef.current = null;
        const v = values[row][col];
        setEditingCell({ row, col });
        setEditValue(v.toString());
        return;
      }
      lastTouchTapRef.current = { row, col, t: now };
    }
    if (e.shiftKey && selectStart) {
      const minRow = Math.min(selectStart.row, row);
      const maxRow = Math.max(selectStart.row, row);
      const minCol = Math.min(selectStart.col, col);
      const maxCol = Math.max(selectStart.col, col);
      const cells: Array<{ row: number; col: number }> = [];
      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          cells.push({ row: r, col: c });
        }
      }
      setSelection({
        tableId: table.id,
        cells,
        bounds: { minRow, maxRow, minCol, maxCol },
      });
    } else if (e.ctrlKey || e.metaKey) {
      const existingCells = selection?.cells || [];
      const cellExists = existingCells.some((c) => c.row === row && c.col === col);
      if (cellExists) {
        setSelection({
          tableId: table.id,
          cells: existingCells.filter((c) => !(c.row === row && c.col === col)),
          bounds: selection?.bounds || { minRow: row, maxRow: row, minCol: col, maxCol: col },
        });
      } else {
        const cells = [...existingCells, { row, col }];
        let minRow = row,
          maxRow = row,
          minCol = col,
          maxCol = col;
        cells.forEach((c) => {
          minRow = Math.min(minRow, c.row);
          maxRow = Math.max(maxRow, c.row);
          minCol = Math.min(minCol, c.col);
          maxCol = Math.max(maxCol, c.col);
        });
        setSelection({
          tableId: table.id,
          cells,
          bounds: { minRow, maxRow, minCol, maxCol },
        });
      }
    } else {
      setSelectStart({ row, col });
      setSelection({
        tableId: table.id,
        cells: [{ row, col }],
        bounds: { minRow: row, maxRow: row, minCol: col, maxCol: col },
      });
    }
  };

  const handleCellPointerDown = (row: number, col: number, e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const t = e.target as HTMLElement | null;
    if (t?.closest('input, textarea')) return;

    lastPointerTypeRef.current = e.pointerType === 'touch' ? 'touch' : 'mouse';

    // Touch: never use drag-rectangle (conflicts with scroll). Use "Select cells" mode to tap-toggle.
    if (e.pointerType === 'touch') {
      return;
    }

    // Tap-to-select mode: selection changes only via click (toggle), not drag.
    if (cellSelectMode) {
      return;
    }

    e.preventDefault();
    pointerListenersCleanupRef.current?.();
    pointerListenersCleanupRef.current = null;
    dragHappenedRef.current = false;
    const start = { row, col };
    selectStartRef.current = start;
    setSelectStart(start);
    setSelecting(true);
    setSelection({
      tableId: table.id,
      cells: [{ row, col }],
      bounds: { minRow: row, maxRow: row, minCol: col, maxCol: col },
    });

    const pid = e.pointerId;
    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== pid) return;
      ev.preventDefault();
      const el = document.elementFromPoint(ev.clientX, ev.clientY);
      const td = el?.closest('[data-table-cell]') as HTMLElement | null;
      if (!td || !gridScrollRef.current?.contains(td)) return;
      const r = parseInt(td.dataset.row ?? '', 10);
      const c = parseInt(td.dataset.col ?? '', 10);
      if (Number.isNaN(r) || Number.isNaN(c)) return;
      applyDragSelection(r, c);
    };
    const onUp = (ev: PointerEvent) => {
      if (ev.pointerId !== pid) return;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      pointerListenersCleanupRef.current = null;
      setSelecting(false);
    };
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    pointerListenersCleanupRef.current = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  };

  const handleCellDoubleClick = (row: number, col: number) => {
    const value = values[row][col];
    setEditingCell({ row, col });
    setEditValue(value.toString());
  };

  const handleEditSubmit = () => {
    if (!editingCell || !binBuffer) return;
    const newValue = parseFloat(editValue);
    if (isNaN(newValue)) {
      setEditingCell(null);
      return;
    }
    const clampedValue = clampValue(newValue, table.min, table.max);
    const roundedValue = roundValue(clampedValue, table.decimalPlaces);
    const oldValue = data.values[editingCell.row][editingCell.col];
    const oldRawValue = data.rawValues[editingCell.row][editingCell.col];
    const newRawValue = unscaleValue(roundedValue, table.mathEquation);
    const newData = { ...data };
    newData.values[editingCell.row][editingCell.col] = roundedValue;
    newData.rawValues[editingCell.row][editingCell.col] = Math.round(newRawValue);
    const change: CellChange = {
      tableId: table.id,
      row: editingCell.row,
      col: editingCell.col,
      oldValue,
      newValue: roundedValue,
      oldRawValue,
      newRawValue: Math.round(newRawValue),
    };
    applyCellChange(binBuffer, table, change);
    addChange(change);
    setTableData(table.id, newData);
    setEditingCell(null);
  };

  const handleEditCancel = () => {
    setEditingCell(null);
  };

  const isCellSelected = (row: number, col: number) =>
    selection?.tableId === table.id && selection.cells.some((c) => c.row === row && c.col === col);

  const getSelectionStats = () => {
    if (!selection || selection.tableId !== table.id || selection.cells.length === 0) return null;
    const selectedValues = selection.cells.map((c) => values[c.row][c.col]);
    const min = Math.min(...selectedValues);
    const max = Math.max(...selectedValues);
    const avg = selectedValues.reduce((a, b) => a + b, 0) / selectedValues.length;
    const sum = selectedValues.reduce((a, b) => a + b, 0);
    return { count: selection.cells.length, min, max, avg, sum };
  };

  const stats = getSelectionStats();
  const tableChanges = getTableChanges(table.id);
  const hasChanges = tableChanges.length > 0;
  const originalData = originalTableData.get(table.id);
  const canRevert = originalData !== undefined;

  const pad = paddingClass[heatmapPrefs.cellPadding];

  const selBounds =
    selection?.tableId === table.id ? selection.bounds : null;

  const axisColHighlight = (colIdx: number) =>
    heatmapPrefs.axisHighlight &&
    selBounds &&
    colIdx >= selBounds.minCol &&
    colIdx <= selBounds.maxCol;

  const axisRowHighlight = (rowIdx: number) =>
    heatmapPrefs.axisHighlight &&
    selBounds &&
    rowIdx >= selBounds.minRow &&
    rowIdx <= selBounds.maxRow;

  const overlayAlpha = heatmapPrefs.selectionOverlayAlpha;

  const groupDivider = (
    <div
      className="hidden sm:block w-px h-5 bg-dark-border/70 self-center shrink-0"
      aria-hidden
    />
  );

  return (
    <div className="bg-dark-surface border border-dark-border rounded-lg overflow-hidden h-full min-h-0 flex flex-col">
      <div
        className={`border-b border-dark-border ${
          compactFitMode ? 'space-y-1 p-1' : 'space-y-2 p-2'
        }`}
      >
        <div
          className={`flex flex-col lg:flex-row lg:items-start lg:justify-between ${
            compactFitMode ? 'gap-1' : 'gap-2'
          }`}
        >
          <div className="min-w-0 flex-1 space-y-1">
            <div
              className="flex items-baseline gap-1 min-w-0"
              title={table.description ? `${table.title} (${table.description})` : table.title}
            >
              <h3
                className={`font-semibold mb-0 truncate ${
                  compactFitMode ? 'text-xs leading-tight' : 'text-sm'
                }`}
              >
                {table.title}
              </h3>
              {table.description && !compactFitMode && (
                <span className="text-xs text-dark-text2 font-mono truncate">({table.description})</span>
              )}
            </div>
            {table.units && (
              <p className={`text-dark-text2 ${compactFitMode ? 'text-[10px] leading-tight' : 'text-xs'}`}>
                Units: {table.units}
              </p>
            )}
            <p className={`text-[10px] leading-snug text-dark-text2 md:hidden ${compactFitMode ? 'hidden' : ''}`}>
              Drag to select cells · double-tap a cell to edit ·{' '}
              <span className="text-dark-text">Apply to BIN</span> = this map in RAM ·{' '}
              <span className="text-dark-text">Reset</span> = this map only ·{' '}
              <span className="text-dark-text">Export BIN</span> = full file
            </p>
            <p
              className={`hidden max-w-xl text-[10px] leading-snug text-dark-text2 md:block ${
                compactFitMode ? 'md:hidden' : ''
              }`}
            >
              Edit one map at a time.{' '}
              <span className="text-dark-text">Apply to BIN</span> copies this table into the in-memory
              calibration (other maps stay as last applied).{' '}
              <span className="text-dark-text">Reset table</span> restores only this map to load-time
              values in memory — it does not reload the whole BIN file. Use{' '}
              <span className="text-dark-text">Export BIN</span> in the header to download the full file.
            </p>
          </div>

          <div className="flex flex-col gap-1.5 items-stretch lg:items-end shrink-0">
            {hasChanges && (
              <span
                className={`text-dark-accent rounded bg-dark-accent/10 tabular-nums self-end ${
                  compactFitMode ? 'text-[9px] px-1 py-0.5' : 'text-[10px] px-1.5 py-0.5'
                }`}
              >
                {tableChanges.length} unsaved cell{tableChanges.length !== 1 ? 's' : ''} on this map
              </span>
            )}
            <div
              className={`flex flex-wrap items-center justify-end ${
                compactFitMode ? 'gap-0.5' : 'gap-1'
              }`}
            >
              <span
                className={`text-dark-text2 uppercase tracking-wide mr-0.5 ${
                  compactFitMode ? 'text-[9px]' : 'text-[10px]'
                }`}
              >
                History
              </span>
              <button
                type="button"
                onClick={() => undo()}
                disabled={!binBuffer || changes.length === 0}
                className={`flex items-center bg-dark-surface2 hover:bg-dark-border border border-dark-border rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  compactFitMode ? 'gap-0.5 px-1.5 py-0.5 text-[10px]' : 'gap-1 px-2 py-1 text-xs'
                }`}
                title="Undo the most recent cell edit anywhere in the session (global stack)"
              >
                <Undo2 className="w-3 h-3" />
                <span>Undo</span>
              </button>
              <button
                type="button"
                onClick={() => redo()}
                disabled={!binBuffer || redoStack.length === 0}
                className={`flex items-center bg-dark-surface2 hover:bg-dark-border border border-dark-border rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  compactFitMode ? 'gap-0.5 px-1.5 py-0.5 text-[10px]' : 'gap-1 px-2 py-1 text-xs'
                }`}
                title="Redo the last undone cell edit"
              >
                <Redo2 className="w-3 h-3" />
                <span>Redo</span>
              </button>
              {groupDivider}
              <span
                className={`text-dark-text2 uppercase tracking-wide mr-0.5 ${
                  compactFitMode ? 'text-[9px]' : 'text-[10px]'
                }`}
              >
                This map
              </span>
              {canRevert && (
                <button
                  type="button"
                  onClick={() => revertTable(table.id)}
                  className={`flex items-center bg-dark-surface2 hover:bg-dark-border border border-dark-border rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    compactFitMode ? 'gap-0.5 px-1.5 py-0.5 text-[10px]' : 'gap-1 px-2 py-1 text-xs'
                  }`}
                  title="Reset only this map to values from when the BIN was loaded. Writes that snapshot into memory for this table only — other maps are unchanged."
                  disabled={!hasChanges}
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset table</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (!binBuffer || !data) return;
                  writeTableData(binBuffer, table, data, false, true);
                  saveTable(table.id);
                  if (saveNoticeTimerRef.current) clearTimeout(saveNoticeTimerRef.current);
                  setSaveNotice(
                    `Applied "${table.title}" to in-memory BIN (this map only; Export BIN in header for a file)`
                  );
                  saveNoticeTimerRef.current = setTimeout(() => {
                    setSaveNotice(null);
                    saveNoticeTimerRef.current = null;
                  }, 5000);
                }}
                className={`flex items-center bg-dark-accent hover:bg-dark-accentHover text-white rounded font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  compactFitMode ? 'gap-0.5 px-1.5 py-0.5 text-[10px]' : 'gap-1 px-2 py-1 text-xs'
                }`}
                title="Write this map’s scaled cells into the loaded BIN in RAM. Does not create a file — use Export BIN in the header after applying each map you care about."
                disabled={!hasChanges}
              >
                <ArrowDownToLine className="w-3 h-3" />
                <span>Apply to BIN</span>
              </button>
              {groupDivider}
              <span
                className={`text-dark-text2 uppercase tracking-wide mr-0.5 ${
                  compactFitMode ? 'text-[9px]' : 'text-[10px]'
                }`}
              >
                View
              </span>
              <button
                type="button"
                onClick={() => useStore.getState().toggleRawHex()}
                className={`flex items-center bg-dark-surface2 hover:bg-dark-border border border-dark-border rounded transition-colors ${
                  compactFitMode ? 'gap-0.5 px-1.5 py-0.5 text-[10px]' : 'gap-1 px-2 py-1 text-xs'
                }`}
                title={showRawHex ? 'Show engineer units (scaled)' : 'Show raw storage values'}
              >
                {showRawHex ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showRawHex ? 'Raw' : 'Scaled'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {saveNotice && (
        <div
          className={`border-b border-dark-border flex items-center gap-2 bg-emerald-500/10 text-emerald-100/95 ${
            compactFitMode ? 'px-1.5 py-1 text-[10px] leading-snug' : 'px-2 py-2 text-xs'
          }`}
          role="status"
        >
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" aria-hidden />
          <span>{saveNotice}</span>
        </div>
      )}

      <div
        className={
          compactFitMode
            ? 'min-h-0 shrink-0 max-h-[min(34dvh,280px)] overflow-y-auto overflow-x-hidden border-b border-dark-border/50'
            : ''
        }
      >
        <TableEditor table={table} />
      </div>

      {compareMode && compareBinFileName && (
        <div
          className={`border-b border-dark-border ${
            compactFitMode
              ? 'px-1.5 py-1 text-[10px] leading-tight space-y-0.5 max-h-[4.5rem] overflow-y-auto'
              : 'px-2 py-1.5 text-xs space-y-1'
          }`}
        >
          {binsAreIdentical ? (
            <p className="text-amber-300/95">
              Main BIN and compare BIN are identical (same bytes). Load a different tune as compare to see Δ.
            </p>
          ) : compareSummary?.kind === 'missing' ? (
            <p className="text-amber-300/95">
              No compare data for this map. Reload the compare BIN after the XDF is loaded, or ensure both BINs match
              the same XDF.
            </p>
          ) : compareSummary?.kind === 'ok' && compareSummary.diffCells === 0 ? (
            <p className="text-dark-text2">
              Compare active: no differences vs compare BIN in this table (values match).
            </p>
          ) : compareSummary?.kind === 'ok' && compareSummary.diffCells > 0 ? (
            <p className="text-dark-text2">
              Compare active: {compareSummary.diffCells} cell{compareSummary.diffCells !== 1 ? 's' : ''} differ (max{' '}
              |Δ| = {formatDeltaDisplay(compareSummary.maxAbs, table.decimalPlaces)}).
            </p>
          ) : null}
        </div>
      )}

      {stats && (
        <div
          className={`bg-dark-accent/10 border-b border-dark-border ${
            compactFitMode ? 'px-1.5 py-0.5 text-[10px] leading-tight' : 'px-2 py-1 text-xs'
          }`}
        >
          <div className={`flex flex-wrap ${compactFitMode ? 'gap-2' : 'gap-3'}`}>
            <span>Selected: {stats.count}</span>
            <span>Min: {formatValue(stats.min, table.decimalPlaces)}</span>
            <span>Max: {formatValue(stats.max, table.decimalPlaces)}</span>
            <span>Avg: {formatValue(stats.avg, table.decimalPlaces)}</span>
            <span>Sum: {formatValue(stats.sum, table.decimalPlaces)}</span>
          </div>
        </div>
      )}

      <div
        className={`flex-1 min-h-0 min-w-0 flex flex-col outline-none select-none ${
          fitTableToViewport
            ? 'overflow-hidden p-0.5 touch-manipulation'
            : `overflow-auto scrollbar-thin p-2 max-md:p-1 ${selecting ? 'touch-none' : 'touch-manipulation'}`
        }`}
        ref={gridScrollRef}
        tabIndex={0}
        onKeyDown={(e) => {
          if (!selection || selection.tableId !== table.id) return;
          if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
            e.preventDefault();
            const rows: string[] = [];
            const { minRow, maxRow, minCol, maxCol } = selection.bounds;
            for (let r = minRow; r <= maxRow; r++) {
              const line: string[] = [];
              for (let c = minCol; c <= maxCol; c++) {
                line.push(String(values[r][c]));
              }
              rows.push(line.join('\t'));
            }
            void navigator.clipboard.writeText(rows.join('\n'));
            return;
          }
          if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
            e.preventDefault();
            if (showRawHex || !binBuffer || !data) return;
            void (async () => {
              try {
                const text = await navigator.clipboard.readText();
                const clipRows = text.trim().split(/\n/).filter(Boolean);
                if (clipRows.length === 0) return;
                const newValues = data.values.map((row) => [...row]);
                const { minRow, minCol } = selection.bounds;
                for (let ri = 0; ri < clipRows.length; ri++) {
                  const cols = clipRows[ri].split(/\t/).map((s) => s.trim());
                  for (let ci = 0; ci < cols.length; ci++) {
                    const r = minRow + ri;
                    const c = minCol + ci;
                    if (r >= table.rowCount || c >= table.colCount) continue;
                    const n = parseFloat(cols[ci].replace(',', '.'));
                    if (Number.isNaN(n)) continue;
                    const rounded = clampValue(roundValue(n, table.decimalPlaces), table.min, table.max);
                    newValues[r][c] = rounded;
                  }
                }
                const next = commitFullTableValues(binBuffer, table, data, newValues, addChange);
                setTableData(table.id, next);
              } catch {
                /* clipboard denied */
              }
            })();
          }
        }}
      >
        {(() => {
          const tbl = (
        <table
          ref={tableMeasureRef}
          className="w-full border-separate border-spacing-0.5 max-md:border-spacing-0 select-none max-md:text-[10px]"
        >
          <thead>
            <tr>
              <th
                className={`sticky left-0 z-10 px-2 py-1.5 max-md:px-1 max-md:py-1 text-left text-xs max-md:text-[10px] font-semibold text-dark-text2 rounded-md backdrop-blur-sm border border-transparent select-none ${
                  selBounds && heatmapPrefs.axisHighlight ? 'bg-dark-surface2' : 'bg-dark-surface2'
                }`}
              >
                {table.yAxis.units || 'Y'}
              </th>
              {xAxisLabels.map((label, idx) => (
                <th
                  key={idx}
                  className={`px-2 py-1.5 max-md:px-0.5 max-md:py-0.5 text-center text-xs max-md:text-[10px] font-semibold text-dark-text2 min-w-[52px] max-md:min-w-[28px] rounded-md backdrop-blur-sm border select-none ${
                    axisColHighlight(idx)
                      ? 'border-amber-500/50'
                      : 'border-transparent bg-dark-surface2/50'
                  }`}
                  style={
                    axisColHighlight(idx)
                      ? { backgroundColor: heatmapPrefs.axisHighlightColor }
                      : undefined
                  }
                >
                  {formatValue(label, table.xAxis.decimalPlaces)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {values.map((row, rowIdx) => (
              <tr key={rowIdx}>
                <td
                  className={`sticky left-0 z-10 px-2 py-1.5 max-md:px-1 max-md:py-0.5 text-right text-xs max-md:text-[10px] font-semibold text-dark-text2 rounded-md backdrop-blur-sm border select-none ${
                    axisRowHighlight(rowIdx)
                      ? 'border-amber-500/50'
                      : 'border-transparent bg-dark-surface2'
                  }`}
                  style={
                    axisRowHighlight(rowIdx)
                      ? { backgroundColor: heatmapPrefs.axisHighlightColor }
                      : undefined
                  }
                >
                  {formatValue(yAxisLabels[rowIdx], table.yAxis.decimalPlaces)}
                </td>
                {row.map((value, colIdx) => {
                  const isSelected = isCellSelected(rowIdx, colIdx);
                  const isEditing = editingCell?.row === rowIdx && editingCell?.col === colIdx;
                  const cellBg = getCellColor(value);
                  const cellText = textColorForBackground(cellBg);
                  const overlay =
                    isSelected && !isEditing
                      ? `linear-gradient(rgba(255,255,255,${overlayAlpha}), rgba(255,255,255,${overlayAlpha}))`
                      : null;
                  const selectionRing = isSelected
                    ? `inset 0 0 0 2px ${heatmapPrefs.selectionColor}`
                    : 'none';
                  const editingRing = isEditing ? `inset 0 0 0 2px ${heatmapPrefs.activeRingColor}` : 'none';
                  const boxShadow = [editingRing, selectionRing, '0 1px 2px rgba(0,0,0,0.35)']
                    .filter((x) => x !== 'none')
                    .join(', ');

                  const diff =
                    compareValues &&
                    compareValues[rowIdx]?.[colIdx] !== undefined
                      ? value - compareValues[rowIdx][colIdx]
                      : null;

                  const showDelta =
                    compareMode && diff !== null && Math.abs(diff) > 1e-12;
                  const deltaLineStyle = showDelta ? deltaLineStyleForBackground(cellBg) : undefined;

                  return (
                    <td
                      key={colIdx}
                      data-table-cell
                      data-row={rowIdx}
                      data-col={colIdx}
                      onPointerDown={(e) => handleCellPointerDown(rowIdx, colIdx, e)}
                      onClick={(e) => handleCellClick(rowIdx, colIdx, e)}
                      onDoubleClick={() => handleCellDoubleClick(rowIdx, colIdx)}
                      style={{
                        background: overlay ? `${overlay}, ${cellBg}` : cellBg,
                        color: cellText,
                        boxShadow: boxShadow || undefined,
                        position: 'relative',
                      }}
                      className={`${pad} max-md:!px-0.5 max-md:!py-0.5 text-center text-xs max-md:text-[10px] cursor-pointer rounded-md font-medium transition-[box-shadow,transform] duration-100 ease-out hover:brightness-[1.06] select-none max-md:min-w-[28px]`}
                    >
                      {isEditing ? (
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleEditSubmit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEditSubmit();
                            if (e.key === 'Escape') handleEditCancel();
                          }}
                          autoFocus
                          className="w-full bg-dark-surface/95 border border-dark-accent rounded px-1 py-0.5 text-center text-xs text-dark-text focus:outline-none focus:ring-1 focus:ring-dark-accent select-text"
                          step={Math.pow(10, -table.decimalPlaces)}
                          min={table.min}
                          max={table.max}
                        />
                      ) : (
                        <span className="tabular-nums">
                          {formatValue(value, table.decimalPlaces)}
                          {showDelta && diff !== null && (
                            <span
                              className="block text-[10px] font-semibold leading-tight mt-0.5 tabular-nums"
                              style={deltaLineStyle}
                            >
                              {diff > 0 ? '+' : ''}
                              {formatDeltaDisplay(diff, table.decimalPlaces)}
                            </span>
                          )}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
          );
          if (!fitTableToViewport) return tbl;
          return (
            <div
              ref={fitGridContainerRef}
              className="flex min-h-0 min-w-0 w-full flex-1 items-center justify-center overflow-hidden"
            >
              <div
                style={
                  fitBox.w > 0
                    ? {
                        width: fitBox.w * fitBox.s,
                        height: fitBox.h * fitBox.s,
                        position: 'relative',
                      }
                    : {
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        minHeight: 0,
                      }
                }
              >
                <div
                  style={
                    fitBox.w > 0
                      ? {
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: fitBox.w,
                          height: fitBox.h,
                          transform: `scale(${fitBox.s})`,
                          transformOrigin: 'top left',
                        }
                      : {
                          display: 'inline-block',
                          maxWidth: '100%',
                          maxHeight: '100%',
                        }
                  }
                >
                  {tbl}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
