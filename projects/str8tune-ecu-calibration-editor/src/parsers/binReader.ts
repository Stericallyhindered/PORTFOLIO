import { ParsedTable } from '../types/xdf';
import { TableData } from '../types/bin';
import { evaluate } from 'mathjs';

/**
 * Read binary file and return ArrayBuffer
 */
export async function loadBinFile(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result instanceof ArrayBuffer) {
        resolve(e.target.result);
      } else {
        reject(new Error('Failed to read file as ArrayBuffer'));
      }
    };
    reader.onerror = () => reject(new Error('File reading error'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Read value from ArrayBuffer at offset based on data type
 */
function readValue(
  buffer: ArrayBuffer,
  offset: number,
  elementSizeBits: number,
  signed: boolean,
  littleEndian: boolean = true
): number {
  const view = new DataView(buffer);
  
  switch (elementSizeBits) {
    case 8:
      return signed ? view.getInt8(offset) : view.getUint8(offset);
    case 16:
      return signed 
        ? view.getInt16(offset, littleEndian)
        : view.getUint16(offset, littleEndian);
    case 32:
      return signed
        ? view.getInt32(offset, littleEndian)
        : view.getUint32(offset, littleEndian);
    default:
      throw new Error(`Unsupported element size: ${elementSizeBits} bits`);
  }
}

/**
 * Apply MATH equation to convert raw value to scaled value
 */
function applyMathEquation(rawValue: number, equation: string | undefined): number {
  if (!equation || equation === 'X') {
    return rawValue;
  }
  
  try {
    // Replace X with the actual value
    const expression = equation.replace(/X/g, rawValue.toString());
    return evaluate(expression) as number;
  } catch (error) {
    console.warn(`Failed to evaluate equation "${equation}":`, error);
    return rawValue;
  }
}

/**
 * Calculate inverse MATH equation to convert scaled value back to raw
 */
export function inverseMathEquation(scaledValue: number, equation: string | undefined): number {
  if (!equation || equation === 'X') {
    return scaledValue;
  }
  
  try {
    // Simple inverse for common patterns
    // X*0.1 -> scaledValue / 0.1
    // X*1 -> scaledValue / 1
    const multMatch = equation.match(/X\s*\*\s*([\d.]+)/);
    if (multMatch) {
      const multiplier = parseFloat(multMatch[1]);
      if (multiplier !== 0) {
        return scaledValue / multiplier;
      }
    }
    
    // X/0.1 -> scaledValue * 0.1
    const divMatch = equation.match(/X\s*\/\s*([\d.]+)/);
    if (divMatch) {
      const divisor = parseFloat(divMatch[1]);
      if (divisor !== 0) {
        return scaledValue * divisor;
      }
    }
    
    // Handle (X*0.1) or similar with parentheses
    const parenMatch = equation.match(/\(?\s*X\s*\*\s*([\d.]+)\s*\)?/);
    if (parenMatch) {
      const multiplier = parseFloat(parenMatch[1]);
      if (multiplier !== 0) {
        return scaledValue / multiplier;
      }
    }
    
    // Fallback: try to solve algebraically or use approximation
    // For now, just return scaled value (this may need refinement)
    console.warn(`Complex equation "${equation}" - using scaled value as raw`);
    return scaledValue;
  } catch (error) {
    console.warn(`Failed to inverse equation "${equation}":`, error);
    return scaledValue;
  }
}

/**
 * Read table data from BIN file based on XDF definition
 */
export function readTableData(
  buffer: ArrayBuffer,
  table: ParsedTable,
  signed: boolean = false,
  littleEndian: boolean = true
): TableData {
  // Handle tables without addresses - create empty data structure
  if (table.address === undefined) {
    console.warn(`Table "${table.title}" has no address defined, creating empty data structure`);
    return {
      tableId: table.id,
      values: Array.from({ length: table.rowCount }, () => 
        Array.from({ length: table.colCount }, () => 0)
      ),
      rawValues: Array.from({ length: table.rowCount }, () => 
        Array.from({ length: table.colCount }, () => 0)
      ),
      xAxisValues: table.xAxis.labels || [],
      yAxisValues: table.yAxis.labels || [],
    };
  }
  
  const values: number[][] = [];
  const rawValues: number[][] = [];
  
  const elementSizeBytes = table.elementSizeBits / 8;
  const bytesPerRow = table.colCount * elementSizeBytes;
  
  console.log(`Reading table "${table.title}": address=0x${table.address.toString(16)}, rows=${table.rowCount}, cols=${table.colCount}, elementSize=${table.elementSizeBits}bits, majorStride=${table.majorStrideBits}, minorStride=${table.minorStrideBits}`);
  
  // Read X axis breakpoints if embedded
  const xAxisValues: number[] = [];
  if (table.xAxis.embedded && table.xAxis.address !== undefined) {
    for (let i = 0; i < table.xAxis.count; i++) {
      const offset = table.xAxis.address + (i * table.xAxis.elementSizeBits / 8);
      const rawValue = readValue(buffer, offset, table.xAxis.elementSizeBits, signed, littleEndian);
      const scaledValue = applyMathEquation(rawValue, table.xAxis.mathEquation);
      xAxisValues.push(scaledValue);
    }
  } else if (table.xAxis.labels) {
    xAxisValues.push(...table.xAxis.labels);
  }
  
  // Read Y axis breakpoints if embedded
  const yAxisValues: number[] = [];
  if (table.yAxis.embedded && table.yAxis.address !== undefined) {
    for (let i = 0; i < table.yAxis.count; i++) {
      const offset = table.yAxis.address + (i * table.yAxis.elementSizeBits / 8);
      const rawValue = readValue(buffer, offset, table.yAxis.elementSizeBits, signed, littleEndian);
      const scaledValue = applyMathEquation(rawValue, table.yAxis.mathEquation);
      yAxisValues.push(scaledValue);
    }
  } else if (table.yAxis.labels) {
    yAxisValues.push(...table.yAxis.labels);
  }
  
  // Read table values (Z axis)
  for (let row = 0; row < table.rowCount; row++) {
    const rowValues: number[] = [];
    const rowRawValues: number[] = [];
    
    for (let col = 0; col < table.colCount; col++) {
      let offset: number;
      
      // Calculate offset based on stride bits
      // If stride bits are defined, use them; otherwise use standard row/col calculation
      if (table.majorStrideBits > 0 || table.minorStrideBits > 0) {
        // Stride bits are in bits, convert to bytes
        // Negative stride bits are valid and indicate reverse direction
        offset = table.address + (row * table.majorStrideBits + col * table.minorStrideBits) / 8;
      } else {
        // Standard calculation: address + (row * bytes_per_row) + (col * element_size)
        offset = table.address + (row * bytesPerRow) + (col * elementSizeBytes);
      }
      
      // Handle out of bounds gracefully - fill with zeros but still create the table structure
      if (offset + elementSizeBytes > buffer.byteLength || offset < 0) {
        if (offset < 0 || offset >= buffer.byteLength) {
          // Out of bounds - use zero
          rowValues.push(0);
          rowRawValues.push(0);
        } else {
          // Partial read - try to read what we can
          const availableBytes = Math.max(0, buffer.byteLength - offset);
          if (availableBytes > 0) {
            try {
              const rawValue = readValue(buffer, offset, Math.min(table.elementSizeBits, availableBytes * 8), signed, littleEndian);
              const scaledValue = applyMathEquation(rawValue, table.mathEquation);
              rowValues.push(scaledValue);
              rowRawValues.push(rawValue);
            } catch {
              rowValues.push(0);
              rowRawValues.push(0);
            }
          } else {
            rowValues.push(0);
            rowRawValues.push(0);
          }
        }
        continue;
      }
      
      try {
        const rawValue = readValue(buffer, offset, table.elementSizeBits, signed, littleEndian);
        const scaledValue = applyMathEquation(rawValue, table.mathEquation);
        rowValues.push(scaledValue);
        rowRawValues.push(rawValue);
      } catch (error) {
        // If read fails, use zero but continue parsing
        console.warn(`Failed to read value at offset ${offset} for table "${table.title}" at row ${row}, col ${col}:`, error);
        rowValues.push(0);
        rowRawValues.push(0);
      }
    }
    
    values.push(rowValues);
    rawValues.push(rowRawValues);
  }
  
  return {
    tableId: table.id,
    values,
    rawValues,
    xAxisValues,
    yAxisValues,
  };
}

/**
 * Read all tables from BIN file
 */
export function readAllTables(
  buffer: ArrayBuffer,
  tables: ParsedTable[],
  signed: boolean = false,
  littleEndian: boolean = true
): Map<string, TableData> {
  const result = new Map<string, TableData>();
  
  console.log(`Reading ${tables.length} tables from buffer of size ${buffer.byteLength} bytes`);
  
  let failed = 0;
  
  for (const table of tables) {
    try {
      // Parse EVERY table - no skipping!
      const expectedSize = table.rowCount * table.colCount * (table.elementSizeBits / 8);
      const maxOffset = table.address !== undefined ? table.address + expectedSize : 0;
      
      if (table.address === undefined) {
        console.warn(`Table "${table.title}" (${table.id}) has no address defined - creating empty data structure`);
      } else if (table.address >= buffer.byteLength) {
        console.warn(`Table "${table.title}" address 0x${table.address.toString(16)} (${table.address}) is beyond buffer size ${buffer.byteLength} - will fill with zeros`);
      } else if (maxOffset > buffer.byteLength) {
        console.warn(`Table "${table.title}" would extend beyond buffer (max offset ${maxOffset} > buffer size ${buffer.byteLength}) - will read partial data`);
      }
      
      if (table.address !== undefined) {
        console.log(`Reading table "${table.title}" at address 0x${table.address.toString(16)} (${table.address}), size: ${table.rowCount}x${table.colCount}, elementSize: ${table.elementSizeBits} bits, stride: major=${table.majorStrideBits}, minor=${table.minorStrideBits}`);
      } else {
        console.log(`Reading table "${table.title}" (no address), size: ${table.rowCount}x${table.colCount}, elementSize: ${table.elementSizeBits} bits`);
      }
      
      const tableData = readTableData(buffer, table, signed, littleEndian);
      
      // Always add the table data, even if empty - it's still a valid table structure
      if (!tableData) {
        // Create empty data structure if readTableData somehow returned null
        result.set(table.id, {
          tableId: table.id,
          values: Array.from({ length: table.rowCount }, () => 
            Array.from({ length: table.colCount }, () => 0)
          ),
          rawValues: Array.from({ length: table.rowCount }, () => 
            Array.from({ length: table.colCount }, () => 0)
          ),
          xAxisValues: [],
          yAxisValues: [],
        });
        console.log(`✓ Created empty data structure for table "${table.title}": ${table.rowCount} rows, ${table.colCount} columns`);
      } else {
        result.set(table.id, tableData);
        const rowCount = tableData.values.length;
        const colCount = tableData.values[0]?.length || 0;
        console.log(`✓ Successfully read table "${table.title}": ${rowCount} rows, first row has ${colCount} columns`);
      }
    } catch (error) {
      // Even on error, create an empty data structure so the table exists
      failed++;
      console.error(`✗ Error reading table "${table.title}":`, error);
      if (error instanceof Error) {
        console.error(`  Error message: ${error.message}`);
      }
      
      // Create empty data structure for failed tables
      result.set(table.id, {
        tableId: table.id,
        values: Array.from({ length: table.rowCount }, () => 
          Array.from({ length: table.colCount }, () => 0)
        ),
        rawValues: Array.from({ length: table.rowCount }, () => 
          Array.from({ length: table.colCount }, () => 0)
        ),
        xAxisValues: [],
        yAxisValues: [],
      });
      console.log(`✓ Created fallback empty data structure for table "${table.title}" after error`);
    }
  }
  
  console.log(`\n=== Table Loading Summary ===`);
  console.log(`Total tables parsed: ${tables.length}`);
  console.log(`Total tables loaded: ${result.size}`);
  console.log(`Tables with errors (but still loaded): ${failed}`);
  console.log(`Success rate: ${((result.size / tables.length) * 100).toFixed(1)}%`);
  console.log(`=============================\n`);
  
  return result;
}

// Exports are already done above

