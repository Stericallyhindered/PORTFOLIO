import { ReactNode, useEffect, useState } from 'react';
import { BookOpen, List, Grid3x3, PanelLeftClose, Maximize2 } from 'lucide-react';
import { FileLoader } from './FileLoader';
import { ParameterTree } from './ParameterTree';
import { SaveButton } from './SaveButton';
import { useStore } from '../store/useStore';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const setAssistantOpen = useStore((s) => s.setAssistantOpen);
  const selectedTableId = useStore((s) => s.selectedTableId);
  const [mobilePanel, setMobilePanel] = useState<'maps' | 'editor'>(() =>
    useStore.getState().selectedTableId ? 'editor' : 'maps'
  );
  /** When false, map list is hidden so the table editor can use full width (mobile + desktop). */
  const [mapsSidebarOpen, setMapsSidebarOpen] = useState(true);

  useEffect(() => {
    if (selectedTableId) {
      setMobilePanel('editor');
    } else {
      setMobilePanel('maps');
    }
  }, [selectedTableId]);

  useEffect(() => {
    if (!selectedTableId) setMapsSidebarOpen(true);
  }, [selectedTableId]);

  /** Landscape on phone/tablet: give the table full width; map list stays one tap away. */
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1536px) and (orientation: landscape)');
    const apply = () => {
      if (mq.matches && selectedTableId) setMapsSidebarOpen(false);
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [selectedTableId]);

  const showMobileMaps = mapsSidebarOpen && mobilePanel === 'maps';
  const showMobileEditor =
    !!selectedTableId && (mobilePanel === 'editor' || !mapsSidebarOpen);

  return (
    <div className="flex min-h-[100dvh] min-h-[100svh] flex-1 flex-col bg-dark-bg text-dark-text">
      {/* Header */}
      <header className="bg-dark-surface border-b border-dark-border">
        <div className="w-full max-w-none px-3 sm:px-4 py-2 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold">CHEAPTOONER</h1>
            <p className="text-xs text-dark-text2">ECU Calibration Editor</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setAssistantOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-dark-surface2 border border-dark-border rounded hover:bg-dark-border transition-colors"
              title="MHD guide and MHD-only Q&A"
            >
              <BookOpen className="w-3.5 h-3.5" />
              MHD guide
            </button>
            <SaveButton />
          </div>
        </div>
      </header>
      
      {/* Main Content — stacked on phones; side-by-side from md */}
      <main className="flex w-full max-w-none flex-1 flex-col min-h-0 overflow-hidden px-3 sm:px-4 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <FileLoader />

        <div className="flex flex-col flex-1 min-h-0 gap-2 mt-2">
          {/* Mobile: Maps | Table + expand table (hide map list) */}
          {(mapsSidebarOpen || !selectedTableId) && (
            <div className="flex md:hidden gap-1 rounded-lg border border-dark-border bg-dark-surface2 p-1 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setMapsSidebarOpen(true);
                  setMobilePanel('maps');
                }}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded px-2 py-2 text-xs font-medium transition-colors ${
                  mobilePanel === 'maps'
                    ? 'bg-dark-accent text-white'
                    : 'text-dark-text2 hover:bg-dark-border/60'
                }`}
              >
                <List className="w-3.5 h-3.5 shrink-0" />
                Maps
              </button>
              <button
                type="button"
                onClick={() => {
                  setMapsSidebarOpen(true);
                  setMobilePanel('editor');
                }}
                disabled={!selectedTableId}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded px-2 py-2 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  mobilePanel === 'editor'
                    ? 'bg-dark-accent text-white'
                    : 'text-dark-text2 hover:bg-dark-border/60'
                }`}
              >
                <Grid3x3 className="w-3.5 h-3.5 shrink-0" />
                Table
              </button>
              {selectedTableId && mapsSidebarOpen && (
                <button
                  type="button"
                  onClick={() => setMapsSidebarOpen(false)}
                  className="flex shrink-0 items-center justify-center rounded border border-dark-border/70 bg-dark-surface px-2 py-2 text-dark-text2 hover:bg-dark-border/50"
                  title="Expand table — hide map list until you reopen it"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          <div className="flex min-h-0 flex-1 flex-col gap-3 md:flex-row md:gap-3">
            {/* Map list: collapsible on md+; mobile uses showMobileMaps */}
            <aside
              className={`min-h-0 flex w-full shrink-0 flex-col overflow-hidden rounded-lg border border-dark-border bg-dark-surface2/40 ${
                showMobileMaps ? 'max-h-[min(50dvh,520px)] min-h-0 flex-1 max-md:flex' : 'max-md:hidden'
              } ${mapsSidebarOpen ? 'md:flex md:w-64 md:max-w-[16rem] md:flex-none md:max-h-none' : 'md:hidden'}`}
            >
              {mapsSidebarOpen && (
                <>
                  <div className="hidden md:flex items-center justify-between gap-2 border-b border-dark-border px-2 py-2 shrink-0">
                    <span className="text-xs font-semibold text-dark-text2">Map list</span>
                    <button
                      type="button"
                      onClick={() => setMapsSidebarOpen(false)}
                      className="rounded p-1.5 text-dark-text2 hover:bg-dark-border/70 hover:text-dark-text"
                      title="Hide map list — more room for the table"
                    >
                      <PanelLeftClose className="w-4 h-4" aria-hidden />
                    </button>
                  </div>
                  <div className="min-h-0 flex-1 flex flex-col overflow-hidden">
                    <ParameterTree />
                  </div>
                </>
              )}
            </aside>

            <div
              className={`min-h-0 min-w-0 flex flex-1 flex-col ${
                showMobileEditor ? 'max-md:flex' : 'max-md:hidden'
              } md:flex md:min-h-0 md:flex-1`}
            >
              {children}
            </div>
          </div>

          {/* Collapsed: quick access to map list */}
          {!mapsSidebarOpen && selectedTableId && (
            <>
              <button
                type="button"
                onClick={() => {
                  setMapsSidebarOpen(true);
                  setMobilePanel('maps');
                }}
                className="md:hidden fixed z-50 flex items-center gap-2 rounded-full border border-dark-border bg-dark-accent px-3 py-2.5 text-xs font-medium text-white shadow-lg left-3 max-md:bottom-[max(5.5rem,env(safe-area-inset-bottom,0px))]"
              >
                <List className="w-4 h-4 shrink-0" aria-hidden />
                Maps
              </button>
              <button
                type="button"
                onClick={() => {
                  setMapsSidebarOpen(true);
                  setMobilePanel('maps');
                }}
                className="hidden md:flex fixed z-50 left-0 top-1/2 -translate-y-1/2 flex-col items-center gap-1 rounded-r-md border border-l-0 border-dark-border bg-dark-surface2 py-3 pl-1 pr-2 text-[10px] font-medium text-dark-text2 shadow-md hover:bg-dark-border/50"
                title="Show map list"
              >
                <List className="w-4 h-4 shrink-0" aria-hidden />
                <span className="[writing-mode:vertical-rl] rotate-180">Maps</span>
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

