const CACHE_NAME = 'chatcoder-light-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/client.js',
    '/manifest.json',
    '/icon-72.png',
    '/icon-96.png',
    '/icon-128.png',
    '/icon-144.png',
    '/icon-152.png',
    '/icon-192.png',
    '/icon-384.png',
    '/icon-512.png',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Service Worker 설치
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('캐시 오픈됨');
                return cache.addAll(urlsToCache);
            })
    );
});

// 캐시된 리소스 제공
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // 캐시에서 찾으면 반환, 없으면 네트워크에서 가져오기
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});

// 푸시 알림 처리
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : '새 메시지가 도착했습니다!',
        icon: '/icon-192.png',
        badge: '/icon-72.png',
        tag: 'simple-chat-notification',
        requireInteraction: true
    };

    event.waitUntil(
        self.registration.showNotification('ChatCoder Light', options)
    );
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow('/')
    );
});