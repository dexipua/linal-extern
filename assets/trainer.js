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
    fb = document.getElementById('fb'), solEl = document.getElementById('sol'), statEl = document.getElementById('tstat');
  var keys = Object.keys(GEN), on = {}, cur = null, curKey = null, streak = 0, tried = false;
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
    statEl.innerHTML = '<span>Серія <b>' + streak + '</b></span><span>Рекорд <b>' + st.best + '</b></span><span>Правильно з першої спроби <b>' + ok + ' / ' + all + '</b></span>';
  }
  function next() {
    var act = keys.filter(function (k) { return on[k]; });
    curKey = act[ri(0, act.length - 1)]; cur = GEN[curKey].make(); tried = false;
    qEl.innerHTML = '<span class="eyebrow">' + GEN[curKey].name + '</span><div>' + cur.q + '</div>';
    var A = cur.ans, html;
    if (cur.labels) {
      html = cur.labels.map(function (l, i) { return '<label class="ans1">' + l + ' = <input id="a0_' + i + '" inputmode="text" autocomplete="off"></label>'; }).join('');
    } else if (A.length === 1 && A[0].length === 1) {
      html = '<label class="ans1">Відповідь <input id="a0_0" inputmode="text" autocomplete="off"></label>';
    } else {
      html = '<span class="M ansM" style="grid-template-columns:repeat(' + A[0].length + ',auto)">' +
        A.map(function (r, i) { return r.map(function (_, j) { return '<i><input id="a' + i + '_' + j + '" aria-label="рядок ' + (i + 1) + ', стовпець ' + (j + 1) + '" autocomplete="off"></i>'; }).join(''); }).join('') + '</span>';
    }
    inEl.innerHTML = html; fb.textContent = ''; fb.className = 'fb'; solEl.hidden = true; solEl.innerHTML = cur.sol;
    var f = inEl.querySelector('input'); if (f) f.focus({ preventScroll: true });
  }
  function check() {
    if (!cur) return;
    var A = cur.ans, ok = true, bad = false;
    A.forEach(function (r, i) {
      r.forEach(function (v, j) {
        var inp = document.getElementById('a' + i + '_' + j), x = F.parse(inp.value);
        if (!x) { bad = true; inp.classList.add('err'); return; }
        var good = x.eq(v); inp.classList.toggle('err', !good); inp.classList.toggle('okk', good); if (!good) ok = false;
      });
    });
    if (bad) { fb.textContent = 'Заповніть усі поля числами: 3, −2, 7/3 або 0,5.'; fb.className = 'fb no'; return; }
    var t = st.t[curKey] = st.t[curKey] || { ok: 0, all: 0 };
    if (!tried) { t.all++; if (ok) t.ok++; }
    if (ok) {
      if (!tried) { streak++; if (streak > st.best) st.best = streak; }
      fb.textContent = tried ? 'Тепер правильно.' : 'Правильно!'; fb.className = 'fb yes';
    } else { streak = 0; fb.textContent = 'Є помилка: неправильні клітинки підсвічено. Спробуйте ще раз або подивіться розв\'язок.'; fb.className = 'fb no'; }
    tried = true; save(); stats();
  }
  document.getElementById('btn-check').addEventListener('click', check);
  document.getElementById('btn-next').addEventListener('click', next);
  document.getElementById('btn-sol').addEventListener('click', function () { solEl.hidden = !solEl.hidden; if (!tried) { tried = true; streak = 0; stats(); } });
  inEl.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); check(); } });
  stats(); next();

  /* ---------- flashcards ---------- */
  var CARDS = [
    ['Коли СЛАР несумісна?', 'Коли після зведення з\'являється рядок 0 … 0 | c, c ≠ 0.'],
    ['Скільки вільних змінних у сумісної системи з n невідомими і рангом r?', 'n − r.'],
    ['Коли однорідна квадратна система має нетривіальні розв\'язки?', 'Коли det A = 0 (ранг &lt; n).'],
    ['Правило Крамера', 'xⱼ = Δⱼ / Δ, де Δⱼ — det A з j-м стовпцем, заміненим на b. Працює лише при Δ ≠ 0.'],
    ['Які елементарні перетворення рядків дозволені?', 'Обмін рядків; множення рядка на число ≠ 0; додавання до рядка кратного іншого.'],
    ['Розмір добутку (m×n)(n×p)', 'm×p. Внутрішні розміри мають збігатися.'],
    ['(AB)ᵀ = ?', 'BᵀAᵀ.'],
    ['(AB)⁻¹ = ?', 'B⁻¹A⁻¹.'],
    ['(A + B)² = ?', 'A² + AB + BA + B², а не A² + 2AB + B².'],
    ['Як записати Ax через стовпці A?', 'x₁a₁ + x₂a₂ + … + xₙaₙ.'],
    ['Що робить DA для діагональної D?', 'Масштабує рядки A. AD масштабує стовпці.'],
    ['Три умови підпростору', '0 ∈ W; a + b ∈ W; λa ∈ W.'],
    ['Як швидко перевірити лінійну залежність n векторів у ℝⁿ?', 'det матриці з них = 0 ⇔ залежні.'],
    ['Симетрична / кососиметрична матриця', 'S = Sᵀ; K = −Kᵀ (на діагоналі нулі).'],
    ['det 2×2', 'ad − bc.'],
    ['det(kA) для A n×n', 'kⁿ·det A.'],
    ['det(AB)', 'det A · det B.'],
    ['Як впливає обмін двох рядків на det?', 'Змінює знак.'],
    ['Як впливає додавання до рядка кратного іншого на det?', 'Ніяк.'],
    ['det трикутної матриці', 'Добуток діагональних елементів.'],
    ['Геометричний зміст |det A| для 2×2', 'У скільки разів змінюються площі. det &lt; 0 — орієнтація змінюється.'],
    ['Обернена до [[a, b], [c, d]]', '(1/(ad − bc))·[[d, −b], [−c, a]].'],
    ['Як знайти A⁻¹ методом Жордана–Гаусса?', '[A | I] → [I | A⁻¹]. Нульовий рядок зліва означає, що A вироджена.'],
    ['AX = B ⇒ X = ?', 'A⁻¹B (обернена зліва).'],
    ['XA = B ⇒ X = ?', 'BA⁻¹ (обернена справа).'],
    ['Критерій невиродженості', 'det ≠ 0 ⇔ A⁻¹ існує ⇔ rank = n ⇔ стовпці незалежні ⇔ Ax = 0 має лише x = 0.'],
    ['Що є стовпцями матриці перетворення?', 'Образи базисних векторів e₁, e₂.'],
    ['Матриця повороту на φ', '[[cos φ, −sin φ], [sin φ, cos φ]], det = 1.'],
    ['Матриця «спочатку A, потім B»', 'B·A.'],
    ['R(φ)⁻¹ = ?', 'R(−φ) = R(φ)ᵀ.'],
    ['Симетрія відносно y = x', '[[0, 1], [1, 0]], det = −1.'],
    ['Чому проєкція не має оберненої?', 'det = 0: різні точки мають однаковий образ.'],
    ['cos і sin 30°, 45°, 60°', '30°: √3/2, 1/2; 45°: √2/2, √2/2; 60°: 1/2, √3/2.']
  ];
  var deck, fc = document.getElementById('card'), fq = document.getElementById('fq'), fa = document.getElementById('fa'), fleft = document.getElementById('fleft');
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = ri(0, i), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function deal() { deck = shuffle(CARDS.slice()); showCard(); }
  function showCard() {
    fc.classList.remove('flip');
    if (!deck.length) { fq.innerHTML = 'Колоду пройдено!'; fa.innerHTML = 'Натисніть «Перемішати», щоб почати знову.'; fleft.textContent = '0'; return; }
    fq.innerHTML = deck[0][0]; fa.innerHTML = deck[0][1]; fleft.textContent = deck.length;
  }
  fc.addEventListener('click', function () { if (deck.length) fc.classList.toggle('flip'); });
  fc.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); fc.click(); } });
  document.getElementById('f-know').addEventListener('click', function () { if (deck.length) { deck.shift(); showCard(); } });
  document.getElementById('f-again').addEventListener('click', function () { if (deck.length) { deck.push(deck.shift()); showCard(); } });
  document.getElementById('f-shuffle').addEventListener('click', deal);
  deal();
})();
