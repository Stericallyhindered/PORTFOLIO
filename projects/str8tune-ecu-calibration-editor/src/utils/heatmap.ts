import type { HeatmapColorStop, HeatmapPreferences, HeatmapRangeMode } from '../types/uiPreferences';
import { TUNING_CELL_HEATMAP_STOPS } from '../types/uiPreferences';

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function interpolateStops(
  normalized: number,
  stops: HeatmapColorStop[]
): { r: number; g: number; b: number } {
  const sorted = [...stops].sort((a, b) => a.pos - b.pos);
  if (sorted.length === 0) return { r: 30, g: 64, b: 175 };
  if (normalized <= sorted[0].pos) {
    const s = sorted[0];
    return { r: s.r, g: s.g, b: s.b };
  }
  if (normalized >= sorted[sorted.length - 1].pos) {
    const s = sorted[sorted.length - 1];
    return { r: s.r, g: s.g, b: s.b };
  }
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (normalized >= a.pos && normalized <= b.pos) {
      const span = b.pos - a.pos || 1e-6;
      const t = (normalized - a.pos) / span;
      return {
        r: Math.round(a.r + (b.r - a.r) * t),
        g: Math.round(a.g + (b.g - a.g) * t),
        b: Math.round(a.b + (b.b - a.b) * t),
      };
    }
  }
  const s = sorted[sorted.length - 1];
  return { r: s.r, g: s.g, b: s.b };
}

export function getHeatmapRange(
  values: number[],
  rangeMode: HeatmapRangeMode,
  selectionValues: number[] | null,
  fixedMin: number,
  fixedMax: number
): { min: number; max: number } {
  if (values.length === 0) return { min: 0, max: 1 };
  let min: number;
  let max: number;
  switch (rangeMode) {
    case 'selection':
      if (selectionValues && selectionValues.length > 0) {
        min = Math.min(...selectionValues);
        max = Math.max(...selectionValues);
      } else {
        min = Math.min(...values);
        max = Math.max(...values);
      }
      break;
    case 'fixed':
      min = fixedMin;
      max = fixedMax;
      break;
    case 'table':
    default:
      min = Math.min(...values);
      max = Math.max(...values);
      break;
  }
  if (min === max) return { min, max: min + 1e-9 };
  return { min, max };
}

export function valueToHeatmapColor(
  value: number,
  prefs: HeatmapPreferences,
  range: { min: number; max: number }
): string {
  if (!prefs.enabled) {
    return '#1a1a1e';
  }
  const stops = prefs.colorStops?.length ? prefs.colorStops : TUNING_CELL_HEATMAP_STOPS;
  const { min, max } = range;
  let t = max - min === 0 ? 0 : (value - min) / (max - min);
  t = clamp01(t);
  if (prefs.invert) t = 1 - t;
  const { r, g, b } = interpolateStops(t, stops);
  return `rgb(${r}, ${g}, ${b})`;
}

/** WCAG-style relative luminance for readable text on heatmap cells (matches Nexus black-on-bright). */
function linearizeChannel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function relativeLuminanceFromRgb(r: number, g: number, b: number): number {
  return (
    0.2126 * linearizeChannel(r) + 0.7152 * linearizeChannel(g) + 0.0722 * linearizeChannel(b)
  );
}

export function textColorForBackground(bgColor: string): string {
  const rgb = bgColor.match(/\d+/g);
  if (!rgb || rgb.length < 3) return '#e5e5e5';
  const r = parseInt(rgb[0], 10);
  const g = parseInt(rgb[1], 10);
  const b = parseInt(rgb[2], 10);
  const L = relativeLuminanceFromRgb(r, g, b);
  return L > 0.52 ? '#0a0a0a' : '#f5f5f5';
}

/** Second-line Δ text: same hue logic as main cell + thin halo so it stays legible on mid-bright heatmap colors. */
export function deltaLineStyleForBackground(bgColor: string): { color: string; textShadow: string } {
  const color = textColorForBackground(bgColor);
  const rgb = bgColor.match(/\d+/g);
  if (!rgb || rgb.length < 3) {
    return { color, textShadow: 'none' };
  }
  const r = parseInt(rgb[0], 10);
  const g = parseInt(rgb[1], 10);
  const b = parseInt(rgb[2], 10);
  const L = relativeLuminanceFromRgb(r, g, b);
  if (L > 0.52) {
    // Dark text on light cell: light outline + soft dark drop so it never washes into yellow/green
    return {
      color,
      textShadow:
        '0 0 1px rgba(255,255,255,0.9), 0 0 2px rgba(255,255,255,0.55), 0 1px 1px rgba(0,0,0,0.4)',
    };
  }
  // Light text on dark cell
  return {
    color,
    textShadow: '0 0 1px rgba(0,0,0,0.85), 0 0 2px rgba(0,0,0,0.55), 0 1px 2px rgba(0,0,0,0.65)',
  };
}

/** Plotly colorscale [[0, hex], ...] from heatmap stops */
export function plotlyColorscaleFromStops(stops: HeatmapColorStop[]): Array<[number, string]> {
  const sorted = [...(stops?.length ? stops : TUNING_CELL_HEATMAP_STOPS)].sort((a, b) => a.pos - b.pos);
  return sorted.map((s) => {
    const hex =
      '#' +
      [s.r, s.g, s.b]
        .map((x) => x.toString(16).padStart(2, '0'))
        .join('');
    return [s.pos, hex] as [number, string];
  });
}
