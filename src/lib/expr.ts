/**
 * Small math-expression parser/evaluator for typed answers (French input).
 * Supports: + - * / ^, implicit multiplication (2x, 3(x+1), x e^x), unary minus,
 * decimals with "." or ",", constants e and pi/π, functions exp ln log sqrt √
 * sin cos tan abs, superscripts ² ³, unicode × · ÷ −.
 * Equivalence of expressions is tested by evaluating at random points.
 */

type Node =
  | { t: 'num'; v: number }
  | { t: 'var'; name: string }
  | { t: 'un'; op: '-'; a: Node }
  | { t: 'bin'; op: '+' | '-' | '*' | '/' | '^'; a: Node; b: Node }
  | { t: 'fn'; name: string; a: Node };

const FUNCS: Record<string, (x: number) => number> = {
  exp: Math.exp,
  ln: Math.log,
  log: Math.log10,
  sqrt: Math.sqrt,
  racine: Math.sqrt,
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  abs: Math.abs,
};

type Tok =
  | { k: 'num'; v: number }
  | { k: 'id'; v: string }
  | { k: 'op'; v: string }
  | { k: '('; }
  | { k: ')'; };

export class ExprError extends Error {}

function normalize(s: string): string {
  return s
    .replace(/[−–—]/g, '-')
    .replace(/[×·∙]/g, '*')
    .replace(/÷/g, '/')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/π/g, 'pi')
    .replace(/√/g, 'sqrt')
    .replace(/\[/g, '(')
    .replace(/\]/g, ')')
    .replace(/\{/g, '(')
    .replace(/\}/g, ')')
    .replace(/\*\*/g, '^');
}

function tokenize(src: string): Tok[] {
  const s = normalize(src);
  const out: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(s[i + 1] ?? ''))) {
      let j = i;
      while (j < s.length && /[0-9]/.test(s[j])) j++;
      if ((s[j] === '.' || s[j] === ',') && /[0-9]/.test(s[j + 1] ?? '')) {
        j++;
        while (j < s.length && /[0-9]/.test(s[j])) j++;
      }
      out.push({ k: 'num', v: parseFloat(s.slice(i, j).replace(',', '.')) });
      i = j;
      continue;
    }
    if (/[a-zA-Z]/.test(c)) {
      let j = i;
      while (j < s.length && /[a-zA-Z]/.test(s[j])) j++;
      const word = s.slice(i, j).toLowerCase();
      // split words like "xe" or "2xy" into known functions / single letters
      let k = 0;
      while (k < word.length) {
        const rest = word.slice(k);
        const fn = Object.keys(FUNCS)
          .sort((a, b) => b.length - a.length)
          .find((f) => rest.startsWith(f));
        if (fn) {
          out.push({ k: 'id', v: fn });
          k += fn.length;
        } else if (rest.startsWith('pi')) {
          out.push({ k: 'id', v: 'pi' });
          k += 2;
        } else {
          out.push({ k: 'id', v: rest[0] });
          k += 1;
        }
      }
      i = j;
      continue;
    }
    if ('+-*/^'.includes(c)) {
      out.push({ k: 'op', v: c });
      i++;
      continue;
    }
    if (c === '(') {
      out.push({ k: '(' });
      i++;
      continue;
    }
    if (c === ')') {
      out.push({ k: ')' });
      i++;
      continue;
    }
    throw new ExprError(`Caractère non reconnu : « ${c} »`);
  }
  return out;
}

class Parser {
  private p = 0;
  constructor(private toks: Tok[]) {}
  private peek(): Tok | undefined {
    return this.toks[this.p];
  }
  private isOp(v: string) {
    const t = this.peek();
    return t?.k === 'op' && t.v === v;
  }
  parse(): Node {
    if (this.toks.length === 0) throw new ExprError('Expression vide');
    const n = this.expr();
    if (this.p < this.toks.length) throw new ExprError('Expression mal formée (parenthèse ou opérateur en trop ?)');
    return n;
  }
  private expr(): Node {
    let a = this.term();
    while (this.isOp('+') || this.isOp('-')) {
      const op = (this.toks[this.p++] as { v: '+' | '-' }).v;
      a = { t: 'bin', op, a, b: this.term() };
    }
    return a;
  }
  private startsFactor(): boolean {
    const t = this.peek();
    return !!t && (t.k === 'num' || t.k === 'id' || t.k === '(');
  }
  private term(): Node {
    let a = this.unary();
    for (;;) {
      if (this.isOp('*') || this.isOp('/')) {
        const op = (this.toks[this.p++] as { v: '*' | '/' }).v;
        a = { t: 'bin', op, a, b: this.unary() };
      } else if (this.startsFactor()) {
        // implicit multiplication
        a = { t: 'bin', op: '*', a, b: this.power() };
      } else break;
    }
    return a;
  }
  private unary(): Node {
    if (this.isOp('-')) {
      this.p++;
      return { t: 'un', op: '-', a: this.unary() };
    }
    if (this.isOp('+')) {
      this.p++;
      return this.unary();
    }
    return this.power();
  }
  private power(): Node {
    const base = this.atom();
    if (this.isOp('^')) {
      this.p++;
      // right associative, exponent may carry a unary minus
      const exp = this.isOp('-') || this.isOp('+') ? this.unary() : this.power();
      return { t: 'bin', op: '^', a: base, b: exp };
    }
    return base;
  }
  private atom(): Node {
    const t = this.peek();
    if (!t) throw new ExprError('Expression incomplète');
    if (t.k === 'num') {
      this.p++;
      return { t: 'num', v: t.v };
    }
    if (t.k === '(') {
      this.p++;
      const n = this.expr();
      if (this.peek()?.k !== ')') throw new ExprError('Parenthèse fermante manquante');
      this.p++;
      return n;
    }
    if (t.k === 'id') {
      this.p++;
      if (t.v in FUNCS) {
        // function argument: parenthesised, or a single power-level factor (ln x, sqrt 2)
        const arg = this.power();
        return { t: 'fn', name: t.v, a: arg };
      }
      if (t.v === 'pi') return { t: 'num', v: Math.PI };
      if (t.v === 'e') return { t: 'num', v: Math.E };
      return { t: 'var', name: t.v };
    }
    throw new ExprError('Expression mal formée');
  }
}

export interface CompiledExpr {
  vars: string[];
  evaluate(env: Record<string, number>): number;
}

function collectVars(n: Node, acc: Set<string>) {
  switch (n.t) {
    case 'var':
      acc.add(n.name);
      break;
    case 'un':
    case 'fn':
      collectVars(n.a, acc);
      break;
    case 'bin':
      collectVars(n.a, acc);
      collectVars(n.b, acc);
      break;
  }
}

function evalNode(n: Node, env: Record<string, number>): number {
  switch (n.t) {
    case 'num':
      return n.v;
    case 'var': {
      const v = env[n.name];
      if (v === undefined) throw new ExprError(`Variable inattendue : ${n.name}`);
      return v;
    }
    case 'un':
      return -evalNode(n.a, env);
    case 'fn':
      return FUNCS[n.name](evalNode(n.a, env));
    case 'bin': {
      const a = evalNode(n.a, env);
      const b = evalNode(n.b, env);
      switch (n.op) {
        case '+':
          return a + b;
        case '-':
          return a - b;
        case '*':
          return a * b;
        case '/':
          return a / b;
        case '^':
          return Math.pow(a, b);
      }
    }
  }
}

export function compile(src: string): CompiledExpr {
  const ast = new Parser(tokenize(src)).parse();
  const s = new Set<string>();
  collectVars(ast, s);
  return { vars: [...s], evaluate: (env) => evalNode(ast, env) };
}

export function tryCompile(src: string): { ok: true; expr: CompiledExpr } | { ok: false; message: string } {
  try {
    return { ok: true, expr: compile(src) };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

/** Evaluate a constant expression ("ln(3)/2", "2,5", "3/4"). */
export function evalConstant(src: string): number {
  const c = compile(src);
  if (c.vars.length) throw new ExprError(`La réponse ne doit pas contenir de variable (${c.vars.join(', ')})`);
  return c.evaluate({});
}

export function close(a: number, b: number, rel = 1e-6, abs = 1e-9): boolean {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  return Math.abs(a - b) <= Math.max(abs, rel * Math.max(Math.abs(a), Math.abs(b)));
}

export interface EquivOptions {
  variable?: string;
  /** sampling interval for the variable */
  domain?: [number, number];
  samples?: number;
  /** deterministic sample seed */
  seed?: number;
}

/**
 * Two expressions in one variable are considered equivalent when they agree
 * (relative tolerance) at many random points where both are defined.
 */
export function equivalentFn(
  f: (x: number) => number,
  g: (x: number) => number,
  { domain = [-3, 3], samples = 12, seed = 12345 }: EquivOptions = {},
): boolean {
  let s = seed >>> 0;
  const rnd = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
  let good = 0;
  for (let i = 0; i < samples * 6 && good < samples; i++) {
    const x = domain[0] + (domain[1] - domain[0]) * rnd();
    const a = f(x);
    const b = g(x);
    const fa = Number.isFinite(a);
    const fb = Number.isFinite(b);
    if (!fa && !fb) continue;
    if (fa !== fb) return false;
    if (!close(a, b, 1e-6, 1e-8)) return false;
    good++;
  }
  return good >= Math.min(samples, 4);
}

export function checkExpression(
  input: string,
  expected: string | ((x: number) => number),
  opts: EquivOptions = {},
): { valid: boolean; correct: boolean; message?: string } {
  const variable = opts.variable ?? 'x';
  const c = tryCompile(input);
  if (!c.ok) return { valid: false, correct: false, message: c.message };
  const extra = c.expr.vars.filter((v) => v !== variable);
  if (extra.length) return { valid: false, correct: false, message: `Variable inattendue : ${extra.join(', ')} (utilise ${variable})` };
  const exp = typeof expected === 'string' ? compile(expected) : null;
  const g = exp ? (x: number) => exp.evaluate({ [variable]: x }) : (expected as (x: number) => number);
  const f = (x: number) => c.expr.evaluate({ [variable]: x });
  return { valid: true, correct: equivalentFn(f, g, opts) };
}

/** Parse a French/English number: "2,5", "-3/4", "1e-3". Returns NaN on failure. */
export function parseNumberFr(raw: string): number {
  const s = raw.trim().replace(/\s/g, '').replace(/[−–]/g, '-');
  if (s === '') return NaN;
  try {
    return evalConstant(s);
  } catch {
    return NaN;
  }
}

function prec(n: Node): number {
  if (n.t === 'bin') return n.op === '+' || n.op === '-' ? 1 : n.op === '^' ? 4 : 2;
  if (n.t === 'un') return 1.5;
  return 5;
}

function texNode(n: Node): string {
  switch (n.t) {
    case 'num':
      if (n.v === Math.PI) return '\\pi';
      if (n.v === Math.E) return '\\mathrm{e}';
      return String(n.v).replace('.', '{,}');
    case 'var':
      return n.name;
    case 'un': {
      const inner = texNode(n.a);
      return prec(n.a) <= 1.5 ? `-\\left(${inner}\\right)` : `-${inner}`;
    }
    case 'fn': {
      const arg = texNode(n.a);
      if (n.name === 'sqrt' || n.name === 'racine') return `\\sqrt{${arg}}`;
      if (n.name === 'abs') return `\\left|${arg}\\right|`;
      if (n.name === 'exp') return `\\mathrm{e}^{${arg}}`;
      return `\\${n.name === 'log' ? 'log' : n.name}\\left(${arg}\\right)`;
    }
    case 'bin': {
      const p = prec(n);
      const wrap = (c: Node, right = false) => {
        const s = texNode(c);
        const cp = prec(c);
        return cp < p || (right && cp === p && (n.op === '-' || n.op === '/')) ? `\\left(${s}\\right)` : s;
      };
      if (n.op === '/') return `\\frac{${texNode(n.a)}}{${texNode(n.b)}}`;
      if (n.op === '^') {
        const base = prec(n.a) < 5 || (n.a.t === 'num' && n.a.v < 0) ? `\\left(${texNode(n.a)}\\right)` : texNode(n.a);
        return `${base}^{${texNode(n.b)}}`;
      }
      if (n.op === '*') {
        const l = wrap(n.a);
        const r = wrap(n.b, true);
        const needDot = n.b.t === 'num' || (n.b.t === 'un');
        return needDot ? `${l} \\times ${r}` : `${l}\\,${r}`;
      }
      return `${wrap(n.a)} ${n.op} ${wrap(n.b, true)}`;
    }
  }
}

/** LaTeX preview of how a typed expression was understood. */
export function exprToTex(src: string): string | null {
  try {
    return texNode(new Parser(tokenize(src)).parse());
  } catch {
    return null;
  }
}
