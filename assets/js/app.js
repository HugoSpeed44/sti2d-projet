// Main App logic
document.addEventListener('DOMContentLoaded', () => {

    // Gestion de l'écran de démarrage
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) splash.classList.add('hidden');
    }, 2500);

    // Check connection with broker for status indicator
    const host = 'wss://sti-robot.cloud.shiftr.io';
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.getElementById('status-text');

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .then(reg => {
                console.log('SW Registered', reg);
                reg.onupdatefound = () => {
                    const installingWorker = reg.installing;
                    installingWorker.onstatechange = () => {
                        if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New content available, reload
                            window.location.reload();
                        }
                    };
                };
            })
            .catch(err => console.log('SW Error', err));
    }

    // Try a quick connection test for the landing page status
    const testClient = mqtt.connect(host, { 
        clientId: 'status_check_' + Math.random().toString(16).substr(2, 4),
        keepalive: 10,
        connectTimeout: 5000,
        username: 'sti-robot',
        password: 'AccesPersonnel44'
    });

    testClient.on('connect', () => {
        if (statusDot) statusDot.classList.add('online');
        if (statusText) statusText.innerText = "SYSTÈME EN LIGNE";
    });

    testClient.on('error', () => {
        if (statusDot) statusDot.classList.remove('online');
        if (statusText) statusText.innerText = "OFFLINE / ERREUR";
    });
});
