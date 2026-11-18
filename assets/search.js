/* Site-wide search: Ctrl+K or "/" opens a dialog over conspect, problems, mock tests and flashcards. */
(function () {
  'use strict';
  var tw = document.querySelector('.top .wrap'); if (!tw) return;
  var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'search-btn'; btn.id = 'search-btn';
  btn.innerHTML = '<span aria-hidden="true">⌕</span><span class="sl"> Пошук <kbd>Ctrl K</kbd></span>'; btn.setAttribute('aria-label', 'Пошук по сайту (Ctrl+K)');
  var theme = document.getElementById('theme-btn'); tw.insertBefore(btn, theme || null);

  var dlg = document.createElement('div'); dlg.className = 'sdlg'; dlg.hidden = true; dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true'); dlg.setAttribute('aria-label', 'Пошук по сайту');
  dlg.innerHTML = '<div class="sbox"><div class="shead"><input id="sq" type="search" placeholder="Наприклад: Крамер, обернена, поворот, det 4×4" autocomplete="off" aria-label="Запит">' +
    '<button type="button" class="sclose" aria-label="Закрити">Esc</button></div><div class="sfilt" role="group" aria-label="Де шукати"></div><div id="sres" class="sres" aria-live="polite"></div></div>';
  document.body.appendChild(dlg);
  var inp = dlg.querySelector('#sq'), res = dlg.querySelector('#sres'), filt = dlg.querySelector('.sfilt');
  var KINDS = [['all', 'Усе'], ['m', 'Конспект'], ['p', 'Задачі'], ['c', 'Картки'], ['t', 'Контрольні']], kind = 'all';
  filt.innerHTML = KINDS.map(function (k) { return '<button type="button" data-k="' + k[0] + '" aria-pressed="' + (k[0] === 'all') + '">' + k[1] + '</button>'; }).join('');
  filt.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return; kind = b.dataset.k;
    [].forEach.call(filt.children, function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); run();
  });

  var idx = null, loading = null, sel = 0, items = [];
  function norm(s) { return (s || '').toLowerCase().replace(/[’ʼ']/g, '\'').replace(/ё/g, 'е').replace(/\s+/g, ' '); }
  function text(el) { return (el.textContent || '').replace(/\s+/g, ' ').trim(); }
  function get(url) { return fetch(url, { cache: 'no-cache' }).then(function (r) { return r.ok ? r.text() : ''; }).then(function (h) { return new DOMParser().parseFromString(h.replace(/<br\s*\/?>/gi, ' · '), 'text/html'); }); }
  function build() {
    if (loading) return loading;
    var out = [];
    loading = Promise.all([get('material.html'), get('problems.html'), get('tests.html'), loadCards()]).then(function (d) {
      var m = d[0], p = d[1], t = d[2];
      /* conspect: one entry per h3 section with its following text */
      var cur = null, block = '';
      [].forEach.call(m.querySelectorAll('article > *'), function (el) {
        if (el.tagName === 'H2') { block = text(el); if (el.id) { cur = { k: 'm', title: block, sub: 'Конспект', url: 'material.html#' + el.id, body: '' }; out.push(cur); } return; }
        if (el.tagName === 'H3' && el.id) { cur = { k: 'm', title: text(el), sub: 'Конспект · ' + block, url: 'material.html#' + el.id, body: '' }; out.push(cur); return; }
        if (cur && !el.classList.contains('next')) cur.body += ' ' + text(el);
      });
      [].forEach.call(p.querySelectorAll('article.p'), function (a) {
        var q = a.querySelector(':scope > div:not(.ph)'), n = text(a.querySelector('.n'));
        var blk = a.closest('.problems') ? '' : '';
        out.push({ k: 'p', title: 'Задача ' + n, sub: 'Задачі · блок ' + n.split('.')[0], url: 'problems.html#' + a.id, body: q ? text(q) : '' , ans: text(a.querySelector('details > div') || {}) });
      });
      [].forEach.call(t.querySelectorAll('article.p'), function (a) {
        var q = a.querySelector(':scope > div:not(.ph)'), n = text(a.querySelector('.n'));
        out.push({ k: 't', title: n, sub: 'Пробна контрольна ' + n.charAt(1), url: 'tests.html#' + a.id, body: q ? text(q) : '' });
      });
      (window.CARDS || []).forEach(function (c) {
        var tmp = document.createElement('div'); tmp.innerHTML = c.q + ' — ' + c.a + ' ' + (c.e || '');
        out.push({ k: 'c', title: text((function () { var x = document.createElement('div'); x.innerHTML = c.q; return x; })()), sub: 'Картка · ' + ((window.CARD_TOPICS || {})[c.t] || ''), url: 'trainer.html#cards', body: text(tmp) });
      });
      out.forEach(function (o) { o.nt = norm(o.title); o.nb = norm(o.body + ' ' + (o.ans || '')); });
      idx = out; return out;
    }).catch(function () { idx = out; return out; });
    return loading;
  }
  function loadCards() {
    if (window.CARDS) return Promise.resolve();
    return new Promise(function (ok) { var s = document.createElement('script'); s.src = 'assets/cards.js?v=16'; s.onload = ok; s.onerror = ok; document.head.appendChild(s); });
  }
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function snippet(body, words) {
    var nb = norm(body), i = -1;
    words.forEach(function (w) { var j = nb.indexOf(w); if (j >= 0 && (i < 0 || j < i)) i = j; });
    var from = Math.max(0, i - 50), s = body.slice(from, from + 170);
    s = esc(s); words.forEach(function (w) { if (w.length > 1) s = s.replace(new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>'); });
    return (from > 0 ? '…' : '') + s + (body.length > from + 170 ? '…' : '');
  }
  var LABEL = { m: 'Конспект', p: 'Задача', c: 'Картка', t: 'Контрольна' };
  function run() {
    var q = norm(inp.value.trim());
    if (!q) { res.innerHTML = '<p class="mut">Почніть вводити запит. Пошук іде по конспекту, ' + (idx ? idx.filter(function (o) { return o.k === 'p'; }).length : 121) + ' задачах, контрольних і картках з теорії. ↑↓ — вибір, Enter — відкрити.</p>'; items = []; return; }
    if (!idx) { res.innerHTML = '<p class="mut">Завантажую індекс…</p>'; build().then(run); return; }
    var words = q.split(' ').filter(Boolean);
    items = idx.filter(function (o) { return (kind === 'all' || o.k === kind) && words.every(function (w) { return o.nt.indexOf(w) >= 0 || o.nb.indexOf(w) >= 0; }); })
      .map(function (o) { var s = 0; words.forEach(function (w) { if (o.nt.indexOf(w) >= 0) s += 3; if (o.nb.indexOf(w) >= 0) s += 1; }); if (o.k === 'm') s += .5; return { o: o, s: s }; })
      .sort(function (a, b) { return b.s - a.s; }).slice(0, 40).map(function (x) { return x.o; });
    sel = 0;
    if (!items.length) { res.innerHTML = '<p class="mut">Нічого не знайдено. Спробуйте інше слово або іншу форму слова (наприклад, «обернен» замість «оберненої»).</p>'; return; }
    res.innerHTML = '<p class="mut scount">Знайдено: ' + items.length + (items.length === 40 ? '+' : '') + '</p>' + items.map(function (o, i) {
      return '<a class="sitem' + (i === 0 ? ' on' : '') + '" href="' + o.url + '" data-i="' + i + '"><span class="skind k-' + o.k + '">' + LABEL[o.k] + '</span><b>' + esc(o.title) + '</b><span class="ssub">' + esc(o.sub) + '</span><span class="sbody">' + snippet(o.body, words) + '</span></a>';
    }).join('');
  }
  function move(d) {
    var as = res.querySelectorAll('.sitem'); if (!as.length) return;
    as[sel].classList.remove('on'); sel = (sel + d + as.length) % as.length; as[sel].classList.add('on'); as[sel].scrollIntoView({ block: 'nearest' });
  }
  var lastFocus = null;
  function open() { lastFocus = document.activeElement; dlg.hidden = false; document.body.classList.add('noscroll'); inp.focus(); inp.select(); build(); run(); }
  function close() { dlg.hidden = true; document.body.classList.remove('noscroll'); if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  btn.addEventListener('click', open);
  dlg.querySelector('.sclose').addEventListener('click', close);
  dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
  res.addEventListener('click', function (e) { var a = e.target.closest('a'); if (a) close(); });
  inp.addEventListener('input', run);
  inp.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Enter') { var a = res.querySelectorAll('.sitem')[sel]; if (a) { close(); location.href = a.getAttribute('href'); } }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !dlg.hidden) { close(); return; }
    var tag = (e.target.tagName || '').toLowerCase(), typing = tag === 'input' || tag === 'textarea' || tag === 'select';
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K' || e.key === 'л' || e.key === 'Л')) { e.preventDefault(); if (dlg.hidden) open(); else close(); }
    else if (e.key === '/' && !typing && dlg.hidden) { e.preventDefault(); open(); }
  });

  /* highlight the problem we arrived at by link */
  function hl() {
    var id = location.hash.slice(1); if (!id) return;
    var el = document.getElementById(id); if (!el || !el.classList.contains('p')) return;
    el.classList.add('flash-hl'); setTimeout(function () { el.classList.remove('flash-hl'); }, 2600);
  }
  window.addEventListener('hashchange', hl); hl();
})();
