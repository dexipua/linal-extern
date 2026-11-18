/* Offline support: pages are network-first (so updates show up), assets are cache-first with background refresh. */
var CACHE = 'linal-v18';
var PAGES = ['./', 'index.html', 'material.html', 'problems.html', 'trainer.html', 'lab.html', 'tests.html', 'cheatsheet.html'];
var ASSETS = ['style.css', 'app.js', 'search.js', 'frac.js', 'trainer.js', 'cards.js', 'lab.js'].map(function (f) { return 'assets/' + f + '?v=18'; })
  .concat(['assets/icons/icon-192.png', 'assets/icons/icon-512.png', 'manifest.webmanifest']);

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(PAGES.concat(ASSETS)); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k.indexOf('linal-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request; if (req.method !== 'GET') return;
  var url = new URL(req.url);
  var isPage = req.mode === 'navigate' || (url.origin === location.origin && /\.html$|\/$/.test(url.pathname));
  if (isPage) {
    e.respondWith(fetch(req).then(function (res) {
      var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); return res;
    }).catch(function () {
      return caches.match(req, { ignoreSearch: true }).then(function (r) { return r || caches.match('index.html'); });
    }));
    return;
  }
  var cacheable = url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!cacheable) return;
  e.respondWith(caches.match(req).then(function (hit) {
    var net = fetch(req).then(function (res) {
      if (res && (res.ok || res.type === 'opaque')) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
      return res;
    }).catch(function () { return hit; });
    return hit || net;
  }));
});
