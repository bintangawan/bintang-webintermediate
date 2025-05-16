import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';
import { BASE_URL } from './config';

// Precache semua asset yang di-inject oleh webpack
const manifest = self.__WB_MANIFEST;
precacheAndRoute(manifest);

// Cache untuk Application Shell (komponen UI statis)
registerRoute(
  ({ request }) => 
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font',
  new StaleWhileRevalidate({
    cacheName: 'static-resources',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 hari
      }),
    ],
  })
);

// Cache untuk halaman
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'pages-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Cache untuk gambar
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 hari
      }),
    ],
  })
);

// Cache untuk MapTiler - Perbaikan untuk semua jenis request MapTiler
registerRoute(
  ({ url }) => url.hostname.includes('api.maptiler.com'),
  new CacheFirst({
    cacheName: 'maptiler-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 500, // Tambah jumlah entri untuk tile maps
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 hari
      }),
    ],
  })
);

// Cache untuk API - Gunakan StaleWhileRevalidate untuk API
registerRoute(
  ({ url }) => url.origin === BASE_URL.replace('/v1', ''),
  new StaleWhileRevalidate({
    cacheName: 'api-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 hari
      }),
    ],
  })
);

// Perbaikan untuk fetch event - Tangani semua request, tidak hanya navigasi
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Jika request ke API
  if (url.origin === BASE_URL.replace('/v1', '')) {
    // Gunakan strategi cache-first untuk GET requests
    if (request.method === 'GET') {
      event.respondWith(
        caches.open('api-cache').then((cache) => {
          return cache.match(request).then((cachedResponse) => {
            // Jika ada di cache, gunakan cache
            if (cachedResponse) {
              // Refresh cache di background
              fetch(request)
                .then((response) => {
                  if (response.ok) {
                    cache.put(request, response.clone());
                  }
                })
                .catch(() => {});
              return cachedResponse;
            }
            
            // Jika tidak ada di cache, coba fetch dari network
            return fetch(request)
              .then((response) => {
                if (response.ok) {
                  cache.put(request, response.clone());
                }
                return response;
              })
              .catch(() => {
                console.log('Offline mode untuk:', url.href);
                
                // Periksa jika ini adalah request detail story
                if (url.pathname.includes('/stories/') && !url.pathname.endsWith('/stories')) {
                  // Perbaikan: Pastikan response menampilkan pesan offline yang benar
                  return new Response(
                    JSON.stringify({ 
                      error: false, 
                      message: 'Anda sedang offline. Menampilkan data offline.',
                      story: {
                        id: 'offline-id',
                        name: 'Offline Mode',
                        description: 'Anda sedang offline. Silakan cek koneksi internet Anda untuk melihat detail cerita ini.',
                        photoUrl: '/images/icons/icon-192x192.png',
                        createdAt: new Date().toISOString(),
                        lat: null,
                        lon: null
                      }
                    }),
                    { 
                      headers: { 'Content-Type': 'application/json' },
                      status: 200
                    }
                  );
                }
                
                // Jika ini adalah request untuk daftar stories
                if (url.pathname.includes('/stories')) {
                  return new Response(
                    JSON.stringify({ 
                      error: false, 
                      message: 'Anda sedang offline. Menampilkan data dari cache.',
                      listStory: []
                    }),
                    { 
                      headers: { 'Content-Type': 'application/json' },
                      status: 200
                    }
                  );
                }
                
                // Untuk request API lainnya
                return new Response(
                  JSON.stringify({ 
                    error: false, 
                    message: 'Anda sedang offline. Silakan cek koneksi internet Anda.'
                  }),
                  { 
                    headers: { 'Content-Type': 'application/json' },
                    status: 200
                  }
                );
              });
          });
        })
      );
    } else if (request.method === 'POST') {
      // Untuk request POST (seperti menambahkan story)
      event.respondWith(
        fetch(request)
          .catch(() => {
            return new Response(
              JSON.stringify({ 
                error: true, // Ubah menjadi true agar tidak menampilkan pesan sukses
                message: 'Anda sedang offline. Tidak dapat menambahkan cerita saat ini.'
              }),
              { 
                headers: { 'Content-Type': 'application/json' },
                status: 503 // Service Unavailable
              }
            );
          })
      );
    }
  } 
  // Untuk request navigasi (halaman)
  else if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(request)
          .then((response) => {
            if (response) {
              return response;
            }
            // Jika tidak ada cache, gunakan halaman yang sudah di-cache
            return caches.match('/');
          });
      })
    );
  }
});

// Tambahkan event listener untuk message dari client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Tambahkan handler untuk memperbarui cache setelah menambahkan story
  if (event.data && event.data.type === 'REFRESH_HOME_CACHE') {
    // Bersihkan cache untuk halaman home
    caches.open('pages-cache').then((cache) => {
      cache.delete('/#/home');
      // Tambahkan kembali halaman home ke cache
      cache.add('/#/home');
    });
    
    // Bersihkan cache untuk API stories
    caches.open('api-cache').then((cache) => {
      cache.keys().then((keys) => {
        keys.forEach((request) => {
          if (request.url.includes('/stories') && !request.url.includes('/stories/')) {
            cache.delete(request);
          }
        });
      });
    });
  }
});

// Tambahkan event listener untuk aktivasi service worker
self.addEventListener('activate', (event) => {
  // Klaim klien sehingga service worker baru langsung mengambil alih
  event.waitUntil(clients.claim());
});

// Cache untuk MapTiler - Gunakan CacheFirst dengan konfigurasi yang lebih sederhana
registerRoute(
  ({ url }) => { 
    return url.origin.includes('maptiler'); 
  }, 
  new CacheFirst({ 
    cacheName: 'maptiler-api', 
  }), 
);