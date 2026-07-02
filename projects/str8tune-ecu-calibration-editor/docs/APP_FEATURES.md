# CHEAPTOONER — application reference (bin editing / TunerPro-style)

## Files
- **XDF**: Definition file listing tables, addresses, scaling, axes.
- **BIN**: Calibration binary edited in memory; **Export BIN** (header) downloads the full file.

## Main areas
- **Parameter tree**: Search and select a table (map).
- **2D / 3D**: Toggle table view; 3D uses Plotly surface with same heatmap colorscale as 2D.
- **Scaled / Raw**: Toggle between converted values and raw hex (table math tools require scaled values, like TunerPro).

## Table selection (TunerPro-like)
- **Click** a cell to select; **drag** for rectangle; **Shift+click** extends from anchor; **Ctrl/Cmd+click** adds/removes cells.
- **Ctrl/Cmd+C**: Copy selection as tab-separated values (Excel-compatible).
- **Ctrl/Cmd+V**: Paste from clipboard into selection (top-left at selection anchor).

## Table toolbox (selection required)
- **Offset (+/-)**: Add constant to selected cells.
- **Percentage (%)**: Multiply by `1 + p/100`.
- **Scale (×)**: Multiply by factor.
- **Fill with value**: Set every selected cell to the value.
- **Smooth (Gaussian)**: Blur values within the selection (horizontal pass on selected rows/cols).
- **Smooth (linear blend)**: Spread min→max across selection order (use sparingly).
- **Linear gradient**: Fill along horizontal, vertical, or diagonal using start/end values.
- **Radial gradient**: Fill from center to edge using center/edge values.
- **Quick**: ±1 offset, ±5% buttons.

## Per-table actions
- **Apply to BIN**: Write this map’s cells from the editor into the in-memory BIN (other maps unchanged until you apply them).
- **Reset table**: Restore **only this map** from the snapshot taken when the BIN was loaded (does not reload the whole file).
- **Undo / Redo**: Cell-edit history (global order across maps).
- **Export BIN** (header): Download the full calibration from memory to a `.bin` file.
- **Compare BIN** (optional): Load a second BIN with the same XDF; enable compare mode to show per-cell delta vs compare file.

## Heatmap
- Fixed red→green scale by value within table min/max (global to the table).

## AI assistant
- **MHD guide** (panel): Full bundled MHD guide text, plus an optional **Ask (MHD only)** tab that uses OpenRouter with **retrieved MHD guide excerpts only** — it does not read your XDF/BIN or map cells. Use the editor for calibration data.

## Not included (vs full TunerPro RT)
- Live data acquisition, emulation, hardware interfaces, ADX/XDL logging, stack/split bins, full hex editor suite (basic raw view may be added separately).
