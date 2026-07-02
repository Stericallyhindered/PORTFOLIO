import { useState, useMemo } from 'react';
import { Search, ChevronRight, ChevronDown } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { ParsedTable, XDFCategory } from '../types/xdf';

export function ParameterTree() {
  const { tables, xdfHeader, selectedTableId, setSelectedTable } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  
  type CategoryWithTables = XDFCategory & { tables: ParsedTable[] };

  const formatTableLabel = (table: Pick<ParsedTable, 'title' | 'description'>) => {
    const alt = table.description?.trim();
    return alt ? `${table.title} (${alt})` : table.title;
  };
  
  // Group tables by category
  const categorizedTables: CategoryWithTables[] = useMemo(() => {
    const categories = (xdfHeader?.CATEGORY ?? []) as XDFCategory[];
    if (!Array.isArray(categories) || categories.length === 0) return [];

    const categoryMap = new Map<number, ParsedTable[]>();
    
    tables.forEach((table) => {
      table.categories.forEach((catId) => {
        if (!categoryMap.has(catId)) {
          categoryMap.set(catId, []);
        }
        categoryMap.get(catId)!.push(table);
      });
    });
    
    return categories
      .map((cat) => ({
        ...cat,
        tables: categoryMap.get(cat.index) || [],
      }))
      .filter((cat) => cat.tables.length > 0);
  }, [tables, xdfHeader]);
  
  // Filter tables based on search
  const filteredCategories: CategoryWithTables[] = useMemo(() => {
    if (!searchQuery.trim()) return categorizedTables;
    
    const query = searchQuery.toLowerCase();
    return categorizedTables.map((cat) => ({
      ...cat,
      tables: cat.tables.filter(
        (table) =>
          table.title.toLowerCase().includes(query) ||
          table.description?.toLowerCase().includes(query)
      ),
    })).filter((cat) => cat.tables.length > 0);
  }, [categorizedTables, searchQuery]);
  
  const toggleCategory = (index: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedCategories(newExpanded);
  };
  
  if (tables.length === 0) {
    return (
      <div className="rounded-lg border border-dark-border bg-dark-surface p-2">
        <p className="text-xs text-dark-text2">Load an XDF file to see parameters</p>
      </div>
    );
  }
  
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-dark-border bg-dark-surface">
      {/* Search */}
      <div className="shrink-0 border-b border-dark-border p-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-dark-text2" />
          <input
            type="text"
            placeholder="Search by name or alt name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-2 py-1 bg-dark-surface2 border border-dark-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-dark-accent"
          />
        </div>
      </div>
      
      {/* Tree */}
      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        {filteredCategories.map((category, catIdx: number) => {
          const isExpanded = expandedCategories.has(category.index);
          const hasTables = category.tables.length > 0;
          // Use array index as key - guaranteed unique within this array
          // Combine with category name/id to ensure uniqueness even if index is duplicate
          const uniqueKey = `cat-${catIdx}-${category.name || category.index || 'unknown'}`;
          
          return (
            <div key={uniqueKey} className="border-b border-dark-border last:border-b-0">
              <button
                onClick={() => toggleCategory(category.index)}
                className="w-full flex items-center gap-1 px-2 py-1 hover:bg-dark-surface2 transition-colors text-left"
                disabled={!hasTables}
              >
                {hasTables ? (
                  isExpanded ? (
                    <ChevronDown className="w-3 h-3 text-dark-text2 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-dark-text2 flex-shrink-0" />
                  )
                ) : (
                  <div className="w-3" />
                )}
                <span className="flex-1 text-xs font-medium truncate">{category.name}</span>
                <span className="text-xs text-dark-text2 flex-shrink-0">{category.tables.length}</span>
              </button>
              
              {isExpanded && hasTables && (
                <div className="bg-dark-surface2">
                  {category.tables.map((table, tableIdx: number) => (
                    <button
                      key={`${uniqueKey}-table-${tableIdx}-${table.id}`}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent bubbling to category button
                        setSelectedTable(table.id);
                      }}
                      title={formatTableLabel(table)}
                      className={`w-full px-2 py-1 text-left text-xs hover:bg-dark-border transition-colors ${
                        selectedTableId === table.id
                          ? 'bg-dark-accent/20 border-l-2 border-dark-accent'
                          : 'pl-4'
                      }`}
                    >
                      <div className="flex items-baseline gap-1 min-w-0">
                        <span className="truncate">{table.title}</span>
                        {table.description && (
                          <span className="text-[10px] text-dark-text2 font-mono truncate">
                            ({table.description})
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

