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
        p.classList.toggle('done', cb.checked); save(KEY_P, done); upd();
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
    upd();
    var bs = $$('.filt button');
    bs.forEach(function (b) {
      b.addEventListener('click', function () {
        var f = b.dataset.f;
        bs.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        ps.forEach(function (p) { p.classList.toggle('hidden-lv', f !== '0' && p.dataset.l !== f); });
      });
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

  /* print button (cheatsheet) */
  $$('[data-act="print"]').forEach(function (b) { b.addEventListener('click', function () { window.print(); }); });
})();
