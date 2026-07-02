/**
 * Validate value is within min/max bounds
 */
export function validateBounds(value: number, min?: number, max?: number): boolean {
  if (min !== undefined && value < min) return false;
  if (max !== undefined && value > max) return false;
  return true;
}

/**
 * Clamp value to min/max bounds
 */
export function clampValue(value: number, min?: number, max?: number): number {
  let clamped = value;
  if (min !== undefined && clamped < min) clamped = min;
  if (max !== undefined && clamped > max) clamped = max;
  return clamped;
}

/**
 * Validate table cell value
 */
export function validateCellValue(
  value: number,
  min?: number,
  max?: number,
  allowNaN: boolean = false
): { valid: boolean; error?: string } {
  if (!allowNaN && isNaN(value)) {
    return { valid: false, error: 'Value must be a number' };
  }
  
  if (!validateBounds(value, min, max)) {
    return {
      valid: false,
      error: `Value must be between ${min ?? '-∞'} and ${max ?? '∞'}`,
    };
  }
  
  return { valid: true };
}

