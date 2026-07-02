import { Download } from 'lucide-react';
import { useStore } from '../store/useStore';
import { downloadBinFile } from '../parsers/binWriter';

export function SaveButton() {
  const { binBuffer, binFileName, changes } = useStore();

  const handleExport = () => {
    if (!binBuffer) {
      alert('No BIN file loaded');
      return;
    }

    const filename = binFileName
      ? binFileName.replace(/\.bin$/i, '_modified.bin')
      : 'modified.bin';

    downloadBinFile(binBuffer, filename);
  };

  if (!binBuffer) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className="flex items-center gap-1 px-2 py-1 bg-dark-accent hover:bg-dark-accentHover text-white rounded text-xs transition-colors font-medium"
      title="Download the full calibration from memory to a .bin file. Includes every table you have applied to the in-memory BIN. This is not the same as “Apply to BIN” on a single map."
    >
      <Download className="w-3.5 h-3.5" />
      <span>Export BIN</span>
      {changes.length > 0 && (
        <span className="text-xs bg-white/15 px-1.5 py-0.5 rounded tabular-nums" title="Unsaved cell edits tracked (any table)">
          {changes.length}
        </span>
      )}
    </button>
  );
}

