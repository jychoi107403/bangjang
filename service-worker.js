// ============================================================================
// 방장.net (Bangjang.net) 서비스 워커 (PWA 캐싱 및 오프라인 지원)
// ============================================================================

const CACHE_NAME = 'bangjang-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/js/supabase-config.js',
  '/js/notice-generator.js',
  '/js/splitter.js',
  '/js/bill-viewer.js',
  '/js/poll.js',
  '/js/games.js',
  '/js/sound-generator.js',
  '/js/study-room.js',
  '/js/classroom.js',
  '/assets/images/favicon.svg',
  '/assets/images/og-image.jpg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Supabase API 등 외부 네트워크 요청은 캐시 제외
  if (e.request.url.includes('supabase.co')) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((res) => {
      return res || fetch(e.request);
    })
  );
});
