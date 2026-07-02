import { evaluate } from 'mathjs';

/**
 * Apply MATH equation to convert raw value to scaled value
 */
export function scaleValue(rawValue: number, equation: string | undefined): number {
  if (!equation || equation === 'X') {
    return rawValue;
  }
  
  try {
    const expression = equation.replace(/X/g, rawValue.toString());
    return evaluate(expression) as number;
  } catch (error) {
    console.warn(`Failed to evaluate equation "${equation}":`, error);
    return rawValue;
  }
}

/**
 * Convert scaled value back to raw using inverse MATH equation
 */
export function unscaleValue(scaledValue: number, equation: string | undefined): number {
  if (!equation || equation === 'X') {
    return scaledValue;
  }
  
  try {
    // Handle common patterns: X*0.1 -> scaledValue / 0.1
    const multMatch = equation.match(/X\s*\*\s*([\d.]+)/);
    if (multMatch) {
      const multiplier = parseFloat(multMatch[1]);
      if (multiplier !== 0) {
        return scaledValue / multiplier;
      }
    }
    
    // Handle: X/0.1 -> scaledValue * 0.1
    const divMatch = equation.match(/X\s*\/\s*([\d.]+)/);
    if (divMatch) {
      const divisor = parseFloat(divMatch[1]);
      if (divisor !== 0) {
        return scaledValue * divisor;
      }
    }
    
    // Handle parentheses: (X*0.1)
    const parenMatch = equation.match(/\(?\s*X\s*\*\s*([\d.]+)\s*\)?/);
    if (parenMatch) {
      const multiplier = parseFloat(parenMatch[1]);
      if (multiplier !== 0) {
        return scaledValue / multiplier;
      }
    }
    
    // For more complex equations, try to solve
    // This is a simplified approach - may need enhancement
    console.warn(`Complex equation "${equation}" - using scaled value as raw`);
    return scaledValue;
  } catch (error) {
    console.warn(`Failed to inverse equation "${equation}":`, error);
    return scaledValue;
  }
}

/**
 * Format value with specified decimal places
 */
export function formatValue(value: number, decimalPlaces: number): string {
  // Clamp decimalPlaces to valid range (0-100) and handle NaN/undefined
  const validDecimalPlaces = Math.max(0, Math.min(100, Math.round(decimalPlaces || 0)));
  if (isNaN(value) || !isFinite(value)) {
    return 'NaN';
  }
  return value.toFixed(validDecimalPlaces);
}

/** Extra precision for Δ lines so small differences are not rounded to 0.000. */
export function formatDeltaDisplay(diff: number, tableDecimalPlaces: number): string {
  if (isNaN(diff) || !isFinite(diff)) return 'NaN';
  const ad = Math.abs(diff);
  const base = Math.max(0, Math.min(10, Math.round(tableDecimalPlaces)));
  let dp = Math.max(base, 2);
  if (ad > 0 && ad < 0.01) dp = Math.min(10, Math.max(base + 2, 5));
  if (ad > 0 && ad < 0.0001) dp = Math.min(10, Math.max(base + 3, 6));
  let out = diff.toFixed(dp);
  if (ad > 1e-15 && Number(out) === 0) {
    out = diff.toFixed(Math.min(10, 8));
  }
  return out;
}

/**
 * Round value to specified decimal places
 */
export function roundValue(value: number, decimalPlaces: number): number {
  const factor = Math.pow(10, decimalPlaces);
  return Math.round(value * factor) / factor;
}

