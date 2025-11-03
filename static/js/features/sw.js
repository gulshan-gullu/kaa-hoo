// ==========================================
// ðŸ“± CA360 SERVICE WORKER v4.2
// Offline Support â€¢ Push Notifications â€¢ Background Sync
// ==========================================

const CACHE_NAME = 'ca360-v4.2';
const STATIC_CACHE = 'ca360-static-v4.2';
const DYNAMIC_CACHE = 'ca360-dynamic-v4.2';

// Files to cache immediately
const STATIC_FILES = [
    '/',
    '/static/css/style.css',
    '/static/js/app.js',
    '/static/js/features/mobile-optimizer.js',
    '/static/js/features/audio-processor.js',
    '/static/js/features/video-processor.js',
    '/static/js/features/calling.js',
    '/static/icons/icon-192x192.png',
    '/static/icons/icon-512x512.png'
];

// Install event
self.addEventListener('install', (event) => {
    console.log('[SW] Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[SW] Caching static files');
                return cache.addAll(STATIC_FILES).catch(err => {
                    console.warn('[SW] Some files failed to cache:', err);
                });
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cache) => {
                        if (cache !== STATIC_CACHE && cache !== DYNAMIC_CACHE) {
                            console.log('[SW] Deleting old cache:', cache);
                            return caches.delete(cache);
                        }
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event
self.addEventListener('fetch', (event) => {
    const { request } = event;
    
    // Skip non-GET requests
    if (request.method !== 'GET') return;
    
    // Skip WebSocket connections
    if (request.url.includes('socket.io')) return;
    
    // Skip API calls
    if (request.url.includes('/api/')) return;
    
    event.respondWith(
        caches.match(request)
            .then((response) => {
                if (response) {
                    return response;
                }
                
                return fetch(request)
                    .then((networkResponse) => {
                        // Cache dynamic content
                        if (request.url.includes('/static/')) {
                            return caches.open(DYNAMIC_CACHE)
                                .then((cache) => {
                                    cache.put(request, networkResponse.clone());
                                    return networkResponse;
                                });
                        }
                        
                        return networkResponse;
                    })
                    .catch(() => {
                        // Offline fallback
                        return new Response('Offline', {
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
            })
    );
});

// Push notification
self.addEventListener('push', (event) => {
    console.log('[SW] Push notification received');
    
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'CA360 Chat';
    const options = {
        body: data.body || 'New message',
        icon: '/static/icons/icon-192x192.png',
        badge: '/static/icons/icon-96x96.png',
        vibrate: [200, 100, 200],
        tag: 'ca360-notification',
        requireInteraction: true,
        data: data
    };
    
    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked');
    
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow('/')
    );
});

console.log('[SW] Service Worker loaded - v4.2');

