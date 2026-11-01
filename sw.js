// 앱 껍데기를 기기에 저장해 두어 인터넷이 끊겨도 열리게 한다
const CACHE = 'berith-v11';
const SHELL = ['./', 'index.html', 'css/app.css', 'js/app.js', 'manifest.webmanifest', 'images/icon-192.png', 'images/berith-logo.png', 'images/seam-vision-center.jpg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (u.origin !== location.origin) return;
  // 늘 인터넷에서 새것을 먼저 받고(고친 화면이 바로 보이도록), 끊겼을 때만 저장된 것을 쓴다
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; })
    .catch(() => caches.match(e.request)));
});
