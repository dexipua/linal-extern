/* Tiny exact rational arithmetic shared by the trainer and the lab. */
(function (g) {
  'use strict';
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a || 1; }
  function F(n, d) {
    if (d === undefined) d = 1;
    if (d === 0) throw new Error('ділення на нуль');
    if (d < 0) { n = -n; d = -d; }
    var k = gcd(n, d); this.n = n / k; this.d = d / k;
  }
  F.of = function (x) { return x instanceof F ? x : new F(x, 1); };
  F.prototype.add = function (o) { o = F.of(o); return new F(this.n * o.d + o.n * this.d, this.d * o.d); };
  F.prototype.sub = function (o) { o = F.of(o); return new F(this.n * o.d - o.n * this.d, this.d * o.d); };
  F.prototype.mul = function (o) { o = F.of(o); return new F(this.n * o.n, this.d * o.d); };
  F.prototype.div = function (o) { o = F.of(o); return new F(this.n * o.d, this.d * o.n); };
  F.prototype.neg = function () { return new F(-this.n, this.d); };
  F.prototype.isZero = function () { return this.n === 0; };
  F.prototype.eq = function (o) { o = F.of(o); return this.n === o.n && this.d === o.d; };
  F.prototype.toString = function () {
    var s = this.d === 1 ? String(Math.abs(this.n)) : Math.abs(this.n) + '/' + this.d;
    return (this.n < 0 ? '−' : '') + s;
  };
  F.prototype.html = function () {
    if (this.d === 1) return this.toString();
    return (this.n < 0 ? '−' : '') + '<span class="fr"><b>' + Math.abs(this.n) + '</b><b>' + this.d + '</b></span>';
  };
  /* parse user input: "3", "-2", "−7/3", "0,5", "1.25" */
  F.parse = function (s) {
    s = String(s).trim().replace(/\s+/g, '').replace(/[−–—]/g, '-').replace(',', '.');
    if (!s) return null;
    var m = s.match(/^(-?\d+)\/(-?\d+)$/);
    if (m) { if (+m[2] === 0) return null; return new F(+m[1], +m[2]); }
    m = s.match(/^(-?)(\d*)\.(\d+)$/);
    if (m) { var p = Math.pow(10, m[3].length); var v = (+(m[2] || 0)) * p + (+m[3]); return new F(m[1] ? -v : v, p); }
    if (/^-?\d+$/.test(s)) return new F(+s, 1);
    return null;
  };
  /* matrix helpers over F */
  F.det = function (A) {
    var n = A.length, M = A.map(function (r) { return r.map(F.of); }), d = new F(1);
    for (var c = 0; c < n; c++) {
      var p = -1;
      for (var r = c; r < n; r++) if (!M[r][c].isZero()) { p = r; break; }
      if (p < 0) return new F(0);
      if (p !== c) { var t = M[p]; M[p] = M[c]; M[c] = t; d = d.neg(); }
      d = d.mul(M[c][c]);
      for (r = c + 1; r < n; r++) {
        var k = M[r][c].div(M[c][c]);
        for (var j = c; j < n; j++) M[r][j] = M[r][j].sub(k.mul(M[c][j]));
      }
    }
    return d;
  };
  F.matmul = function (A, B) {
    return A.map(function (row) {
      return B[0].map(function (_, j) {
        return row.reduce(function (s, a, k) { return s.add(F.of(a).mul(B[k][j])); }, new F(0));
      });
    });
  };
  /* ---------- step-by-step row reduction (shared by trainer solutions and the sandbox hint) ---------- */
  var SUB = '₀₁₂₃₄₅₆₇₈₉';
  function Rn(i) { return 'R' + String(i + 1).split('').map(function (d) { return SUB[+d]; }).join(''); }
  function kTxt(k) { return k.d === 1 ? k.toString() : '(' + k + ')'; }
  F.opText = function (o) {
    if (o.op === 'swap') return Rn(o.i) + ' ↔ ' + Rn(o.j);
    if (o.op === 'scale') return Rn(o.i) + ' → ' + kTxt(o.k) + '·' + Rn(o.i);
    var a = o.k.n < 0 ? o.k.neg() : o.k;
    return Rn(o.i) + ' → ' + Rn(o.i) + (o.k.n < 0 ? ' − ' : ' + ') + (a.eq(1) ? '' : kTxt(a)) + Rn(o.j);
  };
  F.applyOp = function (M, o) {
    if (o.op === 'swap') { var t = M[o.i]; M[o.i] = M[o.j]; M[o.j] = t; }
    else if (o.op === 'scale') M[o.i] = M[o.i].map(function (x) { return x.mul(o.k); });
    else M[o.i] = M[o.i].map(function (x, c) { return x.add(o.k.mul(M[o.j][c])); });
  };
  function copy(M) { return M.map(function (r) { return r.map(F.of); }); }
  function pickPivot(M, r, c) {
    var best = -1;
    for (var i = r; i < M.length; i++) {
      if (M[i][c].isZero()) continue;
      if (Math.abs(M[i][c].n) === 1 && M[i][c].d === 1) return i;
      if (best < 0) best = i;
    }
    return best;
  }
  /* Jordan–Gauss to reduced row echelon form; pivots only in the first nLeft columns.
     Returns { steps: [{ ops: [op…], M }], M, rank } — each step groups the ops done for one purpose. */
  F.rref = function (A, nLeft) {
    var M = copy(A), rows = M.length, steps = [], r = 0;
    nLeft = nLeft || M[0].length;
    for (var c = 0; c < nLeft && r < rows; c++) {
      var p = pickPivot(M, r, c); if (p < 0) continue;
      if (p !== r) { var o = { op: 'swap', i: r, j: p }; F.applyOp(M, o); steps.push({ ops: [o], M: copy(M) }); }
      if (!M[r][c].eq(1)) { o = { op: 'scale', i: r, k: new F(1).div(M[r][c]) }; F.applyOp(M, o); steps.push({ ops: [o], M: copy(M) }); }
      var ops = [];
      for (var i = 0; i < rows; i++) if (i !== r && !M[i][c].isZero()) { o = { op: 'add', i: i, j: r, k: M[i][c].neg() }; F.applyOp(M, o); ops.push(o); }
      if (ops.length) steps.push({ ops: ops, M: copy(M) });
      r++;
    }
    return { steps: steps, M: M, rank: r };
  };
  /* the first operation the strategy above would do next (null when already reduced) */
  F.nextOp = function (A, nLeft) {
    var M = copy(A), rows = M.length, r = 0;
    nLeft = nLeft || M[0].length;
    for (var c = 0; c < nLeft && r < rows; c++) {
      var p = pickPivot(M, r, c); if (p < 0) continue;
      if (p !== r) return { op: 'swap', i: r, j: p };
      if (!M[r][c].eq(1)) return { op: 'scale', i: r, k: new F(1).div(M[r][c]) };
      for (var i = 0; i < rows; i++) if (i !== r && !M[i][c].isZero()) return { op: 'add', i: i, j: r, k: M[i][c].neg() };
      r++;
    }
    return null;
  };
  /* determinant by forward elimination (no row scaling): swaps flip the sign */
  F.detSteps = function (A) {
    var M = copy(A), n = M.length, steps = [], sign = 1;
    for (var c = 0; c < n; c++) {
      var p = pickPivot(M, c, c);
      if (p < 0) return { steps: steps, det: new F(0), zeroCol: c, sign: sign, M: M };
      if (p !== c) { var o = { op: 'swap', i: c, j: p }; F.applyOp(M, o); sign = -sign; steps.push({ ops: [o], M: copy(M), note: 'знак змінюється' }); }
      var ops = [];
      for (var i = c + 1; i < n; i++) if (!M[i][c].isZero()) { o = { op: 'add', i: i, j: c, k: M[i][c].div(M[c][c]).neg() }; F.applyOp(M, o); ops.push(o); }
      if (ops.length) steps.push({ ops: ops, M: copy(M) });
    }
    var d = new F(sign); for (c = 0; c < n; c++) d = d.mul(M[c][c]);
    return { steps: steps, det: d, sign: sign, M: M };
  };
  F.mHTML = function (A, bar) {
    var c = A[0].length;
    return '<span class="M" style="grid-template-columns:repeat(' + (c + (bar ? 1 : 0)) + ',auto)">' + A.map(function (r) {
      return r.map(function (x, j) { return (bar && j === bar ? '<i class="s"></i>' : '') + '<i>' + F.of(x).html() + '</i>'; }).join('');
    }).join('') + '</span>';
  };
  F.stepsHTML = function (start, steps, bar) {
    return '<div class="steps">' + F.mHTML(start, bar) + steps.map(function (s) {
      return '<span class="st-op"><span>' + s.ops.map(F.opText).join('<br>') + (s.note ? '<br><em>' + s.note + '</em>' : '') + '</span><b aria-hidden="true">→</b></span>' + F.mHTML(s.M, bar);
    }).join('') + '</div>';
  };
  g.F = F;
})(window);
