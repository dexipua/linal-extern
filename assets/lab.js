(function () {
  'use strict';
  var F = window.F;
  function css(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }
  function fmt(x) { var r = Math.round(x * 1000) / 1000; return (r < 0 ? '−' : '') + Math.abs(r); }

  /* =============== transformation visualizer =============== */
  var cv = document.getElementById('cv');
  if (cv) {
    var ctx = cv.getContext('2d'), ids = ['ma', 'mb', 'mc', 'md'], inp = ids.map(function (i) { return document.getElementById(i); });
    var ang = document.getElementById('ang'), angv = document.getElementById('angv'), info = document.getElementById('vinfo');
    var A = [1, 0, 0, 1], shown = [1, 0, 0, 1], anim = null, R = 5;
    var SHAPE = [[0, 0], [0, 2], [1.2, 2], [1.2, 1.7], [0.35, 1.7], [0.35, 1.15], [1, 1.15], [1, 0.85], [0.35, 0.85], [0.35, 0], [0, 0]];

    function size() {
      var w = Math.min(cv.parentElement.clientWidth, 520), dpr = window.devicePixelRatio || 1;
      cv.style.width = w + 'px'; cv.style.height = w + 'px'; cv.width = w * dpr; cv.height = w * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw();
    }
    function draw() {
      var w = cv.clientWidth, s = w / (2 * R), m = shown;
      function P(x, y) { return [w / 2 + x * s, w / 2 - y * s]; }
      function T(x, y) { return [m[0] * x + m[1] * y, m[2] * x + m[3] * y]; }
      var line = css('--line'), mut = css('--mut'), acc = css('--acc'), hi = css('--hi'), l3 = css('--l3'), l1 = css('--l1');
      ctx.fillStyle = css('--surface'); ctx.fillRect(0, 0, w, w);
      ctx.lineWidth = 1; ctx.strokeStyle = line;
      for (var i = -R; i <= R; i++) {
        var a = P(i, -R), b = P(i, R); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
        a = P(-R, i); b = P(R, i); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      }
      ctx.strokeStyle = mut; ctx.lineWidth = 1.4;
      var o1 = P(-R, 0), o2 = P(R, 0); ctx.beginPath(); ctx.moveTo(o1[0], o1[1]); ctx.lineTo(o2[0], o2[1]); ctx.stroke();
      o1 = P(0, -R); o2 = P(0, R); ctx.beginPath(); ctx.moveTo(o1[0], o1[1]); ctx.lineTo(o2[0], o2[1]); ctx.stroke();
      /* transformed grid */
      ctx.globalAlpha = .35; ctx.strokeStyle = acc; ctx.lineWidth = 1;
      for (i = -R * 2; i <= R * 2; i++) {
        var p1 = T(i, -R * 3), p2 = T(i, R * 3), q1 = P(p1[0], p1[1]), q2 = P(p2[0], p2[1]);
        ctx.beginPath(); ctx.moveTo(q1[0], q1[1]); ctx.lineTo(q2[0], q2[1]); ctx.stroke();
        p1 = T(-R * 3, i); p2 = T(R * 3, i); q1 = P(p1[0], p1[1]); q2 = P(p2[0], p2[1]);
        ctx.beginPath(); ctx.moveTo(q1[0], q1[1]); ctx.lineTo(q2[0], q2[1]); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      /* unit square image */
      var sq = [[0, 0], [1, 0], [1, 1], [0, 1]].map(function (p) { var t = T(p[0], p[1]); return P(t[0], t[1]); });
      ctx.fillStyle = acc; ctx.globalAlpha = .18; ctx.beginPath(); sq.forEach(function (p, k) { k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
      /* original shape (dashed) and image */
      function poly(pts, color, dash, width) {
        ctx.setLineDash(dash); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath();
        pts.forEach(function (p, k) { var q = P(p[0], p[1]); k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }); ctx.stroke(); ctx.setLineDash([]);
      }
      poly(SHAPE, mut, [5, 4], 1.5);
      poly(SHAPE.map(function (p) { return T(p[0], p[1]); }), hi, [], 3);
      /* basis images */
      function arrow(v, color, label) {
        var a = P(0, 0), b = P(v[0], v[1]), dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
        ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2.6;
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
        if (L > 4) {
          var ux = dx / L, uy = dy / L; ctx.beginPath(); ctx.moveTo(b[0], b[1]);
          ctx.lineTo(b[0] - 10 * ux + 5 * uy, b[1] - 10 * uy - 5 * ux); ctx.lineTo(b[0] - 10 * ux - 5 * uy, b[1] - 10 * uy + 5 * ux); ctx.fill();
        }
        ctx.font = '600 14px Inter, system-ui, sans-serif'; ctx.fillText(label, b[0] + 6, b[1] - 6);
      }
      arrow([m[0], m[2]], l3, 'Ae₁'); arrow([m[1], m[3]], l1, 'Ae₂');
    }
    function setA(v, animate) {
      A = v.slice(); inp.forEach(function (e, i) { e.value = fmt(A[i]).replace('−', '-'); });
      if (animate) play(); else { shown = A.slice(); draw(); }
      describe();
    }
    function play() {
      cancelAnimationFrame(anim); var t0 = null, from = [1, 0, 0, 1];
      var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) { shown = A.slice(); draw(); return; }
      (function step(ts) {
        if (!t0) t0 = ts; var t = Math.min(1, (ts - t0) / 900), e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        shown = from.map(function (f, i) { return f + (A[i] - f) * e; }); draw();
        if (t < 1) anim = requestAnimationFrame(step);
      })(performance.now());
    }
    function describe() {
      var a = A[0], b = A[1], c = A[2], d = A[3], det = a * d - b * c, eps = 1e-9, kind;
      var orth = Math.abs(a * a + c * c - 1) < 1e-6 && Math.abs(b * b + d * d - 1) < 1e-6 && Math.abs(a * b + c * d) < 1e-6;
      if (Math.abs(det) < eps) kind = 'вироджене: площина сплющується на пряму або точку, оберненого немає';
      else if (orth && det > 0) { var phi = Math.round(Math.atan2(c, a) * 180 / Math.PI * 100) / 100; kind = 'поворот на ' + fmt(phi) + '°: довжини й кути зберігаються'; }
      else if (orth) { var th = Math.round(Math.atan2(c, a) * 90 / Math.PI * 100) / 100; kind = 'симетрія відносно прямої під кутом ' + fmt(th) + '° до Ox'; }
      else if (Math.abs(b) < eps && Math.abs(c) < eps) kind = 'розтяг/стиск уздовж осей у ' + fmt(a) + ' і ' + fmt(d) + ' разів';
      else if (Math.abs(a - 1) < eps && Math.abs(d - 1) < eps && (Math.abs(b) < eps || Math.abs(c) < eps)) kind = 'зсув';
      else kind = 'загальне лінійне перетворення';
      var ints = A.every(function (x) { return Math.abs(x - Math.round(x)) < 1e-9; }), cells;
      if (ints && Math.abs(det) >= eps) { var D = Math.round(det); cells = [d, -b, -c, a].map(function (x) { return new F(Math.round(x), D).html(); }); }
      else cells = [d / det, -b / det, -c / det, a / det].map(fmt);
      var inv = Math.abs(det) < eps ? 'не існує' : '<span class="M" style="grid-template-columns:repeat(2,auto)"><i>' + cells.join('</i><i>') + '</i></span>';
      info.innerHTML = '<div><span class="mut">det A</span><b>' + fmt(det) + '</b></div>' +
        '<div><span class="mut">площі</span><b>× ' + fmt(Math.abs(det)) + '</b></div>' +
        '<div><span class="mut">орієнтація</span><b>' + (Math.abs(det) < eps ? '—' : det > 0 ? 'зберігається' : 'змінюється') + '</b></div>' +
        '<div class="wide-cell"><span class="mut">що це</span><b>' + kind + '</b></div>' +
        '<div class="wide-cell"><span class="mut">A⁻¹</span><b>' + inv + '</b></div>';
    }
    inp.forEach(function (e) {
      e.addEventListener('input', function () {
        var v = inp.map(function (x) { var p = F.parse(x.value); return p ? p.n / p.d : NaN; });
        if (v.some(isNaN)) return; A = v; shown = A.slice(); draw(); describe();
      });
    });
    function rot(deg) { var r = deg * Math.PI / 180; return [Math.cos(r), -Math.sin(r), Math.sin(r), Math.cos(r)].map(function (x) { return Math.abs(x) < 1e-12 ? 0 : x; }); }
    ang.addEventListener('input', function () { angv.textContent = ang.value + '°'; setA(rot(+ang.value), false); });
    var PRE = {
      id: [1, 0, 0, 1], r90: [0, -1, 1, 0], sx: [1, 0, 0, -1], sy: [-1, 0, 0, 1], sxy: [0, 1, 1, 0],
      st: [2, 0, 0, 0.5], sh: [1, 1, 0, 1], pr: [1, 0, 0, 0], ex: [2, -1, 1, 3]
    };
    [].forEach.call(document.querySelectorAll('[data-pre]'), function (b) {
      b.addEventListener('click', function () {
        var k = b.dataset.pre;
        if (k === 'rnd') { var v; do { v = [0, 0, 0, 0].map(function () { return Math.floor(Math.random() * 7) - 3; }); } while (v[0] * v[3] - v[1] * v[2] === 0); setA(v, true); }
        else setA(PRE[k], true);
      });
    });
    document.getElementById('play').addEventListener('click', play);
    window.addEventListener('resize', size);
    if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', draw);
    size(); setA([2, -1, 1, 3], false);
  }

  /* =============== row operations sandbox =============== */
  var grid = document.getElementById('rg');
  if (!grid) return;
  var rowsS = document.getElementById('rows'), colsS = document.getElementById('cols'), augC = document.getElementById('aug');
  var opS = document.getElementById('op'), iS = document.getElementById('ri'), jS = document.getElementById('rj'), kI = document.getElementById('rk');
  var logEl = document.getElementById('rlog'), msg = document.getElementById('rmsg'), badge = document.getElementById('rstate');
  var Mx = [], hist = [];
  var SUB = '₀₁₂₃₄₅₆₇₈₉';
  function Rn(i) { return 'R' + SUB[i + 1]; }

  function build(vals) {
    var r = +rowsS.value, c = +colsS.value;
    grid.style.gridTemplateColumns = 'repeat(' + c + ', minmax(3.2em, 1fr))';
    grid.classList.toggle('augm', augC.checked);
    var h = '';
    for (var i = 0; i < r; i++) for (var j = 0; j < c; j++) {
      var v = vals && vals[i] && vals[i][j] !== undefined ? vals[i][j] : (i === j ? '1' : '0');
      h += '<input id="g' + i + '_' + j + '" class="' + (augC.checked && j === c - 1 ? 'barl' : '') + '" value="' + v + '" aria-label="рядок ' + (i + 1) + ', стовпець ' + (j + 1) + '" autocomplete="off">';
    }
    grid.innerHTML = h;
    var o = ''; for (i = 0; i < r; i++) o += '<option value="' + i + '">' + Rn(i) + '</option>';
    iS.innerHTML = o; jS.innerHTML = o; if (r > 1) jS.value = '1';
    read(); status();
  }
  function read() {
    var r = +rowsS.value, c = +colsS.value, out = [];
    for (var i = 0; i < r; i++) {
      out.push([]);
      for (var j = 0; j < c; j++) { var x = F.parse(document.getElementById('g' + i + '_' + j).value); if (!x) return null; out[i].push(x); }
    }
    Mx = out; return out;
  }
  function write() {
    Mx.forEach(function (r, i) { r.forEach(function (x, j) { document.getElementById('g' + i + '_' + j).value = x.toString().replace('−', '-'); }); });
  }
  function lead(r, lim) { for (var j = 0; j < lim; j++) if (!r[j].isZero()) return j; return -1; }
  function status() {
    if (!read()) { badge.textContent = 'є некоректні клітинки'; badge.className = 'pill bad'; return; }
    var lim = augC.checked ? Mx[0].length - 1 : Mx[0].length, prev = -1, echelon = true, rref = true, zeroSeen = false, bad = false;
    Mx.forEach(function (r) {
      var l = lead(r, lim);
      if (l < 0) { zeroSeen = true; if (augC.checked && !r[lim].isZero()) bad = true; return; }
      if (zeroSeen || l <= prev) echelon = false;
      if (!r[l].eq(1)) rref = false;
      Mx.forEach(function (o) { if (o !== r && !o[l].isZero()) rref = false; });
      prev = l;
    });
    if (bad) { badge.textContent = 'рядок 0 … 0 | c: система несумісна'; badge.className = 'pill bad'; }
    else if (echelon && rref) { badge.textContent = 'зведений ступінчастий вигляд'; badge.className = 'pill ok'; }
    else if (echelon) { badge.textContent = 'ступінчастий вигляд'; badge.className = 'pill mid'; }
    else { badge.textContent = 'ще не ступінчастий'; badge.className = 'pill'; }
  }
  function syncOp() {
    var o = opS.value; jS.parentElement.hidden = o === 'scale'; kI.parentElement.hidden = o === 'swap';
    document.getElementById('jlab').textContent = o === 'swap' ? 'з' : 'додати k ×';
  }
  function apply() {
    msg.textContent = '';
    if (!read()) { msg.textContent = 'Виправте клітинки: допустимі 3, −2, 7/3, 0,5.'; return; }
    var o = opS.value, i = +iS.value, j = +jS.value, k = F.parse(kI.value), txt;
    if (o !== 'scale' && i === j) { msg.textContent = 'Оберіть два різні рядки.'; return; }
    if (o !== 'swap' && !k) { msg.textContent = 'Введіть число k.'; return; }
    if (o === 'scale' && k.isZero()) { msg.textContent = 'Множити рядок на 0 не можна: це не елементарне перетворення.'; return; }
    hist.push(Mx.map(function (r) { return r.slice(); }));
    if (o === 'swap') { var t = Mx[i]; Mx[i] = Mx[j]; Mx[j] = t; txt = Rn(i) + ' ↔ ' + Rn(j); }
    else if (o === 'scale') { Mx[i] = Mx[i].map(function (x) { return x.mul(k); }); txt = Rn(i) + ' → ' + (k.d === 1 ? k.toString() : '(' + k + ')') + '·' + Rn(i); }
    else {
      Mx[i] = Mx[i].map(function (x, c) { return x.add(k.mul(Mx[j][c])); });
      var ak = k.n < 0 ? k.neg() : k, ks = ak.eq(1) ? '' : (ak.d === 1 ? ak.toString() : '(' + ak + ')');
      txt = Rn(i) + ' → ' + Rn(i) + (k.n < 0 ? ' − ' : ' + ') + ks + Rn(j);
    }
    write(); status();
    var li = document.createElement('li'); li.textContent = txt; logEl.appendChild(li);
  }
  document.getElementById('rapply').addEventListener('click', apply);
  document.getElementById('rundo').addEventListener('click', function () {
    if (!hist.length) return; Mx = hist.pop(); write(); status(); if (logEl.lastChild) logEl.removeChild(logEl.lastChild);
  });
  function reset(vals, r, c, aug) {
    rowsS.value = r; colsS.value = c; augC.checked = aug; hist = []; logEl.innerHTML = ''; msg.textContent = ''; build(vals);
  }
  var EX = {
    s3: [[[1, 1, 1, 6], [2, -1, 1, 3], [1, 2, -1, 2]], 3, 4, true],
    inc: [[[1, 2, -1, 1], [2, 3, 1, 4], [3, 5, 0, 6]], 3, 4, true],
    inf: [[[1, -1, 2, 3], [2, -1, 5, 8], [1, 0, 3, 5]], 3, 4, true],
    inv: [[[1, 2, 0, 1, 0, 0], [2, 5, 1, 0, 1, 0], [0, 1, 3, 0, 0, 1]], 3, 6, false],
    d4: [[[1, 2, 0, 1], [2, 5, 1, 3], [-1, 0, 4, 2], [3, 6, 1, 5]], 4, 4, false]
  };
  [].forEach.call(document.querySelectorAll('[data-ex]'), function (b) {
    b.addEventListener('click', function () { var e = EX[b.dataset.ex]; reset(e[0].map(function (r) { return r.map(String); }), e[1], e[2], e[3]); });
  });
  [rowsS, colsS, augC].forEach(function (e) { e.addEventListener('change', function () { hist = []; logEl.innerHTML = ''; build(Mx.map(function (r) { return r.map(function (x) { return x.toString().replace('−', '-'); }); })); }); });
  grid.addEventListener('input', status);
  opS.addEventListener('change', syncOp);
  syncOp();
  var e0 = EX.s3; reset(e0[0].map(function (r) { return r.map(String); }), e0[1], e0[2], e0[3]);
})();
