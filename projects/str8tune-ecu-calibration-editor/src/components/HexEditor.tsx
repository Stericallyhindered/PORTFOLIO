import { useMemo } from 'react';
import { useStore } from '../store/useStore';

export function HexEditor() {
  const { binBuffer } = useStore();
  
  const hexData = useMemo(() => {
    if (!binBuffer) return null;
    
    const view = new Uint8Array(binBuffer);
    const rows: string[] = [];
    const bytesPerRow = 16;
    
    for (let i = 0; i < view.length; i += bytesPerRow) {
      const offset = i.toString(16).padStart(8, '0').toUpperCase();
      const bytes = Array.from(view.slice(i, i + bytesPerRow))
        .map(b => b.toString(16).padStart(2, '0').toUpperCase())
        .join(' ');
      const ascii = Array.from(view.slice(i, i + bytesPerRow))
        .map(b => (b >= 32 && b < 127) ? String.fromCharCode(b) : '.')
        .join('');
      
      rows.push(`${offset}  ${bytes.padEnd(48)}  ${ascii}`);
    }
    
    return rows;
  }, [binBuffer]);
  
  if (!binBuffer || !hexData) {
    return (
      <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
        <p className="text-dark-text2">No binary data loaded</p>
      </div>
    );
  }
  
  return (
    <div className="bg-dark-surface border border-dark-border rounded-lg overflow-hidden">
      <div className="p-4 border-b border-dark-border">
        <h3 className="text-lg font-semibold">Hex Editor</h3>
        <p className="text-sm text-dark-text2 mt-1">
          Raw binary data view ({binBuffer.byteLength} bytes)
        </p>
      </div>
      <div className="overflow-auto scrollbar-thin p-4 font-mono text-xs" style={{ maxHeight: '600px' }}>
        <pre className="text-dark-text2">
          {hexData.join('\n')}
        </pre>
      </div>
    </div>
  );
}

