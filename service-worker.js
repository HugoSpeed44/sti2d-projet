const CACHE_NAME = 'stirobot-cache-v7';
const ASSETS = [
    './',
    './index.html',
    './controller.html',
    './assets/css/style.css',
    './assets/js/app.js',
    './assets/js/controller.js',
    './assets/images/logo.png',
    './assets/images/screenshot1.png',
    './manifest.json',
    './presentation/index.html',
    'https://unpkg.com/mqtt/dist/mqtt.min.js'
];

// Install Event
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate Event
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('Deleting old cache');
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// Fetch Event (Network First for better real-time support)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .catch(() => {
                return caches.match(event.request);
            })
    );
});
