"use client";

import { Bot, Power, Sparkles } from "lucide-react";
import type { AiAssistantState, HelpPreview, TuneTable } from "@/lib/types";

type AiSidecarProps = {
  ai: AiAssistantState;
  helpPreview: HelpPreview;
  selectedTable: TuneTable | null;
  selectedCell: { row: number; column: number } | null;
  enabled: boolean;
  onToggle: () => void;
  xdfName: string | null;
  binName: string | null;
};

export function AiSidecar({ ai, helpPreview, selectedTable, selectedCell, enabled, onToggle, xdfName, binName }: AiSidecarProps) {
  return (
    <aside className="ai-sidecar card-glass">
      <div className="surface-toolbar">
        <div>
          <span className="eyebrow">AI Copilot</span>
          <h2>Context-aware help</h2>
        </div>
        <button className={`toggle-button ${enabled ? "active" : ""}`} onClick={onToggle} type="button">
          <Power size={14} />
          {enabled ? "On" : "Off"}
        </button>
      </div>

      <div className="ai-status-card">
        <div className="feature-icon">
          <Bot size={18} />
        </div>
        <strong>{enabled ? "Assistant enabled" : "Assistant standing by"}</strong>
        <p className="helper-copy">
          Default stays off until you add tokens and an API key. The dock remains visible so the workflow is built in from day one.
        </p>
      </div>

      <div className="ai-message">
        <span className="badge">
          <Sparkles size={12} />
          BINFORGE Guide Memory
        </span>
        <p>
          This assistant should be trained on your internal BINFORGE help guide based on the filtered BIN editing research pack,
          not branded as TunerPro.
        </p>
      </div>

      <div className="helper-grid ai-context-grid">
        <div className="helper-card">
          <strong>Current table</strong>
          <p className="helper-copy">{selectedTable ? selectedTable.alias : "No parsed table yet"}</p>
        </div>
        <div className="helper-card">
          <strong>Current cell</strong>
          <p className="helper-copy">
            {selectedCell ? `Row ${selectedCell.row + 1}, Col ${selectedCell.column + 1}` : "No cell selected"}
          </p>
        </div>
        <div className="helper-card">
          <strong>Loaded files</strong>
          <p className="helper-copy">{xdfName && binName ? `${xdfName} + ${binName}` : "Waiting for real XDF and BIN uploads"}</p>
        </div>
        <div className="helper-card">
          <strong>Guide memory</strong>
          <p className="helper-copy">{helpPreview.includedPages} BIN editing pages indexed for the future BINFORGE help system.</p>
        </div>
      </div>

      <div className="ai-scope-list">
        {ai.systemScope.map((item) => (
          <div className="scope-pill" key={item}>
            {item}
          </div>
        ))}
      </div>

      <div className="ai-scope-list">
        {helpPreview.sampleSections.map((item) => (
          <div className="scope-pill" key={item}>
            {item}
          </div>
        ))}
      </div>
    </aside>
  );
}
