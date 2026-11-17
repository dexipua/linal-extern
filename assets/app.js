(function () {
  'use strict';
  var KEY_P = 'linal-done', KEY_T = 'linal-tests';
  function load(k) { try { return JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) { return {}; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

  /* matrices: "a b; c d", "¦" = augmented bar, "p/q" = fraction */
  $$('.M').forEach(function (e) {
    if (e.children.length) return; /* already structured (inputs, generated markup) */
    var rows = e.textContent.split(';').map(function (r) { return r.trim().split(/\s+/); });
    var n = Math.max.apply(null, rows.map(function (r) { return r.length; }));
    e.style.gridTemplateColumns = 'repeat(' + n + ',auto)';
    e.innerHTML = rows.map(function (r) {
      return r.map(function (c) {
        if (c === '¦') return '<i class="s"></i>';
        var m = c.match(/^(-?[\d√]+)\/(\d+)$/);
        if (m) return '<i><span class="fr"><b>' + m[1].replace('-', '−') + '</b><b>' + m[2] + '</b></span></i>';
        return '<i>' + c.replace(/^-/, '−') + '</i>';
      }).join('');
    }).join('');
  });

  /* sticky offsets follow the real header height */
  var top = document.querySelector('.top');
  function setTop() {
    if (!top) return;
    var h = getComputedStyle(top).position === 'sticky' ? top.offsetHeight : 0;
    document.documentElement.style.setProperty('--toph', h + 'px');
  }
  setTop(); window.addEventListener('resize', setTop);

  /* ---------- problems ---------- */
  var LV = { 1: ['lv1', '● базова'], 2: ['lv2', '◆ основна'], 3: ['lv3', '▲ складна'] };
  var done = load(KEY_P);
  var ps = $$('.problems .p');
  if (ps.length) {
    ps.forEach(function (p) {
      var h = p.querySelector('.ph'), n = h.querySelector('.n'), num = n.textContent, l = p.dataset.l;
      var s = document.createElement('span'); s.className = 'lv ' + LV[l][0]; s.textContent = LV[l][1]; n.after(s);
      var lab = document.createElement('label');
      lab.innerHTML = '<input type="checkbox" id="c' + num.replace('.', '_') + '"> розв\'язано';
      h.appendChild(lab);
      var cb = lab.querySelector('input');
      cb.checked = !!done[num]; p.classList.toggle('done', cb.checked);
      cb.addEventListener('change', function () {
        if (cb.checked) done[num] = 1; else delete done[num];
        p.classList.toggle('done', cb.checked); save(KEY_P, done); upd(); filt();
      });
    });
    var upd = function () {
      var c = ps.filter(function (p) { return p.classList.contains('done'); }).length;
      document.getElementById('cnt').textContent = c + ' / ' + ps.length;
      document.getElementById('pb').style.width = (100 * c / ps.length) + '%';
      $$('.bp').forEach(function (b) {
        var blk = b.dataset.b, all = ps.filter(function (p) { return p.querySelector('.n').textContent.split('.')[0] === blk; });
        var d = all.filter(function (p) { return p.classList.contains('done'); }).length;
        b.textContent = d + ' / ' + all.length;
      });
    };
    var lvl = '0', srch = document.getElementById('psearch'), unsolved = document.getElementById('punsolved'), empty = document.getElementById('pempty');
    function norm(s) { return s.toLowerCase().replace(/[’']/g, '\''); }
    ps.forEach(function (p) { p._txt = norm(p.textContent.replace(/Відповідь[\s\S]*$/, '')); });
    function filt() {
      var q = srch ? norm(srch.value.trim()) : '', un = unsolved && unsolved.checked, shown = 0;
      ps.forEach(function (p) {
        var vis = (lvl === '0' || p.dataset.l === lvl) && (!un || !p.classList.contains('done')) && (!q || p._txt.indexOf(q) >= 0);
        p.classList.toggle('hidden-lv', !vis); if (vis) shown++;
      });
      $$('.problems h3.grp').forEach(function (h) {
        var n = h.nextElementSibling, any = false;
        while (n && n.tagName === 'ARTICLE') { if (!n.classList.contains('hidden-lv')) any = true; n = n.nextElementSibling; }
        h.classList.toggle('hidden-lv', !any);
      });
      if (empty) empty.hidden = shown > 0;
    }
    upd();
    var bs = $$('.filt button');
    bs.forEach(function (b) {
      b.addEventListener('click', function () {
        lvl = b.dataset.f;
        bs.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        filt();
      });
    });
    if (srch) srch.addEventListener('input', filt);
    if (unsolved) unsolved.addEventListener('change', filt);
    var rnd = document.getElementById('prandom');
    if (rnd) rnd.addEventListener('click', function () {
      var pool = ps.filter(function (p) { return !p.classList.contains('hidden-lv') && !p.classList.contains('done'); });
      if (!pool.length) pool = ps.filter(function (p) { return !p.classList.contains('hidden-lv'); });
      if (!pool.length) return;
      var p = pool[Math.floor(Math.random() * pool.length)];
      $$('.p.flash-hl').forEach(function (x) { x.classList.remove('flash-hl'); });
      p.scrollIntoView({ behavior: 'smooth', block: 'center' }); p.classList.add('flash-hl');
      setTimeout(function () { p.classList.remove('flash-hl'); }, 2400);
    });
  }

  /* ---------- tests ---------- */
  var scores = load(KEY_T);
  $$('.test').forEach(function (t) {
    var out = t.querySelector('.timer output'), go = t.querySelector('[data-act="go"]'),
      rs = t.querySelector('[data-act="reset"]'), rev = t.querySelector('[data-act="reveal"]');
    var left = 3600, iv = null;
    function show() {
      var m = Math.floor(left / 60), s = left % 60;
      out.textContent = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
      out.classList.toggle('low', left <= 600);
    }
    function stop() { clearInterval(iv); iv = null; go.textContent = left === 3600 ? 'Старт' : 'Продовжити'; }
    go.addEventListener('click', function () {
      if (iv) { stop(); return; }
      go.textContent = 'Пауза';
      iv = setInterval(function () {
        left--; show();
        if (left <= 0) { stop(); go.textContent = 'Час вийшов'; t.classList.remove('locked'); }
      }, 1000);
    });
    rs.addEventListener('click', function () { stop(); left = 3600; show(); go.textContent = 'Старт'; });
    rev.addEventListener('click', function () {
      t.classList.toggle('locked');
      rev.textContent = t.classList.contains('locked') ? 'Показати відповіді' : 'Сховати відповіді';
    });
    show();

    var inputs = $$('input[data-max]', t), sum = t.querySelector('.score b');
    function total() {
      var s = 0; inputs.forEach(function (i) { s += Math.min(+i.dataset.max, Math.max(0, +i.value || 0)); });
      sum.textContent = s + ' / 20';
    }
    inputs.forEach(function (i) {
      if (scores[i.id] != null) i.value = scores[i.id];
      i.addEventListener('input', function () {
        if (i.value === '') delete scores[i.id]; else scores[i.id] = +i.value;
        save(KEY_T, scores); total();
      });
    });
    total();
  });

  /* ---------- home dashboard ---------- */
  var meters = $$('[data-meter]');
  if (meters.length) {
    var all = 0, got = 0;
    meters.forEach(function (m) {
      var b = m.dataset.meter, tot = +m.dataset.total;
      var d = Object.keys(done).filter(function (k) { return k.split('.')[0] === b; }).length;
      all += tot; got += d;
      m.querySelector('b').style.width = (100 * d / tot) + '%';
      var lab = document.querySelector('[data-mlabel="' + b + '"]');
      if (lab) lab.textContent = d + ' з ' + tot + ' задач';
    });
    var el = document.getElementById('st-done'); if (el) el.textContent = got + ' / ' + all;
    [1, 2, 3].forEach(function (n) {
      var s = 0, any = false;
      Object.keys(scores).forEach(function (k) { if (k.indexOf('s' + n + '_') === 0) { s += scores[k]; any = true; } });
      var e = document.getElementById('st-t' + n); if (e) e.textContent = any ? s + ' / 20' : '—';
    });
  }

  /* ---------- material TOC scrollspy ---------- */
  var toc = $$('.toc a');
  if (toc.length && 'IntersectionObserver' in window) {
    var map = {};
    toc.forEach(function (a) { var id = a.getAttribute('href').slice(1); var s = document.getElementById(id); if (s) map[id] = a; });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { toc.forEach(function (a) { a.classList.remove('on'); }); map[e.target.id].classList.add('on'); }
      });
    }, { rootMargin: '-80px 0px -70% 0px' });
    Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
  }

  /* ---------- theme toggle: auto → light → dark ---------- */
  var THEMES = [['', 'Авто', 'Тема: як у системі'], ['light', 'Світла', 'Тема: світла'], ['dark', 'Темна', 'Тема: темна']];
  var tw = document.querySelector('.top .wrap');
  if (tw) {
    var tbtn = document.createElement('button'); tbtn.type = 'button'; tbtn.className = 'theme-btn'; tbtn.id = 'theme-btn';
    var cur = ''; try { cur = localStorage.getItem('linal-theme') || ''; } catch (e) {}
    function paint() {
      var t = THEMES.filter(function (x) { return x[0] === cur; })[0] || THEMES[0];
      tbtn.innerHTML = '<span aria-hidden="true">' + (cur === 'dark' ? '☾' : cur === 'light' ? '☀' : '◐') + '</span>'; tbtn.title = t[2];
      tbtn.setAttribute('aria-label', t[2] + '. Натисніть, щоб змінити');
      if (cur) document.documentElement.setAttribute('data-theme', cur); else document.documentElement.removeAttribute('data-theme');
      window.dispatchEvent(new Event('linal-theme'));
    }
    tbtn.addEventListener('click', function () {
      var i = THEMES.map(function (x) { return x[0]; }).indexOf(cur); cur = THEMES[(i + 1) % 3][0];
      try { if (cur) localStorage.setItem('linal-theme', cur); else localStorage.removeItem('linal-theme'); } catch (e) {}
      paint();
    });
    tw.appendChild(tbtn); paint(); setTop();
  }

  /* ---------- progress backup (home) ---------- */
  var bk = document.getElementById('backup');
  if (bk) {
    var out = document.getElementById('bk-code'), msgB = document.getElementById('bk-msg');
    function dump() {
      var o = {}; try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k.indexOf('linal-') === 0 && k !== 'linal-theme') o[k] = localStorage.getItem(k); } } catch (e) {}
      return o;
    }
    function enc(o) { return btoa(unescape(encodeURIComponent(JSON.stringify(o)))); }
    function dec(s) { return JSON.parse(decodeURIComponent(escape(atob(s.trim())))); }
    document.getElementById('bk-export').addEventListener('click', function () {
      var code = enc(dump()); out.value = code; out.select();
      var done2 = function () { msgB.textContent = 'Код скопійовано. Вставте його на іншому пристрої в це саме поле й натисніть «Відновити».'; };
      if (navigator.clipboard) navigator.clipboard.writeText(code).then(done2, function () { msgB.textContent = 'Скопіюйте код із поля вручну (Ctrl+C).'; });
      else msgB.textContent = 'Скопіюйте код із поля вручну (Ctrl+C).';
    });
    document.getElementById('bk-import').addEventListener('click', function () {
      try {
        var o = dec(out.value), n = 0;
        Object.keys(o).forEach(function (k) { if (k.indexOf('linal-') === 0) { localStorage.setItem(k, o[k]); n++; } });
        msgB.textContent = 'Прогрес відновлено. Оновлюю сторінку…'; setTimeout(function () { location.reload(); }, 900);
      } catch (e) { msgB.textContent = 'Не вдалося прочитати код. Перевірте, що вставили його повністю.'; }
    });
    var rs = document.getElementById('bk-reset'), armed = false;
    rs.addEventListener('click', function () {
      if (!armed) { armed = true; rs.textContent = 'Точно скинути? Натисніть ще раз'; msgB.textContent = 'Буде видалено позначки задач, бали контрольних і статистику тренажера.'; setTimeout(function () { armed = false; rs.textContent = 'Скинути прогрес'; }, 4000); return; }
      Object.keys(dump()).forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
      msgB.textContent = 'Прогрес скинуто.'; setTimeout(function () { location.reload(); }, 700);
    });
  }

  /* print button (cheatsheet) */
  $$('[data-act="print"]').forEach(function (b) { b.addEventListener('click', function () { window.print(); }); });
})();
