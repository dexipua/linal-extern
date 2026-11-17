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
  g.F = F;
})(window);
