import { useState } from 'react';
import { Layout } from './components/Layout';
import { Table2D } from './components/Table2D';
import { Table3D } from './components/Table3D';
import { TuningAssistant } from './components/TuningAssistant';
import { useStore } from './store/useStore';
import { Code2, Grid3x3, Box } from 'lucide-react';

function App() {
  const selectedTable = useStore((s) => {
    const id = s.selectedTableId;
    return id ? s.tables.find((t) => t.id === id) : undefined;
  });
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  
  return (
    <>
      <Layout>
        {selectedTable ? (
        <div className="flex h-full min-h-0 flex-1 flex-col">
          {/* View Mode Toggle */}
          <div className="flex gap-1 bg-dark-surface border border-dark-border rounded p-1 mb-2 flex-shrink-0">
            <button
              onClick={() => setViewMode('2d')}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                viewMode === '2d'
                  ? 'bg-dark-accent text-white'
                  : 'bg-dark-surface2 text-dark-text2 hover:bg-dark-border'
              }`}
            >
              <Grid3x3 className="w-3 h-3" />
              <span>2D</span>
            </button>
            <button
              onClick={() => setViewMode('3d')}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                viewMode === '3d'
                  ? 'bg-dark-accent text-white'
                  : 'bg-dark-surface2 text-dark-text2 hover:bg-dark-border'
              }`}
            >
              <Box className="w-3 h-3" />
              <span>3D</span>
            </button>
          </div>
          
          {/* Content - fills remaining space */}
          <div className="flex-1 min-h-0">
            {viewMode === '2d' && (
              <div className="h-full">
                <Table2D table={selectedTable} />
              </div>
            )}
            {viewMode === '3d' && (
              <div className="h-full">
                <Table3D table={selectedTable} />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-dark-surface border border-dark-border rounded-lg p-6 text-center">
          <Code2 className="w-8 h-8 mx-auto mb-2 text-dark-text2" />
          <h2 className="text-sm font-semibold mb-1">No Table Selected</h2>
          <p className="text-xs text-dark-text2">
            Select a parameter from the sidebar to view and edit its table
          </p>
        </div>
      )}
      </Layout>
      <TuningAssistant />
    </>
  );
}

export default App

