import type { SvgPoint } from "./types";

export interface SourcePoint {
  x: number;
  y: number;
}

export interface ControlPoint {
  source: SourcePoint;
  target: SvgPoint;
  label: string;
}

export interface AffineTransform {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
  rmsError: number;
  controlPointCount: number;
}

function solveLinearSystem(matrix: number[][], values: number[]) {
  const augmented = matrix.map((row, index) => [...row, values[index]]);
  const size = values.length;

  for (let column = 0; column < size; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < size; row += 1) {
      if (Math.abs(augmented[row][column]) > Math.abs(augmented[pivot][column])) pivot = row;
    }
    if (Math.abs(augmented[pivot][column]) < 1e-10) return null;
    [augmented[column], augmented[pivot]] = [augmented[pivot], augmented[column]];
    const factor = augmented[column][column];
    for (let item = column; item <= size; item += 1) augmented[column][item] /= factor;
    for (let row = 0; row < size; row += 1) {
      if (row === column) continue;
      const ratio = augmented[row][column];
      for (let item = column; item <= size; item += 1) {
        augmented[row][item] -= ratio * augmented[column][item];
      }
    }
  }

  return augmented.map((row) => row[size]);
}

/** Applies an affine source-coordinate → SVG-coordinate transformation. */
export function applyAffineTransform(point: SourcePoint, transform: AffineTransform): SvgPoint {
  return {
    x: transform.a * point.x + transform.b * point.y + transform.c,
    y: transform.d * point.x + transform.e * point.y + transform.f,
  };
}

/**
 * Fits an affine conversion from at least three non-collinear field control points.
 * The RMS error makes poor GPS/CAD/SVG alignment visible before it reaches visitors.
 */
export function fitAffineTransform(controlPoints: ControlPoint[]): AffineTransform | null {
  if (controlPoints.length < 3) return null;
  if (
    controlPoints.some(
      ({ source, target }) => ![source.x, source.y, target.x, target.y].every(Number.isFinite),
    )
  )
    return null;
  // Center and normalize GPS/CAD values before solving: absolute coordinates and
  // small field offsets otherwise make the normal equations poorly conditioned.
  const centerX =
    controlPoints.reduce((sum, point) => sum + point.source.x, 0) / controlPoints.length;
  const centerY =
    controlPoints.reduce((sum, point) => sum + point.source.y, 0) / controlPoints.length;
  const scaleX = Math.max(...controlPoints.map((point) => Math.abs(point.source.x - centerX)));
  const scaleY = Math.max(...controlPoints.map((point) => Math.abs(point.source.y - centerY)));
  if (!scaleX || !scaleY) return null;
  const normal = Array.from({ length: 3 }, () => [0, 0, 0]);
  const targetX = [0, 0, 0];
  const targetY = [0, 0, 0];

  for (const point of controlPoints) {
    const row = [(point.source.x - centerX) / scaleX, (point.source.y - centerY) / scaleY, 1];
    for (let column = 0; column < 3; column += 1) {
      targetX[column] += row[column] * point.target.x;
      targetY[column] += row[column] * point.target.y;
      for (let inner = 0; inner < 3; inner += 1) normal[column][inner] += row[column] * row[inner];
    }
  }

  const xParameters = solveLinearSystem(normal, targetX);
  const yParameters = solveLinearSystem(normal, targetY);
  if (!xParameters || !yParameters) return null;
  const transform = {
    a: xParameters[0] / scaleX,
    b: xParameters[1] / scaleY,
    c: xParameters[2] - (xParameters[0] / scaleX) * centerX - (xParameters[1] / scaleY) * centerY,
    d: yParameters[0] / scaleX,
    e: yParameters[1] / scaleY,
    f: yParameters[2] - (yParameters[0] / scaleX) * centerX - (yParameters[1] / scaleY) * centerY,
    rmsError: 0,
    controlPointCount: controlPoints.length,
  };
  const squaredError = controlPoints.reduce((sum, point) => {
    const projected = applyAffineTransform(point.source, transform);
    return sum + (projected.x - point.target.x) ** 2 + (projected.y - point.target.y) ** 2;
  }, 0);
  return { ...transform, rmsError: Math.sqrt(squaredError / controlPoints.length) };
}
