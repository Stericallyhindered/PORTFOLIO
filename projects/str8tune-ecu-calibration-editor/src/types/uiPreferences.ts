/** RGB color stop for heatmap (position 0–1 on normalized value axis) */
export interface HeatmapColorStop {
  pos: number;
  r: number;
  g: number;
  b: number;
}

export type HeatmapRangeMode = 'table' | 'selection' | 'fixed';

export interface HeatmapPreferences {
  enabled: boolean;
  rangeMode: HeatmapRangeMode;
  fixedMin: number;
  fixedMax: number;
  invert: boolean;
  colorStops: HeatmapColorStop[];
  selectionColor: string;
  selectionOverlayAlpha: number;
  activeRingColor: string;
  axisHighlight: boolean;
  axisHighlightColor: string;
  cellPadding: 'compact' | 'normal' | 'relaxed';
}

/**
 * Fixed tuning-table heatmap — calibrated to Nexus R5 / pro ECU style:
 * deep red (low) → crimson → orange → amber → gold → yellow →
 * chartreuse → lime → spring green → emerald → forest (high).
 * Extra stops mid-ramp keep red→orange→yellow and yellow→green transitions smooth.
 */
export const TUNING_CELL_HEATMAP_STOPS: HeatmapColorStop[] = [
  { pos: 0.0, r: 88, g: 10, b: 14 },
  { pos: 0.07, r: 130, g: 16, b: 20 },
  { pos: 0.14, r: 176, g: 28, b: 26 },
  { pos: 0.22, r: 214, g: 48, b: 28 },
  { pos: 0.3, r: 232, g: 78, b: 22 },
  { pos: 0.38, r: 241, g: 112, b: 18 },
  { pos: 0.46, r: 247, g: 142, b: 22 },
  { pos: 0.54, r: 251, g: 174, b: 36 },
  { pos: 0.6, r: 253, g: 204, b: 52 },
  { pos: 0.66, r: 255, g: 228, b: 68 },
  { pos: 0.72, r: 228, g: 232, b: 64 },
  { pos: 0.78, r: 168, g: 212, b: 72 },
  { pos: 0.84, r: 96, g: 188, b: 76 },
  { pos: 0.9, r: 34, g: 158, b: 82 },
  { pos: 0.95, r: 18, g: 124, b: 68 },
  { pos: 1.0, r: 12, g: 88, b: 52 },
];

/** Single fixed config for 2D/3D tuning views */
export const TUNING_CELL_HEATMAP: HeatmapPreferences = {
  enabled: true,
  rangeMode: 'table',
  fixedMin: 0,
  fixedMax: 1,
  invert: false,
  colorStops: TUNING_CELL_HEATMAP_STOPS,
  selectionColor: 'rgba(255, 255, 255, 0.88)',
  selectionOverlayAlpha: 0.1,
  activeRingColor: 'rgba(253, 224, 71, 0.95)',
  axisHighlight: true,
  axisHighlightColor: 'rgba(251, 191, 36, 0.22)',
  cellPadding: 'normal',
};
