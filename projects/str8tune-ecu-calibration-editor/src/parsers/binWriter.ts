import { ParsedTable } from '../types/xdf';
import { TableData, CellChange } from '../types/bin';
import { inverseMathEquation } from './binReader';

/**
 * Write value to ArrayBuffer at offset based on data type
 */
function writeValue(
  buffer: ArrayBuffer,
  offset: number,
  value: number,
  elementSizeBits: number,
  signed: boolean,
  littleEndian: boolean = true
): void {
  const view = new DataView(buffer);
  
  // Clamp value to valid range for the data type
  let clampedValue = value;
  
  switch (elementSizeBits) {
    case 8:
      if (signed) {
        clampedValue = Math.max(-128, Math.min(127, Math.round(value)));
        view.setInt8(offset, clampedValue);
      } else {
        clampedValue = Math.max(0, Math.min(255, Math.round(value)));
        view.setUint8(offset, clampedValue);
      }
      break;
    case 16:
      if (signed) {
        clampedValue = Math.max(-32768, Math.min(32767, Math.round(value)));
        view.setInt16(offset, clampedValue, littleEndian);
      } else {
        clampedValue = Math.max(0, Math.min(65535, Math.round(value)));
        view.setUint16(offset, clampedValue, littleEndian);
      }
      break;
    case 32:
      if (signed) {
        clampedValue = Math.max(-2147483648, Math.min(2147483647, Math.round(value)));
        view.setInt32(offset, clampedValue, littleEndian);
      } else {
        clampedValue = Math.max(0, Math.min(4294967295, Math.round(value)));
        view.setUint32(offset, clampedValue, littleEndian);
      }
      break;
    default:
      throw new Error(`Unsupported element size: ${elementSizeBits} bits`);
  }
}

/**
 * Write table data back to BIN buffer
 */
export function writeTableData(
  buffer: ArrayBuffer,
  table: ParsedTable,
  tableData: TableData,
  signed: boolean = false,
  littleEndian: boolean = true
): void {
  if (!table.address) {
    throw new Error(`Table ${table.title} has no address defined`);
  }
  
  const elementSizeBytes = table.elementSizeBits / 8;
  const bytesPerRow = table.colCount * elementSizeBytes;
  
  // Write table values (Z axis)
  for (let row = 0; row < table.rowCount && row < tableData.values.length; row++) {
    for (let col = 0; col < table.colCount && col < tableData.values[row].length; col++) {
      const scaledValue = tableData.values[row][col];
      
      // Convert scaled value back to raw using inverse equation
      const rawValue = inverseMathEquation(scaledValue, table.mathEquation);
      
      // Calculate offset
      const strideOffset = (row * table.majorStrideBits + col * table.minorStrideBits) / 8;
      const offset = table.address + (row * bytesPerRow) + (col * elementSizeBytes) + strideOffset;
      
      if (offset + elementSizeBytes > buffer.byteLength) {
        console.warn(`Offset ${offset} exceeds buffer size for table ${table.title}`);
        continue;
      }
      
      writeValue(buffer, offset, rawValue, table.elementSizeBits, signed, littleEndian);
      
      // Update rawValues array
      tableData.rawValues[row][col] = rawValue;
    }
  }
  
  // Write X axis breakpoints if embedded and modified
  if (table.xAxis.embedded && table.xAxis.address !== undefined && tableData.xAxisValues.length > 0) {
    for (let i = 0; i < Math.min(table.xAxis.count, tableData.xAxisValues.length); i++) {
      const offset = table.xAxis.address + (i * table.xAxis.elementSizeBits / 8);
      const scaledValue = tableData.xAxisValues[i];
      const rawValue = inverseMathEquation(scaledValue, table.xAxis.mathEquation);
      writeValue(buffer, offset, rawValue, table.xAxis.elementSizeBits, signed, littleEndian);
    }
  }
  
  // Write Y axis breakpoints if embedded and modified
  if (table.yAxis.embedded && table.yAxis.address !== undefined && tableData.yAxisValues.length > 0) {
    for (let i = 0; i < Math.min(table.yAxis.count, tableData.yAxisValues.length); i++) {
      const offset = table.yAxis.address + (i * table.yAxis.elementSizeBits / 8);
      const scaledValue = tableData.yAxisValues[i];
      const rawValue = inverseMathEquation(scaledValue, table.yAxis.mathEquation);
      writeValue(buffer, offset, rawValue, table.yAxis.elementSizeBits, signed, littleEndian);
    }
  }
}

/**
 * Apply a single cell change to the buffer
 */
export function applyCellChange(
  buffer: ArrayBuffer,
  table: ParsedTable,
  change: CellChange,
  signed: boolean = false,
  littleEndian: boolean = true
): void {
  if (!table.address) {
    throw new Error(`Table ${table.title} has no address defined`);
  }
  
  const elementSizeBytes = table.elementSizeBits / 8;
  const bytesPerRow = table.colCount * elementSizeBytes;
  
  // Calculate offset
  const strideOffset = (change.row * table.majorStrideBits + change.col * table.minorStrideBits) / 8;
  const offset = table.address + (change.row * bytesPerRow) + (change.col * elementSizeBytes) + strideOffset;
  
  if (offset + elementSizeBytes > buffer.byteLength) {
    throw new Error(`Offset ${offset} exceeds buffer size`);
  }
  
  writeValue(buffer, offset, change.newRawValue, table.elementSizeBits, signed, littleEndian);
}

/**
 * Create a downloadable blob from the modified buffer
 */
export function createBinBlob(buffer: ArrayBuffer): Blob {
  return new Blob([buffer], { type: 'application/octet-stream' });
}

/**
 * Download the BIN file
 */
export function downloadBinFile(buffer: ArrayBuffer, filename: string = 'modified.bin'): void {
  const blob = createBinBlob(buffer);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

