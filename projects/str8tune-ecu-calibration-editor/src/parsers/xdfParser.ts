import { ParsedTable, ParsedAxis, XDFAxis } from '../types/xdf';

/**
 * Parse hex address string to decimal number
 */
function parseHexAddress(hexStr: string | undefined): number | undefined {
  if (!hexStr) return undefined;
  // Remove 0x prefix if present
  const cleaned = hexStr.startsWith('0x') ? hexStr.slice(2) : hexStr;
  return parseInt(cleaned, 16);
}

/**
 * Parse MATH equation string
 */
function parseMathEquation(math: { equation: string } | undefined): string | undefined {
  return math?.equation;
}

/**
 * Parse an XDF axis to a ParsedAxis
 */
function parseAxis(axis: XDFAxis, defaults: { datasizeinbits: number; lsbfirst: number }, axisId?: 'x' | 'y' | 'z'): ParsedAxis {
  const embeddedData = axis.EMBEDDEDDATA;
  const address = parseHexAddress(embeddedData?.mmedaddress);
  const elementSizeBits = embeddedData?.mmedelementsizebits ?? defaults.datasizeinbits;
  
  // Determine count based on axis type:
  // - X axis: use mmedcolcount (number of columns)
  // - Y axis: use mmedrowcount (number of rows), but fallback to mmedcolcount or indexcount
  // - Z axis: use mmedrowcount * mmedcolcount or indexcount
  let count: number;
  if (axisId === 'x') {
    // X axis: count is the number of columns
    count = axis.indexcount ?? embeddedData?.mmedcolcount ?? 1;
  } else if (axisId === 'y') {
    // Y axis: count is the number of rows
    // Some XDF files use mmedcolcount for Y axis, so check both
    count = axis.indexcount ?? embeddedData?.mmedrowcount ?? embeddedData?.mmedcolcount ?? 1;
  } else {
    // Z axis: use rowCount * colCount or indexcount
    const rowCount = embeddedData?.mmedrowcount ?? 1;
    const colCount = embeddedData?.mmedcolcount ?? 1;
    count = axis.indexcount ?? (rowCount * colCount);
  }
  
  // Parse labels if present
  const labels = axis.LABEL?.map(l => parseFloat(l.value)).filter(v => !isNaN(v));
  
  return {
    address,
    elementSizeBits,
    count,
    labels,
    mathEquation: parseMathEquation(axis.MATH),
    units: axis.units,
    decimalPlaces: Math.max(0, Math.min(100, Math.round(axis.decimalpl ?? 0))),
    embedded: !!embeddedData?.mmedaddress,
  };
}

/**
 * Parse XDF XML file to structured data
 */
export function parseXDF(xmlContent: string): { header: any; tables: ParsedTable[] } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent, 'text/xml');
  
  // Check for parsing errors
  const parserError = doc.querySelector('parsererror');
  if (parserError !== null) {
    const errorText = parserError.textContent;
    throw new Error(`XML parsing error: ${errorText ?? 'Unknown parsing error'}`);
  }
  
  const xdfFormat = doc.documentElement;
  if (xdfFormat.nodeName !== 'XDFFORMAT') {
    throw new Error('Invalid XDF file: root element must be XDFFORMAT');
  }
  
  // Version is available but not used in parsing
  // const version = xdfFormat.getAttribute('version') || '1.60';
  
  // Parse header
  const headerEl = xdfFormat.querySelector('XDFHEADER');
  if (!headerEl) {
    throw new Error('XDF file missing XDFHEADER');
  }
  
  const defaultsEl = headerEl.querySelector('DEFAULTS');
  const defaults = {
    datasizeinbits: parseInt(defaultsEl?.getAttribute('datasizeinbits') || '16', 10),
    sigdigits: parseInt(defaultsEl?.getAttribute('sigdigits') || '1', 10),
    outputtype: parseInt(defaultsEl?.getAttribute('outputtype') || '1', 10),
    signed: parseInt(defaultsEl?.getAttribute('signed') || '0', 10),
    lsbfirst: parseInt(defaultsEl?.getAttribute('lsbfirst') || '1', 10),
    float: parseInt(defaultsEl?.getAttribute('float') || '0', 10),
  };
  
  // Parse categories
  const categories: Array<{ index: number; name: string }> = [];
  headerEl.querySelectorAll('CATEGORY').forEach(cat => {
    const index = parseInt(cat.getAttribute('index') || '0', 16);
    const name = cat.getAttribute('name') || '';
    categories.push({ index, name });
  });
  
  // Parse region
  const regionEl = headerEl.querySelector('REGION');
  const region = regionEl ? {
    type: regionEl.getAttribute('type') || '',
    startaddress: regionEl.getAttribute('startaddress') || '',
    size: regionEl.getAttribute('size') || '',
    regionflags: regionEl.getAttribute('regionflags') || '',
    name: regionEl.getAttribute('name') || '',
    desc: regionEl.getAttribute('desc') || '',
  } : undefined;
  
  const header = {
    flags: headerEl.querySelector('flags')?.textContent,
    description: headerEl.querySelector('description')?.textContent,
    DEFAULTS: defaults,
    REGION: region,
    CATEGORY: categories,
  };
  
  // Parse tables
  const tables: ParsedTable[] = [];
  const tableElements = xdfFormat.querySelectorAll('XDFTABLE');
  const usedIds = new Set<string>(); // Track used IDs to ensure uniqueness

  tableElements.forEach((tableEl, index) => {
    try {
      const title = tableEl.querySelector('title')?.textContent || `Table ${index}`;
      const description = tableEl.querySelector('description')?.textContent;
      const uniqueid = tableEl.getAttribute('uniqueid');
      
      // Parse category memberships
      const categoryMems: number[] = [];
      tableEl.querySelectorAll('CATEGORYMEM').forEach(cm => {
        const catIndex = parseInt(cm.getAttribute('category') || '0', 10);
        categoryMems.push(catIndex);
      });
      
      // Parse axes
      const axes: XDFAxis[] = [];
      tableEl.querySelectorAll('XDFAXIS').forEach(axisEl => {
        const axisId = axisEl.getAttribute('id') as 'x' | 'y' | 'z' | null;
        if (!axisId) return;
        
        const embeddedDataEl = axisEl.querySelector('EMBEDDEDDATA');
        const embeddedData = embeddedDataEl ? {
          mmedtypeflags: embeddedDataEl.getAttribute('mmedtypeflags') || undefined,
          mmedaddress: embeddedDataEl.getAttribute('mmedaddress') || undefined,
          mmedelementsizebits: embeddedDataEl.getAttribute('mmedelementsizebits') 
            ? parseInt(embeddedDataEl.getAttribute('mmedelementsizebits')!, 10) 
            : undefined,
          mmedrowcount: embeddedDataEl.getAttribute('mmedrowcount') 
            ? parseInt(embeddedDataEl.getAttribute('mmedrowcount')!, 10) 
            : undefined,
          mmedcolcount: embeddedDataEl.getAttribute('mmedcolcount') 
            ? parseInt(embeddedDataEl.getAttribute('mmedcolcount')!, 10) 
            : undefined,
          mmedmajorstridebits: embeddedDataEl.getAttribute('mmedmajorstridebits') 
            ? parseInt(embeddedDataEl.getAttribute('mmedmajorstridebits')!, 10) 
            : undefined,
          mmedminorstridebits: embeddedDataEl.getAttribute('mmedminorstridebits') 
            ? parseInt(embeddedDataEl.getAttribute('mmedminorstridebits')!, 10) 
            : undefined,
        } : undefined;
        
        const mathEl = axisEl.querySelector('MATH');
        const math = mathEl ? {
          equation: mathEl.getAttribute('equation') || mathEl.textContent || 'X',
          VAR: { id: 'X' }, // Default VAR
        } : undefined;
        
        const labels: Array<{ index: number; value: string }> = [];
        axisEl.querySelectorAll('LABEL').forEach(labelEl => {
          const idx = parseInt(labelEl.getAttribute('index') || '0', 10);
          const val = labelEl.getAttribute('value') || '';
          labels.push({ index: idx, value: val });
        });
        
        const dalinks: Array<{ index: number }> = [];
        axisEl.querySelectorAll('DALINK').forEach(daEl => {
          const idx = parseInt(daEl.getAttribute('index') || '0', 10);
          dalinks.push({ index: idx });
        });
        
        const embedInfoEl = axisEl.querySelector('embedinfo');
        const embedInfo = embedInfoEl ? {
          type: parseInt(embedInfoEl.getAttribute('type') || '0', 10),
        } : undefined;
        
        axes.push({
          id: axisId,
          uniqueid: axisEl.getAttribute('uniqueid') || undefined,
          EMBEDDEDDATA: embeddedData,
          units: axisEl.querySelector('units')?.textContent || undefined,
          indexcount: axisEl.querySelector('indexcount')?.textContent 
            ? parseInt(axisEl.querySelector('indexcount')!.textContent!, 10) 
            : undefined,
          decimalpl: axisEl.querySelector('decimalpl')?.textContent 
            ? (() => {
                const parsed = parseInt(axisEl.querySelector('decimalpl')!.textContent!, 10);
                return isNaN(parsed) ? undefined : Math.max(0, Math.min(100, parsed));
              })()
            : undefined,
          datatype: axisEl.querySelector('datatype')?.textContent 
            ? parseInt(axisEl.querySelector('datatype')!.textContent!, 10) 
            : undefined,
          unittype: axisEl.querySelector('unittype')?.textContent 
            ? parseInt(axisEl.querySelector('unittype')!.textContent!, 10) 
            : undefined,
          embedinfo: embedInfo,
          DALINK: dalinks.length > 0 ? dalinks : undefined,
          LABEL: labels.length > 0 ? labels : undefined,
          MATH: math,
          min: axisEl.querySelector('min')?.textContent || undefined,
          max: axisEl.querySelector('max')?.textContent || undefined,
          outputtype: axisEl.querySelector('outputtype')?.textContent 
            ? parseInt(axisEl.querySelector('outputtype')!.textContent!, 10) 
            : undefined,
        });
      });
      
      // Find x, y, z axes
      const xAxis = axes.find(a => a.id === 'x');
      const yAxis = axes.find(a => a.id === 'y');
      const zAxis = axes.find(a => a.id === 'z');
      
      // Parse tables even without z-axis - they might be constants or have special handling
      // If no z-axis, create a default one
      let finalZAxis: XDFAxis;
      if (!zAxis) {
        // Create a default z-axis for tables without one
        const defaultZAxis: XDFAxis = {
          id: 'z',
          EMBEDDEDDATA: undefined,
          indexcount: 1,
          LABEL: undefined,
          MATH: undefined,
          units: undefined,
          decimalpl: undefined,
        };
        axes.push(defaultZAxis);
        finalZAxis = defaultZAxis;
      } else {
        finalZAxis = zAxis;
      }
      
      const parsedXAxis = xAxis ? parseAxis(xAxis, defaults, 'x') : {
        elementSizeBits: defaults.datasizeinbits,
        count: 1,
        decimalPlaces: 0,
        embedded: false,
      };
      
      const parsedYAxis = yAxis ? parseAxis(yAxis, defaults, 'y') : {
        elementSizeBits: defaults.datasizeinbits,
        count: 1,
        decimalPlaces: 0,
        embedded: false,
      };
      
      const parsedZAxis = parseAxis(finalZAxis, defaults, 'z');
      
      // Determine table dimensions from Z axis embedded data
      // If Z axis doesn't have explicit dimensions, use X/Y axis counts
      const embeddedData = finalZAxis.EMBEDDEDDATA;
      const rowCount = embeddedData?.mmedrowcount ?? parsedYAxis.count ?? 1;
      const colCount = embeddedData?.mmedcolcount ?? parsedXAxis.count ?? 1;
      
      // Debug logging for first few tables
      if (index < 5) {
        console.log(`Parsed table "${title}":`, {
          address: parsedZAxis.address ? `0x${parsedZAxis.address.toString(16)}` : 'undefined',
          rowCount,
          colCount,
          xAxisCount: parsedXAxis.count,
          yAxisCount: parsedYAxis.count,
          zAxisAddress: embeddedData?.mmedaddress,
          zAxisRowCount: embeddedData?.mmedrowcount,
          zAxisColCount: embeddedData?.mmedcolcount,
        });
      }
      
      // Ensure unique ID - use uniqueid if available, otherwise generate from index
      // If uniqueid exists but is empty or already used, generate a unique one
      let tableId = uniqueid && uniqueid.trim() !== '' ? uniqueid : `table_${index}`;
      
      // If ID is already used, append index to make it unique
      if (usedIds.has(tableId)) {
        let counter = 1;
        let newId = `${tableId}_${counter}`;
        while (usedIds.has(newId)) {
          counter++;
          newId = `${tableId}_${counter}`;
        }
        tableId = newId;
      }
      usedIds.add(tableId);
      
      const table: ParsedTable = {
        id: tableId,
        title,
        description,
        categories: categoryMems,
        xAxis: parsedXAxis,
        yAxis: parsedYAxis,
        zAxis: parsedZAxis,
        address: parsedZAxis.address,
        elementSizeBits: parsedZAxis.elementSizeBits,
        rowCount,
        colCount,
        // Handle negative stride bits (they're valid in XDF format)
        majorStrideBits: embeddedData?.mmedmajorstridebits ?? 0,
        minorStrideBits: embeddedData?.mmedminorstridebits ?? 0,
        mathEquation: parsedZAxis.mathEquation,
        units: parsedZAxis.units,
        decimalPlaces: parsedZAxis.decimalPlaces,
        min: finalZAxis.min ? parseFloat(finalZAxis.min) : undefined,
        max: finalZAxis.max ? parseFloat(finalZAxis.max) : undefined,
      };
      
      tables.push(table);
    } catch (error) {
      console.warn(`Failed to parse table ${index}:`, error);
      // Continue parsing other tables
    }
  });
  
  return { header, tables };
}

