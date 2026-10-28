// Source geometry stage only: 1276F90(builderArgument=1) -> 11E14C0 ->
// 127C590(type2=11DFAF0) -> six 11DDE90 clips -> 11D6370 fan.
// No octree construction, source admission, movement, or Controller hook.
const f = Math.fround;
const gates = Object.freeze({nativeReady:false, nativeCompared:false,
  x87BitwiseParityVerified:false, controllerHook:false});

function xyz(value) {
  if (!Array.isArray(value) || value.length !== 3 ||
      !value.every(n => Number.isFinite(n) && Number.isFinite(f(n)))) {
    throw TypeError('Finite native float32 XYZ required');
  }
  return value.map(f);
}
function finite(value) {
  if (!Number.isFinite(value) || !Number.isFinite(f(value))) throw TypeError('Finite native float32 required');
  return f(value);
}

// 12760A0 constructor only. A serialized/cache node can have a stored centre
// which must be supplied explicitly rather than inferred by this helper.
export function nativeConstructedCellFromBounds({min, max} = {}) {
  min = xyz(min); max = xyz(max);
  if (min.some((n, i) => n > max[i])) throw TypeError('Ordered native cell bounds required');
  const size = max.map((n, i) => f(n - min[i]));
  const center = size.map((n, i) => f(min[i] + f(n * .5)));
  if (![...size, ...center].every(Number.isFinite)) throw TypeError('Finite native cell required');
  return {center, size};
}

// The actual caller supplies forward=(0,0,1), up=(0,1,0). 11E14C0 stores
// +side,-side,-forward,+forward,-up,+up in that order. D uses the float32
// centre dot product and half dimension, then one float32 store.
export function nativeCellClippingPlanes({center, size} = {}) {
  center = xyz(center); size = xyz(size);
  if (size.some(n => n < 0)) throw TypeError('Nonnegative cell dimensions required');
  const [x,y,z] = center, [width,height,depth] = size;
  const planes = [
    [1,0,0,f(width * .5 - x)], [-1,-0,-0,f(width * .5 + x)],
    [-0,-0,-1,f(depth * .5 + z)], [0,0,1,f(depth * .5 - z)],
    [-0,-1,-0,f(height * .5 + y)], [0,1,0,f(height * .5 - y)],
  ];
  if (!planes.flat().every(Number.isFinite)) throw TypeError('Finite native planes required');
  return planes;
}

// 100BF10: SSE single-precision products and left-associated additions.
export function nativeClippingPlaneDistance(plane, position) {
  if (!Array.isArray(plane) || plane.length !== 4) throw TypeError('Native plane XYZD required');
  const [x,y,z,d] = plane.map(finite), p = xyz(position);
  return f(f(f(f(x*p[0]) + f(y*p[1])) + f(z*p[2])) + d);
}

// x87 precision control rounds significands, while retaining an extended
// exponent range. Math.fround alone would incorrectly overflow/flush those
// register intermediates. Float32 input geometry and these few operations
// stay inside the normal double exponent range supported here.
function roundSignificand24(value) {
  if (!Number.isFinite(value)) throw RangeError('Finite clipping intermediate required');
  if (value === 0) return value;
  const magnitude = Math.abs(value);
  if (magnitude >= 2**-126 && magnitude <= 3.4028234663852886e38) return f(value);
  if (magnitude < 2**-1022) throw RangeError('Extended double-subnormal clipping intermediate unsupported');
  const unit = 2**(Math.floor(Math.log2(magnitude))-23);
  const scaled = magnitude/unit, floor = Math.floor(scaled), fraction = scaled-floor;
  const rounded = floor+(fraction>.5 || fraction===.5 && floor%2===1 ? 1 : 0);
  return Math.sign(value)*rounded*unit;
}

function intersection(inside, outside, plane, arithmetic) {
  // 11DDF99..D7 / 11DE036..74 retain the denominator in x87 until t's
  // float32 store. JS uses double here, NOT a claim of x87 bitwise parity.
  let denominator, t;
  if (arithmetic) {
    const q = arithmetic.precisionBits === 24 ? roundSignificand24 : value => value;
    const products = inside.map((n,i) => q(q(n-outside[i])*plane[i]));
    denominator = q(q(products[0]+products[1])+products[2]);
    t = f(q(nativeClippingPlaneDistance(plane,inside)/denominator));
  } else {
    denominator = ((inside[0]-outside[0])*plane[0] +
      (inside[1]-outside[1])*plane[1]) + (inside[2]-outside[2])*plane[2];
    t = f(nativeClippingPlaneDistance(plane, inside) / denominator);
  }
  // 11C2CD0 -> 5785C0,1135880,7AFF90: each helper stores float32.
  const point = inside.map((n,i) => f(n + f(f(outside[i]-n)*t)));
  if (!point.every(Number.isFinite)) throw RangeError('Unqualified clipping intersection');
  return point;
}

function clipPlane(polygon, plane, arithmetic) {
  const outside = polygon.map(p => nativeClippingPlaneDistance(plane,p) < 0);
  if (outside.every(Boolean)) return [];
  const output = [];
  for (let current=0; current<polygon.length; current++) {
    const previous = (current+polygon.length-1)%polygon.length;
    if (outside[current]) {
      if (!outside[previous]) output.push(intersection(polygon[previous],polygon[current],plane,arithmetic));
    } else {
      // Native entry interpolation starts at CURRENT inside, not previous.
      if (outside[previous]) output.push(intersection(polygon[current],polygon[previous],plane,arithmetic));
      output.push(polygon[current].slice());
    }
  }
  return output;
}

function clipTriangle({triangle, cell, existingVertexCount=0} = {}, arithmetic) {
  if (!Array.isArray(triangle) || triangle.length !== 3) throw TypeError('Three native vertices required');
  if (!Number.isInteger(existingVertexCount) || existingVertexCount<0 || existingVertexCount>=2000) {
    throw TypeError('Native output vertex count in [0,2000) required');
  }
  let polygon = triangle.map(xyz);
  const planes = nativeCellClippingPlanes(cell);
  for (const plane of planes) {
    polygon = clipPlane(polygon,plane,arithmetic);
    if (!polygon.length) break;
  }
  // 11D6370 rejects equality, and the caller stops processing more input
  // triangles on that failure. Preserve duplicates and degenerate fans.
  const accepted = polygon.length === 0 || existingVertexCount+polygon.length < 2000;
  const indices = [], packets = [];
  if (accepted) for (let i=2; i<polygon.length; i++) {
    indices.push([existingVertexCount,existingVertexCount+i-1,existingVertexCount+i]);
    const a=polygon[0], b=polygon[i-1], c=polygon[i];
    packets.push({origin:a.slice(),edge1:b.map((n,j)=>f(n-a[j])),edge2:c.map((n,j)=>f(n-a[j]))});
  }
  return {accepted, polygon, indices, packets,
    vertexCount:existingVertexCount+(accepted?polygon.length:0),
    // Source fan increments by n-2; n<3 is explicitly exposed rather than
    // silently sanitized into a claim of a valid native triangle buffer.
    nativeTriangleCountDelta:accepted&&polygon.length?polygon.length-2:0,
    nativeFanCountQualified:polygon.length===0||polygon.length>=2,
    ...gates, ...(arithmetic ? {arithmeticProfile:arithmetic} : {})};
}

// Preserve the original diagnostic entry point; no implicit FPU profile is
// added to callers or to the game. A native construction context must supply
// its separately qualified precision before using the explicit factory.
export function clipNativeCellTriangle(input) { return clipTriangle(input); }

export function createNativeCellTriangleClipper({precisionBits,roundingMode,source} = {}) {
  if (![24,53].includes(precisionBits) || roundingMode !== 'nearest' ||
      typeof source !== 'string' || !source.trim()) {
    throw TypeError('Explicit clipping precision24/53, nearest rounding and source required');
  }
  const arithmetic = Object.freeze({precisionBits,roundingMode,source});
  return input => clipTriangle(input,arithmetic);
}
