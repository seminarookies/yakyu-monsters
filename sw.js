/* ============================================================
   sw.js — Service Worker
   オフラインでも画面が開くように、基本ファイルを保存しておく。
   ★ファイルを直したら CACHE の数字を1つ増やすと、
     スマホ側に新しいバージョンが届きます。
   ============================================================ */

const CACHE = 'baseball-monsters-v1';

const FILES = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './players.js',
  './monsters.js',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { return k === CACHE ? null : caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* まずネットから取りに行き、だめならキャッシュ（更新が届きやすい） */
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(function (res) {
      const copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(e.request, copy); }).catch(function () {});
      return res;
    }).catch(function () {
      return caches.match(e.request).then(function (hit) {
        return hit || caches.match('./index.html');
      });
    })
  );
});
