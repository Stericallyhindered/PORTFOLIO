"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ArrowLeft, ArrowUpDown, Blend, FolderOpen, Save, Search, Sparkles, Upload } from "lucide-react";
import { AiSidecar } from "@/components/ai-sidecar";
import { SurfaceGraph } from "@/components/surface-graph";
import { defaultAiState, defaultPreferences } from "@/lib/defaults";
import type { EditorPreferenceSet, HelpPreview, TuneTable } from "@/lib/types";

type WorkspaceAssets = {
  count: number;
  files: string[];
};

type EditorWorkspaceProps = {
  helpPreview: HelpPreview;
  workspaceAssets: WorkspaceAssets;
};

function sortTables(tables: TuneTable[], mode: "alpha" | "category") {
  return [...tables].sort((a, b) => {
    if (mode === "category" && a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }
    return a.alias.localeCompare(b.alias);
  });
}

function smoothCells(cells: number[][]) {
  return cells.map((row, y) =>
    row.map((value, x) => {
      const neighbors = [value, row[x - 1], row[x + 1], cells[y - 1]?.[x], cells[y + 1]?.[x]].filter(
        (candidate): candidate is number => typeof candidate === "number",
      );
      const average = neighbors.reduce((sum, current) => sum + current, 0) / neighbors.length;
      return Number(average.toFixed(2));
    }),
  );
}

export function EditorWorkspace({ helpPreview, workspaceAssets }: EditorWorkspaceProps) {
  const [tables, setTables] = useState<TuneTable[]>([]);
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<"alpha" | "category">("category");
  const [selectedId, setSelectedId] = useState("");
  const [preferences, setPreferences] = useState<EditorPreferenceSet>(defaultPreferences);
  const [aiEnabled, setAiEnabled] = useState(defaultAiState.enabled);
  const [selectedCell, setSelectedCell] = useState<{ row: number; column: number } | null>(null);
  const [xdfName, setXdfName] = useState<string | null>(null);
  const [binName, setBinName] = useState<string | null>(null);

  const filteredTables = useMemo(() => {
    const filtered = tables.filter((table) => `${table.alias} ${table.name} ${table.category}`.toLowerCase().includes(query.toLowerCase()));
    return sortTables(filtered, sortMode);
  }, [query, sortMode, tables]);

  const selectedTable = filteredTables.find((table) => table.id === selectedId) ?? filteredTables[0] ?? null;

  const updateSelectedTable = (updater: (table: TuneTable) => TuneTable) => {
    if (!selectedTable) {
      return;
    }

    setTables((current) => current.map((table) => (table.id === selectedTable.id ? updater(table) : table)));
  };

  const updateCell = (rowIndex: number, columnIndex: number, value: number) => {
    updateSelectedTable((table) => ({
      ...table,
      cells: table.cells.map((row, y) => (y === rowIndex ? row.map((cell, x) => (x === columnIndex ? value : cell)) : row)),
    }));
  };

  const setPreference = <K extends keyof EditorPreferenceSet>(key: K, value: EditorPreferenceSet[K]) => {
    setPreferences((current) => ({ ...current, [key]: value }));
  };

  return (
    <main
      className="editor-shell"
      style={
        {
          ["--primary" as string]: preferences.primaryColor,
          ["--accent" as string]: preferences.accentColor,
          ["--shadow" as string]: `0 ${preferences.shadowDepth}px ${preferences.shadowDepth * 3}px rgba(0, 0, 0, 0.42)`,
        } as React.CSSProperties
      }
    >
      <header className="editor-header">
        <div>
          <Link className="back-link" href="/dashboard">
            <ArrowLeft size={16} /> Back to Garage
          </Link>
          <span className="eyebrow">BIN Editor</span>
          <h1>Real-file workspace with no mock tables.</h1>
          <div className="meta-row">
            <span className="badge">{xdfName ?? "No XDF loaded"}</span>
            <span className="badge">{binName ?? "No BIN loaded"}</span>
            <span className="badge">{workspaceAssets.count} workspace assets detected</span>
          </div>
        </div>
        <div className="editor-actions">
          <button className="button button-secondary" type="button">
            <FolderOpen size={16} />
            Supabase Project Browser
          </button>
          <button className="button button-primary" type="button">
            <Save size={16} />
            Save Project
          </button>
        </div>
      </header>

      <section className="editor-content">
        <aside className="left-rail card-glass">
          <span className="eyebrow">Table Explorer</span>
          <div className="surface-toolbar">
            <span className="tab-pill">{filteredTables.length} parsed tables</span>
            <button className="button button-secondary" onClick={() => setSortMode((current) => (current === "alpha" ? "category" : "alpha"))} type="button">
              <ArrowUpDown size={16} />
              {sortMode === "alpha" ? "Sort A-Z" : "Sort Category"}
            </button>
          </div>
          <div className="inspector-search">
            <Search size={16} />
            <input onChange={(event) => setQuery(event.target.value)} placeholder="Search once tables are parsed..." value={query} />
          </div>
          <div className="left-rail-content">
            {filteredTables.length > 0 ? (
              filteredTables.map((table) => (
                <button
                  className={clsx("table-nav-button", table.id === selectedTable?.id && "active")}
                  key={table.id}
                  onClick={() => setSelectedId(table.id)}
                  type="button"
                >
                  <strong>{table.alias}</strong>
                  <span>{table.category}</span>
                  <span>{table.sizeLabel}</span>
                </button>
              ))
            ) : (
              <div className="empty-state-card">
                <strong>No tables loaded yet</strong>
                <p className="helper-copy">Upload real XDF and BIN files, then wire the parser layer to populate this explorer.</p>
              </div>
            )}
          </div>
        </aside>

        <div className="center-stack">
          <section className="table-panel card-glass">
            <span className="eyebrow">Real File Intake</span>
            <h2>Bring in your actual assets</h2>
            <div className="upload-grid">
              <label className="upload-card">
                <strong>XDF Definition</strong>
                <p className="helper-copy">{xdfName ?? "No XDF selected yet"}</p>
                <input
                  accept=".xdf"
                  className="hidden-input"
                  onChange={(event) => setXdfName(event.target.files?.[0]?.name ?? null)}
                  type="file"
                />
                <span className="button button-secondary">
                  <Upload size={16} />
                  Choose XDF
                </span>
              </label>
              <label className="upload-card">
                <strong>BIN File</strong>
                <p className="helper-copy">{binName ?? "No BIN selected yet"}</p>
                <input
                  accept=".bin"
                  className="hidden-input"
                  onChange={(event) => setBinName(event.target.files?.[0]?.name ?? null)}
                  type="file"
                />
                <span className="button button-secondary">
                  <Upload size={16} />
                  Choose BIN
                </span>
              </label>
            </div>
            <div className="helper-grid">
              <div className="helper-card">
                <strong>Workspace scan</strong>
                <p className="helper-copy">
                  {workspaceAssets.count > 0 ? workspaceAssets.files.join(", ") : "No local .xdf or .bin files were found in the current workspace."}
                </p>
              </div>
              <div className="helper-card">
                <strong>Parser handoff</strong>
                <p className="helper-copy">Next wiring step is real XDF/BIN parsing so uploaded assets populate tables, graphs, aliases, and AI context.</p>
              </div>
            </div>
          </section>

          <section className="table-panel card-glass">
            <span className="eyebrow">Table Editor</span>
            <h2>{selectedTable ? selectedTable.alias : "Waiting for parsed calibration tables"}</h2>
            <div className="surface-toolbar">
              <span className="panel-caption">
                {selectedTable ? `${selectedTable.category} · ${selectedTable.sizeLabel}` : "No fake calibration values are rendered here."}
              </span>
              <div className="control-row">
                <button
                  className="button button-secondary"
                  disabled={!selectedTable}
                  onClick={() => selectedTable && updateSelectedTable((table) => ({ ...table, cells: smoothCells(table.cells) }))}
                  type="button"
                >
                  <Blend size={16} />
                  Smooth Surface
                </button>
                <button
                  className="button button-secondary"
                  disabled={!selectedTable}
                  onClick={() => selectedTable && updateSelectedTable((table) => ({ ...table, alias: `${table.alias} (Refined)` }))}
                  type="button"
                >
                  <Sparkles size={16} />
                  Alias Pass
                </button>
              </div>
            </div>

            {selectedTable ? (
              <div className="table-grid-wrap">
                <table className="data-grid">
                  <thead>
                    <tr>
                      <th />
                      {selectedTable.xAxis.map((axis) => (
                        <th key={axis}>
                          <div className="axis-cell">{axis}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTable.cells.map((row, rowIndex) => (
                      <tr key={`${selectedTable.id}-${rowIndex}`}>
                        <th>
                          <div className="axis-cell">{selectedTable.yAxis[rowIndex]}</div>
                        </th>
                        {row.map((cell, columnIndex) => (
                          <td className="value-cell" key={`${selectedTable.id}-${rowIndex}-${columnIndex}`}>
                            <input
                              onChange={(event) => updateCell(rowIndex, columnIndex, Number(event.target.value))}
                              onFocus={() => setSelectedCell({ row: rowIndex, column: columnIndex })}
                              step="0.01"
                              type="number"
                              value={cell}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="editor-empty-stage">
                <strong>Parser-driven editor area</strong>
                <p className="helper-copy">When real XDF and BIN parsing is connected, this becomes the gorgeous live table grid instead of fake placeholder data.</p>
              </div>
            )}
          </section>

          <section className="graph-panel card-glass">
            <span className="eyebrow">3D Surface</span>
            <h2>{selectedTable ? selectedTable.alias : "Wow-quality graph stage ready"}</h2>
            <div className="surface-toolbar">
              <span className="panel-caption">
                {selectedTable ? "Rendered from current table values." : "No mock graph values. This stage is reserved for real parsed calibration geometry."}
              </span>
              <span className="tab-pill">{preferences.surfaceStyle}</span>
            </div>
            <div className="graph-shell">
              {selectedTable ? (
                <SurfaceGraph preferences={preferences} table={selectedTable} />
              ) : (
                <div className="graph-empty">
                  <div className="graph-empty-surface" />
                  <p className="helper-copy">Upload and parse real files to light this up.</p>
                </div>
              )}
            </div>
          </section>

          <section className="inspector-panel card-glass">
            <span className="eyebrow">Theme + Identity</span>
            <h2>User customization</h2>
            <div className="inspector-stack">
              <div className="rename-block">
                <label>
                  <span>Display alias</span>
                  <input
                    disabled={!selectedTable}
                    onChange={(event) => updateSelectedTable((table) => ({ ...table, alias: event.target.value }))}
                    type="text"
                    value={selectedTable?.alias ?? ""}
                  />
                </label>
                <label>
                  <span>Category</span>
                  <input
                    disabled={!selectedTable}
                    onChange={(event) => updateSelectedTable((table) => ({ ...table, category: event.target.value }))}
                    type="text"
                    value={selectedTable?.category ?? ""}
                  />
                </label>
              </div>
              <div className="settings-grid">
                <label>
                  <span>Primary color</span>
                  <input onChange={(event) => setPreference("primaryColor", event.target.value)} type="color" value={preferences.primaryColor} />
                </label>
                <label>
                  <span>Accent color</span>
                  <input onChange={(event) => setPreference("accentColor", event.target.value)} type="color" value={preferences.accentColor} />
                </label>
                <label>
                  <span>Shadow depth</span>
                  <input max="70" min="18" onChange={(event) => setPreference("shadowDepth", Number(event.target.value))} type="range" value={preferences.shadowDepth} />
                </label>
                <label>
                  <span>Surface style</span>
                  <select onChange={(event) => setPreference("surfaceStyle", event.target.value as EditorPreferenceSet["surfaceStyle"])} value={preferences.surfaceStyle}>
                    <option value="mesh">Mesh</option>
                    <option value="glass">Glass</option>
                    <option value="contour">Contour</option>
                  </select>
                </label>
              </div>
            </div>
          </section>
        </div>

        <AiSidecar
          ai={defaultAiState}
          binName={binName}
          enabled={aiEnabled}
          helpPreview={helpPreview}
          onToggle={() => setAiEnabled((current) => !current)}
          selectedCell={selectedCell}
          selectedTable={selectedTable}
          xdfName={xdfName}
        />
      </section>
    </main>
  );
}
