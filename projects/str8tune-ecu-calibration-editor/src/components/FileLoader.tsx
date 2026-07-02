import { useRef, useState } from 'react';
import { Upload, File, X, GitCompare } from 'lucide-react';
import { useStore } from '../store/useStore';
import { parseXDF } from '../parsers/xdfParser';
import { loadBinFile, readAllTables } from '../parsers/binReader';

export function FileLoader() {
  const xdfInputRef = useRef<HTMLInputElement>(null);
  const binInputRef = useRef<HTMLInputElement>(null);
  const compareInputRef = useRef<HTMLInputElement>(null);
  const [xdfFile, setXdfFile] = useState<File | null>(null);
  const [binFile, setBinFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const {
    setXDFContent,
    setBinBuffer,
    setTableData,
    setCompareBin,
    clearCompareBin,
    refreshCompareTableData,
    compareBinFileName,
    compareMode,
    setCompareMode,
  } = useStore();
  
  const handleXDFLoad = async (file: File) => {
    setLoading(true);
    setError(null);
    
    try {
      const text = await file.text();
      const { header, tables } = parseXDF(text);
      
      setXDFContent(text, file.name);
      useStore.setState({ xdfHeader: header, tables });
      setXdfFile(file);
      
      // If BIN is already loaded, read table data
      const binBuffer = useStore.getState().binBuffer;
      if (binBuffer) {
        const tableDataMap = readAllTables(binBuffer, tables);
        tableDataMap.forEach((data, id) => {
          setTableData(id, data);
          // Store original data for revert functionality
          useStore.getState().setOriginalTableData(id, JSON.parse(JSON.stringify(data)));
        });
      }
      // Compare BIN may have been loaded before XDF existed — parse it now
      refreshCompareTableData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse XDF file');
      console.error('XDF parsing error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleBinLoad = async (file: File) => {
    setLoading(true);
    setError(null);
    
    try {
      const buffer = await loadBinFile(file);
      setBinBuffer(buffer, file.name);
      setBinFile(file);
      
      // If XDF is already loaded, read table data
      const tables = useStore.getState().tables;
      if (tables.length > 0) {
        const tableDataMap = readAllTables(buffer, tables);
        tableDataMap.forEach((data, id) => {
          setTableData(id, data);
          // Store original data for revert functionality
          useStore.getState().setOriginalTableData(id, JSON.parse(JSON.stringify(data)));
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load BIN file');
      console.error('BIN loading error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleXDFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleXDFLoad(file);
    }
  };
  
  const handleBinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleBinLoad(file);
    }
  };
  
  const clearXDF = () => {
    setXdfFile(null);
    setXDFContent('');
    useStore.setState({ tables: [], xdfHeader: null, tableData: new Map() });
    clearCompareBin();
    if (xdfInputRef.current) xdfInputRef.current.value = '';
  };
  
  const clearBin = () => {
    setBinFile(null);
    setBinBuffer(new ArrayBuffer(0), '');
    useStore.setState({ tableData: new Map() });
    clearCompareBin();
    if (binInputRef.current) binInputRef.current.value = '';
  };

  const handleCompareBin = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const buffer = await loadBinFile(file);
      setCompareBin(buffer, file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load compare BIN');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-dark-surface border border-dark-border rounded-lg p-2 mb-2">
      <h2 className="text-sm font-semibold mb-2">Load Files</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {/* XDF File Loader */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-dark-text2 mb-1">
            XDF Definition File
          </label>
          <div className="flex items-center gap-1">
            <input
              ref={xdfInputRef}
              type="file"
              accept=".xdf"
              onChange={handleXDFChange}
              className="hidden"
              id="xdf-input"
            />
            <label
              htmlFor="xdf-input"
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-dark-surface2 border border-dark-border rounded cursor-pointer hover:bg-dark-border transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="text-xs">Choose XDF file</span>
            </label>
            {xdfFile && (
              <button
                onClick={clearXDF}
                className="p-1 text-dark-text2 hover:text-dark-text transition-colors"
                title="Clear XDF"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {xdfFile && (
            <div className="flex items-center gap-1 text-xs text-dark-text2">
              <File className="w-3 h-3" />
              <span className="truncate">{xdfFile.name}</span>
            </div>
          )}
        </div>
        
        {/* BIN File Loader */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-dark-text2 mb-1">
            BIN Calibration File
          </label>
          <div className="flex items-center gap-1">
            <input
              ref={binInputRef}
              type="file"
              accept=".bin"
              onChange={handleBinChange}
              className="hidden"
              id="bin-input"
            />
            <label
              htmlFor="bin-input"
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-dark-surface2 border border-dark-border rounded cursor-pointer hover:bg-dark-border transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="text-xs">Choose BIN file</span>
            </label>
            {binFile && (
              <button
                onClick={clearBin}
                className="p-1 text-dark-text2 hover:text-dark-text transition-colors"
                title="Clear BIN"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {binFile && (
            <div className="flex items-center gap-1 text-xs text-dark-text2">
              <File className="w-3 h-3" />
              <span className="truncate">{binFile.name}</span>
            </div>
          )}
        </div>
      </div>
      
      {loading && (
        <div className="mt-2 text-xs text-dark-text2">Loading...</div>
      )}
      
      {error && (
        <div className="mt-2 p-2 bg-dark-error/20 border border-dark-error rounded text-xs text-dark-error">
          {error}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-dark-border space-y-1">
        <label className="block text-xs font-medium text-dark-text2 mb-1">
          Compare BIN (optional, same XDF)
        </label>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            ref={compareInputRef}
            type="file"
            accept=".bin"
            className="hidden"
            id="compare-bin-input"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleCompareBin(file);
            }}
          />
          <label
            htmlFor="compare-bin-input"
            className="flex items-center gap-1 px-2 py-1 bg-dark-surface2 border border-dark-border rounded cursor-pointer hover:bg-dark-border text-xs"
          >
            <GitCompare className="w-3.5 h-3.5" />
            Load compare BIN
          </label>
          {compareBinFileName && (
            <div className="flex flex-col gap-1 w-full">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-dark-text2 truncate max-w-[200px]">{compareBinFileName}</span>
                <label className="flex items-center gap-1 text-xs text-dark-text2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={compareMode}
                    onChange={(e) => setCompareMode(e.target.checked)}
                  />
                  Show Δ
                </label>
                <button
                  type="button"
                  onClick={() => {
                    clearCompareBin();
                    if (compareInputRef.current) compareInputRef.current.value = '';
                  }}
                  className="text-xs text-dark-text2 hover:text-dark-text"
                >
                  Clear
                </button>
              </div>
              <p className="text-[11px] text-dark-text2 leading-snug">
                Select a map in the sidebar, switch to <span className="text-dark-text font-medium">2D</span> (not 3D).
                With Show Δ on, each cell shows your value and an amber line underneath with the difference vs the
                compare BIN. Identical cells have no extra line.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
