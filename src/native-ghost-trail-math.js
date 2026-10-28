// Mathematical reference for verified native GhostTrail operations, not a renderer.
// Provenance and remaining controller/rendering gaps: work/s5runtime-decoder/GHOSTTRAIL-NATIVE.md.
// JS doubles reproduce the formulas, not every x87/SSE rounding step.

function vector(value, size, label) {
  if (!(Array.isArray(value) || ArrayBuffer.isView(value)) || value.length !== size
      || !Array.from(value).every(Number.isFinite)) throw new TypeError(`Invalid ${label}`);
}
function uint32(value) {
  if (!Number.isInteger(value) || value < 0 || value > 0xffffffff) throw new RangeError('Expected uint32 native time');
}
const add = (a, b) => a.map((v, i) => v + b[i]);
const sub = (a, b) => a.map((v, i) => v - b[i]);
const scale = (a, n) => a.map(v => v * n);
const length = a => Math.hypot(...a);
function normalize(a) {
  const n = length(a);
  return n === 0 ? a.slice() : scale(a, 1 / n);
}
function segment(s) {
  if (!Array.isArray(s) || s.length !== 2) throw new TypeError('Expected endpoint pair');
  s.forEach(v => vector(v, 3, 'endpoint'));
}

// 0x1201490: both comparisons unsigned, both boundaries included. No clock conversion.
export function isTrailTimeActive(time, start, end) {
  [time, start, end].forEach(uint32);
  return start <= time && time <= end;
}

// 0x119bb10 -> 0x100af50 -> D3DXVec3TransformCoord. Matrix in serialized SCN order.
export function shapePairToEndpoints(pair, matrix) {
  segment(pair);
  vector(matrix, 16, 'matrix');
  const transform = ([x, y, z]) => {
    const w = x * matrix[3] + y * matrix[7] + z * matrix[11] + matrix[15];
    if (!Number.isFinite(w) || w === 0) throw new RangeError('Non-finite/projectively singular transform');
    const result = [0, 1, 2].map(i => (x * matrix[i] + y * matrix[i + 4] + z * matrix[i + 8] + matrix[i + 12]) / w);
    vector(result, 3, 'transformed endpoint');
    return result;
  };
  // Serialized pair is P,V, never independent endpoints P,V.
  return [transform(pair[0]), transform(add(Array.from(pair[0]), pair[1]))];
}

// 0x11a5d20, coefficients read from the native binary. Interpolates p1 -> p2.
export function trailCubic(p0, p1, p2, p3, t) {
  [p0, p1, p2, p3].forEach(p => vector(p, 3, 'control point'));
  if (!Number.isFinite(t) || t < 0 || t > 1) throw new RangeError('Expected interpolation t in [0,1]');
  const t2 = t * t, t3 = t2 * t;
  const weights = [-0.5*t3 + t2 - 0.5*t, 1.5*t3 - 2.5*t2 + 1, -1.5*t3 + 2*t2 + 0.5*t, 0.5*t3 - 0.5*t2];
  return [0, 1, 2].map(i => p0[i]*weights[0] + p1[i]*weights[1] + p2[i]*weights[2] + p3[i]*weights[3]);
}

// 0x11a5770: geometry only. Call after history shift, with three endpoint pairs.
// Does NOT age samples, choose emission/fade, reset history, bind Shape, or generate UVs.
export function buildTrailSegments(history, existingSampleCount, spacing) {
  if (!Array.isArray(history) || history.length !== 3) throw new TypeError('Expected three history segments');
  history.forEach(segment);
  if (!Number.isSafeInteger(existingSampleCount) || existingSampleCount < 0) throw new RangeError('Invalid sample count');
  if (!Number.isFinite(spacing) || spacing <= 0) throw new RangeError('Positive finite native spacing required');
  const [older, previous, current] = history;
  const distance = Math.max(length(sub(current[0], previous[0])), length(sub(current[1], previous[1])));
  if (existingSampleCount < 2 || distance < spacing) return [current.map(p => Array.from(p))];
  const count = Math.floor(distance / spacing + 1);
  // Resource guard, not a native clamp: do not silently change a valid trajectory.
  if (!Number.isSafeInteger(count) || count > 100000) throw new RangeError('Trail subdivision resource limit');
  const extrapolated = current.map((p, i) => add(p, scale(normalize(sub(p, previous[i])), length(sub(p, previous[i])))));
  const width = length(sub(current[1], current[0]));
  return Array.from({length: count}, (_, i) => {
    const t = (i + 1) / count;
    const a = trailCubic(older[0], previous[0], current[0], extrapolated[0], t);
    const b = trailCubic(older[1], previous[1], current[1], extrapolated[1], t);
    // Native code restores CURRENT segment width after independently interpolating its ends.
    return [a, add(a, scale(normalize(sub(b, a)), width))];
  });
}

// 0x1270830: equality expires the sample; null represents removal, not a zero-age survivor.
export function ageTrailSample(remaining, delta) {
  [remaining, delta].forEach(uint32);
  return remaining <= delta ? null : remaining - delta;
}

// 0x112b170 -> immediate renderer vtable 0x14a6c98. Input in NATIVE list index order.
// Emits descending indices; UV uses index, not geometric distance or lifetime.
// Does not bind texture, choose primitive topology/blend/depth, or draw anything.
export function trailVertexAttributes(samples, initialLifetime, opacity) {
  if (!Array.isArray(samples) || samples.length > 100000) throw new RangeError('Invalid trail sample list');
  uint32(initialLifetime);
  if (initialLifetime === 0) throw new RangeError('Positive initial lifetime required');
  if (!Number.isFinite(opacity) || opacity < 0 || opacity > 1) throw new RangeError('Opacity outside supported [0,1] domain');
  samples.forEach(s => {
    segment(s.endpoints);uint32(s.remaining);
    if (s.remaining > initialLifetime) throw new RangeError('Remaining lifetime exceeds initial lifetime');
  });
  if (samples.length < 2 || opacity === 0) return [];
  const vertices = [];
  for (let i = samples.length - 1; i >= 0; i--) {
    const s = samples[i], u = i / (samples.length - 1);
    const alpha = s.remaining * opacity / initialLifetime;
    // 0x12336d0 stores float alpha * 255 truncated into the packed color byte.
    const alphaByte = Math.trunc(Math.fround(alpha) * 255);
    s.endpoints.forEach((position, edge) => vertices.push({
      position: Array.from(position), uv: [u, edge === 0 ? 1 : 0],
      rgba: [1, 1, 1, alphaByte / 255], alphaByte, sourceIndex: i,
    }));
  }
  return vertices;
}
