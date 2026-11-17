(function () {
  'use strict';
  var F = window.F;
  var KEY = 'linal-trainer';
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
  var st = load(); st.t = st.t || {}; st.best = st.best || 0;

  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function nz(a, b) { var v; do { v = ri(a, b); } while (v === 0); return v; }
  function mat(r, c, a, b) { var M = []; for (var i = 0; i < r; i++) { M.push([]); for (var j = 0; j < c; j++) M[i].push(ri(a, b)); } return M; }
  function cell(x) { return x instanceof F ? x.html() : (x < 0 ? '−' + (-x) : String(x)); }
  function M(A, bar) {
    var c = A[0].length + (bar ? 1 : 0);
    return '<span class="M" style="grid-template-columns:repeat(' + c + ',auto)">' + A.map(function (r) {
      return r.map(function (x, j) { return (bar && j === r.length - 1 ? '<i class="s"></i>' : '') + '<i>' + cell(x) + '</i>'; }).join('');
    }).join('') + '</span>';
  }
  function V(v) { return '(' + v.map(cell).join(', ') + ')'; }
  function sgn(x) { return x < 0 ? ' − ' + (-x) : ' + ' + x; }
  function lin(coefs, vars) {
    var s = '';
    coefs.forEach(function (c, i) {
      if (c === 0) return;
      var a = Math.abs(c), t = (a === 1 ? '' : a) + vars[i];
      s += s ? (c < 0 ? ' − ' : ' + ') + t : (c < 0 ? '−' : '') + t;
    });
    return s || '0';
  }
  function F2(A) { return A.map(function (r) { return r.map(F.of); }); }

  var ROT = [
    ['поворот на 90°', [[0, -1], [1, 0]]], ['поворот на 180°', [[-1, 0], [0, -1]]], ['поворот на 270°', [[0, 1], [-1, 0]]],
    ['симетрія відносно Ox', [[1, 0], [0, -1]]], ['симетрія відносно Oy', [[-1, 0], [0, 1]]],
    ['симетрія відносно y = x', [[0, 1], [1, 0]]], ['симетрія відносно y = −x', [[0, -1], [-1, 0]]],
    ['розтяг ×2 вздовж Ox', [[2, 0], [0, 1]]], ['проєкція на Ox', [[1, 0], [0, 0]]]
  ];

  var GEN = {
    det2: { name: 'det 2×2', make: function () {
      var A = mat(2, 2, -6, 6), d = A[0][0] * A[1][1] - A[0][1] * A[1][0];
      return { q: 'Обчисліть визначник ' + M(A), ans: [[new F(d)]],
        sol: 'ad − bc = ' + cell(A[0][0]) + '·' + cell(A[1][1]) + ' − ' + '(' + cell(A[0][1]) + ')·(' + cell(A[1][0]) + ') = ' + d };
    } },
    det3: { name: 'det 3×3', make: function () {
      var A = mat(3, 3, -3, 4), a = A;
      var p = [a[0][0] * a[1][1] * a[2][2], a[0][1] * a[1][2] * a[2][0], a[0][2] * a[1][0] * a[2][1]];
      var m = [a[0][2] * a[1][1] * a[2][0], a[0][1] * a[1][0] * a[2][2], a[0][0] * a[1][2] * a[2][1]];
      var d = p[0] + p[1] + p[2] - m[0] - m[1] - m[2];
      return { q: 'Обчисліть визначник ' + M(A), ans: [[new F(d)]],
        sol: 'Саррюс: (' + p.map(cell).join(' + ') + ') − (' + m.map(cell).join(' + ') + ') = ' + (p[0] + p[1] + p[2]) + ' − (' + (m[0] + m[1] + m[2]) + ') = <b>' + d + '</b>' };
    } },
    inv2: { name: 'обернена 2×2', make: function () {
      var A, d;
      do { A = mat(2, 2, -5, 5); d = A[0][0] * A[1][1] - A[0][1] * A[1][0]; } while ([1, -1, 2, -2].indexOf(d) < 0);
      var I = [[new F(A[1][1], d), new F(-A[0][1], d)], [new F(-A[1][0], d), new F(A[0][0], d)]];
      return { q: 'Знайдіть обернену до ' + M(A) + '. Дроби пишіть як 3/2.', ans: I,
        sol: 'det = ' + d + '; A⁻¹ = (1/' + cell(d) + ')·' + M([[A[1][1], -A[0][1]], [-A[1][0], A[0][0]]]) + ' = ' + M(I) };
    } },
    sle2: { name: 'СЛАР 2×2', make: function () {
      var A, d, x = [ri(-5, 5), ri(-5, 5)];
      do { A = mat(2, 2, -5, 5); d = A[0][0] * A[1][1] - A[0][1] * A[1][0]; } while (d === 0 || A[0][0] === 0);
      var b = A.map(function (r) { return r[0] * x[0] + r[1] * x[1]; });
      var dx = b[0] * A[1][1] - A[0][1] * b[1], dy = A[0][0] * b[1] - b[0] * A[1][0];
      return { q: 'Розв\'яжіть: <span class="sys">' + A.map(function (r, i) { return lin(r, ['x', 'y']) + ' = ' + cell(b[i]); }).join('<br>') + '</span>',
        ans: [[new F(x[0]), new F(x[1])]], labels: ['x', 'y'],
        sol: 'Крамер: Δ = ' + d + ', Δₓ = ' + dx + ', Δ_y = ' + dy + ' ⇒ x = ' + x[0] + ', y = ' + x[1] };
    } },
    sle3: { name: 'СЛАР 3×3', make: function () {
      var A, d, x = [ri(-3, 3), ri(-3, 3), ri(-3, 3)];
      do { A = mat(3, 3, -3, 3); d = F.det(A); } while (d.isZero() || Math.abs(d.n) > 30);
      var b = A.map(function (r) { return r[0] * x[0] + r[1] * x[1] + r[2] * x[2]; });
      var aug = A.map(function (r, i) { return r.concat([b[i]]); });
      return { q: 'Розв\'яжіть методом Гаусса: ' + M(aug, true), ans: [[new F(x[0]), new F(x[1]), new F(x[2])]], labels: ['x', 'y', 'z'],
        sol: 'det A = ' + d + ' ≠ 0, розв\'язок єдиний: (' + x.join(', ') + '). Перевірте підстановкою в кожне рівняння.' };
    } },
    mul: { name: 'добуток матриць', make: function () {
      var shapes = [[2, 2, 2], [2, 3, 2], [3, 2, 2], [2, 2, 1], [2, 3, 1]], s = shapes[ri(0, shapes.length - 1)];
      var A = mat(s[0], s[1], -3, 4), B = mat(s[1], s[2], -3, 4), C = F.matmul(A, B);
      return { q: 'Обчисліть добуток ' + M(A) + '·' + M(B), ans: C,
        sol: 'Розмір ' + s[0] + '×' + s[1] + ' · ' + s[1] + '×' + s[2] + ' = ' + s[0] + '×' + s[2] + '. c₁₁ = (рядок 1 A)·(стовпець 1 B) = ' +
          A[0].map(function (a, k) { return cell(a) + '·' + cell(B[k][0]); }).join(' + ') + ' = ' + C[0][0] + '. Відповідь: ' + M(C) };
    } },
    geom: { name: 'образ точки', make: function () {
      var t = ROT[ri(0, ROT.length - 1)], p = [nz(-5, 5), nz(-5, 5)], A = t[1];
      var r = [A[0][0] * p[0] + A[0][1] * p[1], A[1][0] * p[0] + A[1][1] * p[1]];
      return { q: 'Куди переходить точка ' + V(p) + ' під дією перетворення «' + t[0] + '»?', ans: [[new F(r[0]), new F(r[1])]], labels: ['x′', 'y′'],
        sol: 'Матриця ' + M(A) + ', добуток з ' + V(p) + ' дає ' + V(r) + '.' };
    } },
    comp: { name: 'композиція', make: function () {
      var i = ri(0, 6), j; do { j = ri(0, 6); } while (j === i);
      var a = ROT[i], b = ROT[j], C = F.matmul(b[1], a[1]);
      return { q: 'Знайдіть матрицю перетворення: спочатку «' + a[0] + '», потім «' + b[0] + '».', ans: C,
        sol: '«Спочатку A, потім B» = B·A = ' + M(b[1]) + '·' + M(a[1]) + ' = ' + M(C) };
    } },
    prop: { name: 'властивості det', make: function () {
      var n = ri(2, 3), d = nz(-5, 5), k = [2, 3, -1, -2][ri(0, 3)], kind = ri(0, 3), q, ans, sol;
      var pk = Math.pow(k, n);
      if (kind === 0) { q = 'det(' + k + 'A)'; ans = new F(pk * d); sol = 'det(kA) = kⁿ det A = (' + k + ')' + (n === 2 ? '²' : '³') + '·' + cell(d) + ' = ' + ans; }
      else if (kind === 1) { q = 'det(A⁻¹)'; ans = new F(1, d); sol = 'det A⁻¹ = 1/det A = ' + ans; }
      else if (kind === 2) { q = 'det(' + k + 'Aᵀ)'; ans = new F(pk * d); sol = 'det Aᵀ = det A, далі kⁿ: ' + ans; }
      else { q = 'det(A²)'; ans = new F(d * d); sol = 'det(A²) = (det A)² = ' + ans; }
      return { q: 'A — матриця ' + n + '×' + n + ', det A = ' + cell(d) + '. Знайдіть ' + q + '.', ans: [[ans]], sol: sol };
    } }
  };

  /* ---------- trainer UI ---------- */
  var box = document.getElementById('drill'); if (!box) return;
  var chips = document.getElementById('topics'), qEl = document.getElementById('q'), inEl = document.getElementById('inputs'),
    fb = document.getElementById('fb'), solEl = document.getElementById('sol'), statEl = document.getElementById('tstat'),
    bCheck = document.getElementById('btn-check'), bSol = document.getElementById('btn-sol'), bNext = document.getElementById('btn-next'),
    exBar = document.getElementById('exbar'), exRes = document.getElementById('exres'), bExam = document.getElementById('btn-exam');
  var keys = Object.keys(GEN), on = {}, cur = null, curKey = null, streak = 0, tried = false, exam = null;
  keys.forEach(function (k) {
    on[k] = true;
    var b = document.createElement('button'); b.type = 'button'; b.id = 'tp-' + k; b.textContent = GEN[k].name; b.setAttribute('aria-pressed', 'true');
    b.addEventListener('click', function () {
      var cnt = keys.filter(function (x) { return on[x]; }).length;
      if (on[k] && cnt === 1) return;
      on[k] = !on[k]; b.setAttribute('aria-pressed', on[k] ? 'true' : 'false');
    });
    chips.appendChild(b);
  });
  function stats() {
    var ok = 0, all = 0; keys.forEach(function (k) { var t = st.t[k]; if (t) { ok += t.ok; all += t.all; } });
    statEl.innerHTML = '<span>Серія <b>' + streak + '</b></span><span>Рекорд <b>' + st.best + '</b></span><span>Правильно з першої спроби <b>' + ok + ' / ' + all + '</b></span>' +
      (st.exam ? '<span>Найкращий міні-тест <b>' + st.exam + ' / 10</b></span>' : '');
  }
  function next() {
    var act = keys.filter(function (k) { return on[k]; });
    curKey = act[ri(0, act.length - 1)]; cur = GEN[curKey].make(); tried = false;
    qEl.innerHTML = '<span class="eyebrow">' + (exam ? 'Задача ' + (exam.i + 1) + ' з 10 · ' : '') + GEN[curKey].name + '</span><div>' + cur.q + '</div>';
    var A = cur.ans, html;
    if (cur.labels) {
      html = cur.labels.map(function (l, i) { return '<label class="ans1">' + l + ' = <input id="a0_' + i + '" autocomplete="off"></label>'; }).join('');
    } else if (A.length === 1 && A[0].length === 1) {
      html = '<label class="ans1">Відповідь <input id="a0_0" autocomplete="off"></label>';
    } else {
      html = '<span class="M ansM" style="grid-template-columns:repeat(' + A[0].length + ',auto)">' +
        A.map(function (r, i) { return r.map(function (_, j) { return '<i><input id="a' + i + '_' + j + '" aria-label="рядок ' + (i + 1) + ', стовпець ' + (j + 1) + '" autocomplete="off"></i>'; }).join(''); }).join('') + '</span>';
    }
    inEl.innerHTML = html; fb.textContent = ''; fb.className = 'fb'; solEl.hidden = true; solEl.innerHTML = cur.sol;
    var f = inEl.querySelector('input'); if (f) f.focus({ preventScroll: true });
  }
  function grade(mark) {
    var A = cur.ans, ok = true, bad = false;
    A.forEach(function (r, i) {
      r.forEach(function (v, j) {
        var inp = document.getElementById('a' + i + '_' + j), x = F.parse(inp.value);
        if (!x) { bad = true; ok = false; if (mark) inp.classList.add('err'); return; }
        var good = x.eq(v); if (!good) ok = false;
        if (mark) { inp.classList.toggle('err', !good); inp.classList.toggle('okk', good); }
      });
    });
    return { ok: ok, bad: bad };
  }
  function check() {
    if (!cur) return;
    if (exam) { examAnswer(); return; }
    var g = grade(true);
    if (g.bad) { fb.textContent = 'Заповніть усі поля числами: 3, −2, 7/3 або 0,5.'; fb.className = 'fb no'; return; }
    var t = st.t[curKey] = st.t[curKey] || { ok: 0, all: 0 };
    if (!tried) { t.all++; if (g.ok) t.ok++; }
    if (g.ok) {
      if (!tried) { streak++; if (streak > st.best) st.best = streak; }
      fb.textContent = tried ? 'Тепер правильно. Enter — наступна.' : 'Правильно! Enter — наступна.'; fb.className = 'fb yes';
    } else { streak = 0; fb.textContent = 'Є помилка: неправильні клітинки підсвічено. Спробуйте ще раз або подивіться розв\'язок.'; fb.className = 'fb no'; }
    tried = true; save(); stats();
  }

  /* ---------- mini-test ---------- */
  function fmtT(s) { var m = Math.floor(s / 60), x = s % 60; return (m < 10 ? '0' : '') + m + ':' + (x < 10 ? '0' : '') + x; }
  function startExam() {
    exam = { i: 0, res: [], left: 900 };
    box.classList.add('exam'); exRes.hidden = true; bSol.hidden = true; bNext.textContent = 'Пропустити →'; bCheck.textContent = 'Відповісти';
    bExam.textContent = 'Завершити міні-тест';
    exBar.hidden = false; tick();
    exam.iv = setInterval(function () { exam.left--; tick(); if (exam.left <= 0) finishExam(); }, 1000);
    next();
  }
  function tick() {
    exBar.innerHTML = '<span>Міні-тест</span><span>Задача <b>' + Math.min(exam.i + 1, 10) + ' / 10</b></span><span>Залишилось <b class="' + (exam.left <= 120 ? 'low' : '') + '">' + fmtT(exam.left) + '</b></span>' +
      '<span class="dots">' + exam.res.map(function (r) { return '<i class="' + (r.ok ? 'y' : 'n') + '"></i>'; }).join('') + '</span>';
  }
  function examAnswer(skip) {
    var g = skip ? { ok: false } : grade(false);
    exam.res.push({ q: cur.q, sol: cur.sol, ok: g.ok, name: GEN[curKey].name, skip: !!skip });
    exam.i++;
    if (exam.i >= 10) finishExam(); else { tick(); next(); }
  }
  function finishExam() {
    if (!exam) return;
    clearInterval(exam.iv);
    var res = exam.res, score = res.filter(function (r) { return r.ok; }).length, used = 900 - exam.left;
    if (score > (st.exam || 0)) st.exam = score; save();
    var verdict = score >= 9 ? 'Відмінно: ви готові до тесту.' : score >= 7 ? 'Добре. Перегляньте помилки нижче.' : score >= 5 ? 'Непогано, але варто ще потренуватися на темах з помилками.' : 'Поверніться до конспекту й задач цих тем, а потім спробуйте ще раз.';
    exRes.innerHTML = '<h3>Результат: ' + score + ' / 10 · час ' + fmtT(used) + '</h3><p>' + verdict + '</p><ol>' +
      res.map(function (r) { return '<li class="' + (r.ok ? 'y' : 'n') + '"><b>' + (r.ok ? '✓' : r.skip ? '— пропущено' : '✗') + '</b> <span class="mut">' + r.name + '</span><div>' + r.q + '</div>' + (r.ok ? '' : '<div class="sol">' + r.sol + '</div>') + '</li>'; }).join('') +
      (res.length < 10 ? '<li class="n"><b>Час вийшов</b> до задачі ' + (res.length + 1) + '.</li>' : '') + '</ol>';
    exRes.hidden = false; exam = null; box.classList.remove('exam'); exBar.hidden = true;
    bSol.hidden = false; bNext.textContent = 'Наступна →'; bCheck.textContent = 'Перевірити'; bExam.textContent = 'Міні-тест: 10 задач за 15 хв';
    stats(); next();
    exRes.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  bExam.addEventListener('click', function () { if (exam) finishExam(); else startExam(); });

  bCheck.addEventListener('click', check);
  bNext.addEventListener('click', function () { if (exam) examAnswer(true); else next(); });
  bSol.addEventListener('click', function () { solEl.hidden = !solEl.hidden; if (!tried) { tried = true; streak = 0; stats(); } });
  inEl.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return; e.preventDefault();
    if (!exam && fb.classList.contains('yes')) next(); else check();
  });
  stats(); next();

  /* ---------- flashcards ---------- */
  var CARDS = window.CARDS || [], TOP = window.CARD_TOPICS || {}, UKEY = 'linal-cards-unknown';
  CARDS.forEach(function (c, i) { c.id = i; });
  var unk = {}; try { unk = JSON.parse(localStorage.getItem(UKEY) || '{}') || {}; } catch (e) { unk = {}; }
  function saveUnk() { try { localStorage.setItem(UKEY, JSON.stringify(unk)); } catch (e) {} }
  var deck = [], round = [], knownN = 0, noIds = [], ftop = 'all',
    fc = document.getElementById('card'), fq = document.getElementById('fq'), fa = document.getElementById('fa'), fe = document.getElementById('fe'),
    fleft = document.getElementById('fleft'), fprog = document.getElementById('fprog'), fend = document.getElementById('fend'),
    bShow = document.getElementById('f-show'), bKnow = document.getElementById('f-know'), bNo = document.getElementById('f-no'),
    ftopics = document.getElementById('ftopics'), flash = fc.parentElement, frow = document.getElementById('frow');
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = ri(0, i), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function unkCount() { return Object.keys(unk).length; }
  function renderChips() {
    var tb = [['all', 'Усі', CARDS.length]].concat(Object.keys(TOP).map(function (k) { return [k, TOP[k], CARDS.filter(function (c) { return c.t === k; }).length]; }));
    tb.push(['unk', 'Мої «не знаю»', unkCount()]);
    ftopics.innerHTML = tb.map(function (t) {
      return '<button type="button" id="ft-' + t[0] + '" data-t="' + t[0] + '" aria-pressed="' + (t[0] === ftop) + '"' + (t[0] === 'unk' && !t[2] ? ' disabled' : '') + '>' + t[1] + ' <span class="mut">' + t[2] + '</span></button>';
    }).join('');
  }
  ftopics.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b || b.disabled) return;
    ftop = b.dataset.t; startRound(pool());
  });
  function pool() {
    return CARDS.filter(function (c) { return ftop === 'all' || (ftop === 'unk' ? unk[c.id] : c.t === ftop); });
  }
  function startRound(cards) {
    if (!cards.length && ftop === 'unk') { ftop = 'all'; cards = pool(); }
    round = cards.slice(); deck = shuffle(cards.slice()); knownN = 0; noIds = [];
    fend.hidden = true; flash.hidden = false; frow.hidden = false; renderChips(); showCard();
  }
  function setRevealed(on) { fc.classList.toggle('flip', on); bShow.hidden = on; bKnow.hidden = !on; bNo.hidden = !on; }
  function progress() {
    var done = round.length - deck.length;
    fprog.style.width = (100 * done / Math.max(1, round.length)) + '%';
    fleft.innerHTML = 'Картка ' + Math.min(done + 1, round.length) + ' з ' + round.length + ' · <span class="ok-t">знаю ' + knownN + '</span> · <span class="no-t">не знаю ' + noIds.length + '</span>';
  }
  function showCard() {
    progress();
    if (!deck.length) { finish(); return; }
    var c = deck[0];
    fq.innerHTML = '<small>' + TOP[c.t] + (unk[c.id] ? ' · ви позначали «не знаю»' : '') + '</small>' + c.q; fa.innerHTML = c.a; fe.innerHTML = c.e || '';
    setRevealed(false);
  }
  function finish() {
    flash.hidden = true; frow.hidden = true; fend.hidden = false;
    var n = noIds.length, total = round.length;
    fend.innerHTML = '<h3>Колоду пройдено</h3><p>Знаю <b class="ok-t">' + knownN + '</b> з ' + total + ', не знаю <b class="no-t">' + n + '</b>.' +
      (n ? '' : ' Чудово, усі картки цього набору засвоєно!') + '</p><div class="row">' +
      (n ? '<button class="btn" type="button" id="f-redo-no">Пройти ті, що не знаю (' + n + ')</button>' : '') +
      '<button class="btn' + (n ? ' ghost' : '') + '" type="button" id="f-redo-all">Пройти всі картки набору (' + pool().length + ')</button>' +
      (n ? '<button class="btn ghost" type="button" id="f-show-no">Показати їх списком</button>' : '') + '</div><div id="f-nolist"></div>';
    var redoNo = document.getElementById('f-redo-no');
    if (redoNo) redoNo.addEventListener('click', function () { var ids = noIds.slice(); startRound(CARDS.filter(function (c) { return ids.indexOf(c.id) >= 0; })); });
    document.getElementById('f-redo-all').addEventListener('click', function () { startRound(pool()); });
    var sl = document.getElementById('f-show-no');
    if (sl) sl.addEventListener('click', function () {
      document.getElementById('f-nolist').innerHTML = '<dl class="flist">' + CARDS.filter(function (c) { return noIds.indexOf(c.id) >= 0; }).map(function (c) {
        return '<dt>' + c.q + '</dt><dd><b>' + c.a + '</b>' + (c.e ? '<br><span class="mut">' + c.e + '</span>' : '') + '</dd>';
      }).join('') + '</dl>';
      sl.hidden = true;
    });
    renderChips();
  }
  function reveal() { if (deck.length) setRevealed(true); }
  function know() {
    if (!deck.length || !fc.classList.contains('flip')) return;
    var c = deck.shift(); knownN++; if (unk[c.id]) { delete unk[c.id]; saveUnk(); } showCard();
  }
  function dunno() {
    if (!deck.length || !fc.classList.contains('flip')) return;
    var c = deck.shift(); noIds.push(c.id); unk[c.id] = 1; saveUnk(); showCard();
  }
  fc.addEventListener('click', function () { if (!deck.length) return; if (fc.classList.contains('flip')) setRevealed(false); else reveal(); });
  bShow.addEventListener('click', reveal); bKnow.addEventListener('click', know); bNo.addEventListener('click', dunno);
  document.getElementById('f-shuffle').addEventListener('click', function () { startRound(pool()); });
  document.addEventListener('keydown', function (e) {
    var tag = (e.target.tagName || '').toLowerCase(); if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
    var r = fc.getBoundingClientRect(); if (flash.hidden || r.bottom < 0 || r.top > innerHeight) return;
    if (e.key === ' ') { e.preventDefault(); if (fc.classList.contains('flip')) setRevealed(false); else reveal(); }
    else if (e.key === '1') know(); else if (e.key === '2') dunno();
  });
  startRound(pool());

  /* full list */
  var list = document.getElementById('flist');
  if (list) list.innerHTML = Object.keys(TOP).map(function (k) {
    return '<h3>' + TOP[k] + '</h3><dl>' + CARDS.filter(function (c) { return c.t === k; }).map(function (c) {
      return '<dt>' + c.q + '</dt><dd><b>' + c.a + '</b>' + (c.e ? '<br><span class="mut">' + c.e + '</span>' : '') + '</dd>';
    }).join('') + '</dl>';
  }).join('');
})();
