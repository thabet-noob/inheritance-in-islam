// Exact rational arithmetic on BigInt. Always stored reduced with a positive denominator.

const gcd = (a: bigint, b: bigint): bigint => {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) [a, b] = [b, a % b];
  return a;
};

export class Fraction {
  readonly num: bigint;
  readonly den: bigint;

  constructor(num: bigint | number, den: bigint | number = 1n) {
    let n = BigInt(num);
    let d = BigInt(den);
    if (d === 0n) throw new Error('Zero denominator');
    if (d < 0n) [n, d] = [-n, -d];
    const g = gcd(n, d) || 1n;
    this.num = n / g;
    this.den = d / g;
  }

  static readonly ZERO = new Fraction(0);
  static readonly ONE = new Fraction(1);

  static of(num: number, den = 1): Fraction {
    return new Fraction(num, den);
  }

  static parse(s: string): Fraction {
    const [n, d] = s.trim().split('/');
    return new Fraction(BigInt(n), d === undefined ? 1n : BigInt(d));
  }

  add(o: Fraction) { return new Fraction(this.num * o.den + o.num * this.den, this.den * o.den); }
  sub(o: Fraction) { return new Fraction(this.num * o.den - o.num * this.den, this.den * o.den); }
  mul(o: Fraction | number) {
    const f = typeof o === 'number' ? Fraction.of(o) : o;
    return new Fraction(this.num * f.num, this.den * f.den);
  }
  div(o: Fraction | number) {
    const f = typeof o === 'number' ? Fraction.of(o) : o;
    return new Fraction(this.num * f.den, this.den * f.num);
  }
  cmp(o: Fraction) {
    const d = this.num * o.den - o.num * this.den;
    return d < 0n ? -1 : d > 0n ? 1 : 0;
  }
  eq(o: Fraction) { return this.cmp(o) === 0; }
  lt(o: Fraction) { return this.cmp(o) < 0; }
  gt(o: Fraction) { return this.cmp(o) > 0; }
  isZero() { return this.num === 0n; }
  isPositive() { return this.num > 0n; }
  toNumber() { return Number(this.num) / Number(this.den); }
  toString() { return this.den === 1n ? `${this.num}` : `${this.num}/${this.den}`; }

  static sum(fs: Fraction[]) { return fs.reduce((a, b) => a.add(b), Fraction.ZERO); }
  static max(...fs: Fraction[]) { return fs.reduce((a, b) => (b.gt(a) ? b : a)); }
  static min(...fs: Fraction[]) { return fs.reduce((a, b) => (b.lt(a) ? b : a)); }
}

export const F = Fraction.of;
