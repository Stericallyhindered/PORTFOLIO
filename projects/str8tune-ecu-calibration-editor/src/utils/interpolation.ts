/**
 * Cubic spline interpolation
 */

export interface Point {
  x: number;
  y: number;
}

/**
 * Calculate cubic spline coefficients
 */
function calculateSplineCoefficients(points: Point[]): number[][] {
  const n = points.length - 1;
  const h: number[] = [];
  const alpha: number[] = [];
  
  for (let i = 0; i < n; i++) {
    h[i] = points[i + 1].x - points[i].x;
  }
  
  for (let i = 1; i < n; i++) {
    alpha[i] = (3 / h[i]) * (points[i + 1].y - points[i].y) -
               (3 / h[i - 1]) * (points[i].y - points[i - 1].y);
  }
  
  const l: number[] = [];
  const mu: number[] = [];
  const z: number[] = [];
  
  l[0] = 1;
  mu[0] = 0;
  z[0] = 0;
  
  for (let i = 1; i < n; i++) {
    l[i] = 2 * (points[i + 1].x - points[i - 1].x) - h[i - 1] * mu[i - 1];
    mu[i] = h[i] / l[i];
    z[i] = (alpha[i] - h[i - 1] * z[i - 1]) / l[i];
  }
  
  l[n] = 1;
  z[n] = 0;
  
  const c: number[] = [];
  const b: number[] = [];
  const d: number[] = [];
  
  c[n] = 0;
  
  for (let j = n - 1; j >= 0; j--) {
    c[j] = z[j] - mu[j] * c[j + 1];
    b[j] = (points[j + 1].y - points[j].y) / h[j] -
           h[j] * (c[j + 1] + 2 * c[j]) / 3;
    d[j] = (c[j + 1] - c[j]) / (3 * h[j]);
  }
  
  return [points.map(p => p.y), b, c, d];
}

/**
 * Evaluate cubic spline at point x
 */
export function evaluateSpline(points: Point[], x: number): number {
  if (points.length < 2) return points[0]?.y ?? 0;
  
  // Find the interval
  let i = 0;
  for (let j = 0; j < points.length - 1; j++) {
    if (x >= points[j].x && x <= points[j + 1].x) {
      i = j;
      break;
    }
  }
  
  if (i >= points.length - 1) {
    return points[points.length - 1].y;
  }
  
  const [a, b, c, d] = calculateSplineCoefficients(points);
  const dx = x - points[i].x;
  
  return a[i] + b[i] * dx + c[i] * dx * dx + d[i] * dx * dx * dx;
}

/**
 * Bezier curve interpolation
 */
export function bezierInterpolation(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  t: number
): Point {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;
  
  return {
    x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
    y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y,
  };
}

