import { Selection } from '../types/bin';

/**
 * Linear interpolation between two values
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Apply linear interpolation smoothing to selected cells
 */
export function smoothLinear(
  values: number[][],
  selection: Selection,
  _preserveEdges: boolean = false
): number[][] {
  const result = values.map(row => [...row]);
  
  if (selection.cells.length < 2) return result;
  
  // Get selected values
  const selectedValues = selection.cells.map(c => values[c.row][c.col]);
  const min = Math.min(...selectedValues);
  const max = Math.max(...selectedValues);
  
  // Calculate interpolation
  selection.cells.forEach((cell, idx) => {
    const t = idx / (selection.cells.length - 1);
    const interpolated = lerp(min, max, t);
    result[cell.row][cell.col] = interpolated;
  });
  
  return result;
}

/**
 * Apply Gaussian blur smoothing
 */
export function smoothGaussian(
  values: number[][],
  selection: Selection,
  radius: number = 1
): number[][] {
  const result = values.map(row => [...row]);
  
  // Create kernel
  const kernel: number[] = [];
  const sigma = radius / 3;
  let sum = 0;
  
  for (let i = -radius; i <= radius; i++) {
    const value = Math.exp(-(i * i) / (2 * sigma * sigma));
    kernel.push(value);
    sum += value;
  }
  
  // Normalize kernel
  for (let i = 0; i < kernel.length; i++) {
    kernel[i] /= sum;
  }
  
  // Apply blur to selected region
  const selectedRows = new Set(selection.cells.map(c => c.row));
  const selectedCols = new Set(selection.cells.map(c => c.col));
  
  selectedRows.forEach(row => {
    selectedCols.forEach(col => {
      let weightedSum = 0;
      let weightSum = 0;
      
      for (let i = -radius; i <= radius; i++) {
        const r = row + i;
        if (r >= 0 && r < values.length) {
          const weight = kernel[i + radius];
          weightedSum += values[r][col] * weight;
          weightSum += weight;
        }
      }
      
      if (weightSum > 0) {
        result[row][col] = weightedSum / weightSum;
      }
    });
  });
  
  return result;
}

/**
 * Create linear gradient fill
 */
export function fillLinearGradient(
  values: number[][],
  selection: Selection,
  startValue: number,
  endValue: number,
  direction: 'horizontal' | 'vertical' | 'diagonal'
): number[][] {
  const result = values.map(row => [...row]);
  const { bounds } = selection;
  
  const width = bounds.maxCol - bounds.minCol + 1;
  const height = bounds.maxRow - bounds.minRow + 1;
  
  selection.cells.forEach(cell => {
    let t = 0;
    
    if (direction === 'horizontal') {
      t = (cell.col - bounds.minCol) / width;
    } else if (direction === 'vertical') {
      t = (cell.row - bounds.minRow) / height;
    } else {
      // Diagonal
      const dx = cell.col - bounds.minCol;
      const dy = cell.row - bounds.minRow;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = Math.sqrt(width * width + height * height);
      t = dist / maxDist;
    }
    
    result[cell.row][cell.col] = lerp(startValue, endValue, t);
  });
  
  return result;
}

/**
 * Create radial gradient fill
 */
export function fillRadialGradient(
  values: number[][],
  selection: Selection,
  centerValue: number,
  edgeValue: number,
  centerRow?: number,
  centerCol?: number
): number[][] {
  const result = values.map(row => [...row]);
  const { bounds } = selection;
  
  const centerR = centerRow ?? (bounds.minRow + bounds.maxRow) / 2;
  const centerC = centerCol ?? (bounds.minCol + bounds.maxCol) / 2;
  
  const maxDist = Math.sqrt(
    Math.pow(bounds.maxRow - bounds.minRow, 2) +
    Math.pow(bounds.maxCol - bounds.minCol, 2)
  ) / 2;
  
  selection.cells.forEach(cell => {
    const dist = Math.sqrt(
      Math.pow(cell.row - centerR, 2) +
      Math.pow(cell.col - centerC, 2)
    );
    const t = Math.min(dist / maxDist, 1);
    result[cell.row][cell.col] = lerp(centerValue, edgeValue, t);
  });
  
  return result;
}

/**
 * Apply offset to selected cells
 */
export function applyOffset(
  values: number[][],
  selection: Selection,
  offset: number
): number[][] {
  const result = values.map(row => [...row]);
  
  selection.cells.forEach(cell => {
    result[cell.row][cell.col] = values[cell.row][cell.col] + offset;
  });
  
  return result;
}

/**
 * Apply scale factor to selected cells
 */
export function applyScale(
  values: number[][],
  selection: Selection,
  factor: number
): number[][] {
  const result = values.map(row => [...row]);
  
  selection.cells.forEach(cell => {
    result[cell.row][cell.col] = values[cell.row][cell.col] * factor;
  });
  
  return result;
}

/**
 * Set selected cells to a specific value
 */
export function setValue(
  values: number[][],
  selection: Selection,
  value: number
): number[][] {
  const result = values.map(row => [...row]);
  
  selection.cells.forEach(cell => {
    result[cell.row][cell.col] = value;
  });
  
  return result;
}

/**
 * Get statistics for selection
 */
export function getSelectionStats(
  values: number[][],
  selection: Selection
): { min: number; max: number; avg: number; sum: number; count: number } {
  const selectedValues = selection.cells.map(c => values[c.row][c.col]);
  const min = Math.min(...selectedValues);
  const max = Math.max(...selectedValues);
  const sum = selectedValues.reduce((a, b) => a + b, 0);
  const count = selectedValues.length;
  const avg = sum / count;
  
  return { min, max, avg, sum, count };
}

