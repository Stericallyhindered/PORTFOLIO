import type { EditorPreferenceSet, TuneTable } from "@/lib/types";

type Point2D = {
  x: number;
  y: number;
};

function projectPoint(x: number, y: number, z: number, maxZ: number): Point2D {
  const scale = 40;
  return {
    x: 300 + (x - y) * scale,
    y: 270 + (x + y) * 15 - (z / Math.max(maxZ, 1)) * 165,
  };
}

function withAlpha(hex: string, alpha: string) {
  return `${hex}${alpha}`;
}

type SurfaceGraphProps = {
  table: TuneTable;
  preferences: EditorPreferenceSet;
};

export function SurfaceGraph({ table, preferences }: SurfaceGraphProps) {
  const values = table.cells.flat();
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const polygons: Array<{ key: string; points: string; fill: string }> = [];
  const rows = table.cells.length;
  const cols = table.cells[0]?.length ?? 0;

  for (let y = 0; y < rows - 1; y += 1) {
    for (let x = 0; x < cols - 1; x += 1) {
      const p1 = projectPoint(x, y, table.cells[y][x], maxValue);
      const p2 = projectPoint(x + 1, y, table.cells[y][x + 1], maxValue);
      const p3 = projectPoint(x + 1, y + 1, table.cells[y + 1][x + 1], maxValue);
      const p4 = projectPoint(x, y + 1, table.cells[y + 1][x], maxValue);
      const avg = (table.cells[y][x] + table.cells[y][x + 1] + table.cells[y + 1][x + 1] + table.cells[y + 1][x]) / 4;
      const ratio = (avg - minValue) / Math.max(maxValue - minValue, 1);
      const alpha = preferences.surfaceStyle === "glass" ? "88" : preferences.surfaceStyle === "contour" ? "44" : "bb";

      polygons.push({
        key: `${x}-${y}`,
        points: `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`,
        fill: ratio > 0.5 ? withAlpha(preferences.primaryColor, alpha) : withAlpha(preferences.accentColor, alpha),
      });
    }
  }

  return (
    <svg aria-label="3D calibration surface graph" className="graph-svg" viewBox="0 0 760 420">
      <defs>
        <linearGradient id="surface-bg" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor={withAlpha(preferences.primaryColor, "22")} />
          <stop offset="100%" stopColor={withAlpha(preferences.accentColor, "12")} />
        </linearGradient>
      </defs>
      <rect fill="url(#surface-bg)" height="420" rx="28" width="760" x="0" y="0" />
      {Array.from({ length: rows }).map((_, row) => {
        const a = projectPoint(0, row, minValue, maxValue);
        const b = projectPoint(cols - 1, row, minValue, maxValue);
        return <line className="mesh-outline" key={`row-${row}`} x1={a.x} x2={b.x} y1={a.y} y2={b.y} />;
      })}
      {Array.from({ length: cols }).map((_, col) => {
        const a = projectPoint(col, 0, minValue, maxValue);
        const b = projectPoint(col, rows - 1, minValue, maxValue);
        return <line className="mesh-outline" key={`col-${col}`} x1={a.x} x2={b.x} y1={a.y} y2={b.y} />;
      })}
      {polygons.map((polygon) => (
        <polygon key={polygon.key} fill={polygon.fill} points={polygon.points} stroke={withAlpha(preferences.primaryColor, "66")} strokeWidth="1.2" />
      ))}
      <text className="mesh-label" x="48" y="54">
        Y Axis: {table.yLabel}
      </text>
      <text className="mesh-label" x="560" y="382">
        X Axis: {table.xLabel}
      </text>
      <text className="mesh-label" x="48" y="76">
        Surface Range: {minValue.toFixed(2)} - {maxValue.toFixed(2)}
      </text>
    </svg>
  );
}
