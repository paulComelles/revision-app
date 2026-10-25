/** Exact rational arithmetic on safe integers. */
export interface Frac {
  n: number;
  d: number;
}

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

export function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}

export function frac(n: number, d = 1): Frac {
  if (d === 0) throw new Error('frac: zero denominator');
  if (!Number.isInteger(n) || !Number.isInteger(d)) throw new Error(`frac: non-integer ${n}/${d}`);
  const g = gcd(n, d) || 1;
  const s = d < 0 ? -1 : 1;
  return { n: (s * n) / g + 0, d: (s * d) / g };
}

export const F = {
  add: (a: Frac, b: Frac) => frac(a.n * b.d + b.n * a.d, a.d * b.d),
  sub: (a: Frac, b: Frac) => frac(a.n * b.d - b.n * a.d, a.d * b.d),
  mul: (a: Frac, b: Frac) => frac(a.n * b.n, a.d * b.d),
  div: (a: Frac, b: Frac) => frac(a.n * b.d, a.d * b.n),
  neg: (a: Frac) => frac(-a.n, a.d),
  eq: (a: Frac, b: Frac) => a.n * b.d === b.n * a.d,
  val: (a: Frac) => a.n / a.d,
  isInt: (a: Frac) => a.d === 1,
};

/** Plain text form: "3", "-7/2" */
export function fracToString(f: Frac): string {
  return f.d === 1 ? `${f.n}` : `${f.n}/${f.d}`;
}

/** LaTeX form: "3", "-\frac{7}{2}" */
export function fracToTex(f: Frac): string {
  if (f.d === 1) return `${f.n}`;
  return `${f.n < 0 ? '-' : ''}\\frac{${Math.abs(f.n)}}{${f.d}}`;
}

/** Convert a finite decimal number to an exact fraction (up to 1e-9 precision). */
export function toFrac(x: number, maxDen = 1_000_000): Frac {
  if (Number.isInteger(x)) return frac(x, 1);
  // continued fraction
  let h1 = 1, h0 = 0, k1 = 0, k0 = 1, b = x;
  for (let i = 0; i < 40; i++) {
    const a = Math.floor(b);
    [h1, h0] = [a * h1 + h0, h1];
    [k1, k0] = [a * k1 + k0, k1];
    if (k1 > maxDen) break;
    if (Math.abs(x - h1 / k1) < 1e-12) break;
    b = 1 / (b - a);
  }
  return frac(h1, k1);
}
