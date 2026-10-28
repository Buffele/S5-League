// Static translation of 0x11b4bf0 and the AABB adapter 0x11b7a80.
// See work/s5runtime-decoder/ATTACK-BOX-INTERSECTION.md. No target/damage policy.
// Float stores are rounded to float32; this is not an x87 bit-exact emulator.
const f = Math.fround;
const dot = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
// 0x100af90 uses SSE mulss/addss, each with float32 rounding, x+y then z.
const nativeDot = (a, b) => f(f(f(a[0]*b[0])+f(a[1]*b[1]))+f(a[2]*b[2]));
// Bytes ef ff 7f 3f at VA 0x149f250, not an additive SAT epsilon.
export const NATIVE_BOX_PARALLEL_CUTOFF = 0.9999989867210388;

function vector(value, label) {
  if (!Array.isArray(value) || value.length !== 3 || !value.every(Number.isFinite))
    throw new TypeError(`Expected finite ${label} vec3`);
  const result = value.map(f);
  if (!result.every(Number.isFinite)) throw new RangeError(`${label} exceeds float32`);
  return result;
}

function box(value) {
  if (!value || typeof value !== 'object') throw new TypeError('Expected box');
  const center = vector(value.center, 'center');
  const halfExtents = vector(value.halfExtents, 'halfExtents');
  if (halfExtents.some(v => v < 0)) throw new RangeError('Negative half extent');
  if (!Array.isArray(value.axes) || value.axes.length !== 3) throw new TypeError('Expected three axes');
  const axes = value.axes.map(v => vector(v, 'axis'));
  for (let i = 0; i < 3; i++) {
    if (Math.abs(dot(axes[i], axes[i])-1) > 1e-5) throw new RangeError('Axes must be unit length');
    for (let j = 0; j < i; j++)
      if (Math.abs(dot(axes[i], axes[j])) > 1e-5) throw new RangeError('Axes must be orthogonal');
  }
  return { center, halfExtents, axes };
}

function finite(value) {
  if (!Number.isFinite(value)) throw new RangeError('Intersection arithmetic overflow');
  return value;
}

export function nativeBoxIntersection(first, second) {
  const a = box(first), b = box(second);
  const delta = a.center.map((v, i) => finite(f(v-b.center[i])));
  const rotation = a.axes.map(axis => b.axes.map(other => nativeDot(axis, other)));
  const absRotation = rotation.map(row => row.map(Math.abs));
  const nearParallel = absRotation.some(row => row.some(v => v > NATIVE_BOX_PARALLEL_CUTOFF));
  const t = a.axes.map(axis => finite(nativeDot(delta, axis)));
  const ea = a.halfExtents, eb = b.halfExtents;
  let testedAxes = 0;
  const result = (intersects, separationAxis = null, parallelShortcut = false) =>
    ({ intersects, separationAxis, testedAxes, parallelShortcut });
  const separates = (distance, radius) => {
    testedAxes++;
    // Native rejects strictly greater distances. Touching boundaries pass.
    return finite(f(Math.abs(distance))) > finite(f(radius));
  };
  for (let i = 0; i < 3; i++) {
    const rb = f(eb[0]*absRotation[i][0] + eb[1]*absRotation[i][1] + eb[2]*absRotation[i][2]);
    if (separates(t[i], ea[i]+rb)) return result(false, `A${i}`);
  }
  for (let j = 0; j < 3; j++) {
    const ra = f(ea[0]*absRotation[0][j] + ea[1]*absRotation[1][j] + ea[2]*absRotation[2][j]);
    if (separates(nativeDot(delta, b.axes[j]), ra+eb[j])) return result(false, `B${j}`);
  }
  // Native 0x11b556b: any nearly parallel pair bypasses ALL nine cross axes,
  // but only AFTER all six face-normal tests have passed.
  if (nearParallel) return result(true, null, true);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    const i1 = (i+1)%3, i2 = (i+2)%3, j1 = (j+1)%3, j2 = (j+2)%3;
    const distance = t[i2]*rotation[i1][j] - t[i1]*rotation[i2][j];
    const ra = f(ea[i1]*absRotation[i2][j] + ea[i2]*absRotation[i1][j]);
    const rb = f(eb[j1]*absRotation[i][j2] + eb[j2]*absRotation[i][j1]);
    if (separates(distance, ra+rb)) return result(false, `A${i}xB${j}`);
  }
  return result(true);
}

export function nativeBoxAabbIntersection(obb, min, max) {
  min = vector(min, 'minimum'); max = vector(max, 'maximum');
  if (min.some((v,i) => v > max[i])) throw new RangeError('Inverted AABB');
  const halfExtents = max.map((v,i) => finite(f((v-min[i])/2)));
  // 0x11b7ae8: SSE vector subtraction stores a float32 intermediate first.
  const center = min.map((v,i) => finite(f(v + f(f(max[i]-v)/2))));
  return nativeBoxIntersection(obb, {center, halfExtents, axes:[[1,0,0],[0,1,0],[0,0,1]]});
}
