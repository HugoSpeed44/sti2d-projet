// --- CONFIGURATION ---
const host = 'wss://sti-robot.cloud.shiftr.io'; 
const options = { 
    username: 'sti-robot', 
    password: 'AccesPersonnel44', 
    clientId: 'mobile_station_' + Math.random().toString(16).substr(2, 4),
    keepalive: 60
};

const TOPICS = {
    avancer: "avancer", reculer: "reculer", gauche: "gauche", droite: "droite",
    lumiere: "lumiere", demarrage: "demarrage",
    servo1: "topicServo", servo2: "topicServo2",
    gps: "gps", temp: "temperatureC"
};

let etats = { demarrage: false, lumiere: false };
let s1_pos = 90; let s2_pos = 90;
let intervals = {};
let activeActions = new Set();

const client = mqtt.connect(host, options);

// --- UI ELEMENTS ---
const statusDot = document.querySelector('.status-dot');
const statusText = document.getElementById('status-text');

// Gestion de l'écran de démarrage
setTimeout(() => {
    const splash = document.getElementById('splash-screen');
    if (splash) splash.classList.add('hidden');
}, 2500);

// Tentative de verrouillage de l'orientation en paysage (PWA)
if (screen.orientation && screen.orientation.lock) {
    screen.orientation.lock('landscape').catch(err => {
        console.log("Le verrouillage d'orientation n'est pas supporté ou nécessite le plein écran", err);
    });
}

// Vérification manuelle de l'orientation en JS (en plus du CSS)
window.addEventListener("orientationchange", function() {
    console.log("Orientation changée : " + screen.orientation.type);
});

// --- CONNECTION EVENTS ---
client.on('connect', () => {
    console.log("Connecté au broker !");
    if (statusDot) statusDot.classList.add('online');
    if (statusText) statusText.innerText = "SYSTÈME CONNECTÉ";
    
    client.subscribe(TOPICS.gps);
    client.subscribe(TOPICS.temp);
});

client.on('offline', () => {
    if (statusDot) statusDot.classList.remove('online');
    if (statusText) statusText.innerText = "DÉCONNECTÉ";
});

// --- DATA RECEPTION ---
client.on('message', (topic, message) => {
    const rawData = message.toString();
    try {
        if (topic === TOPICS.gps) {
            const gps = JSON.parse(rawData);
            if (gps.vitesse !== undefined) document.getElementById('vitesse').innerText = `${gps.vitesse.toFixed(1)} km/h`;
            if (gps.sats !== undefined) document.getElementById('sats').innerText = gps.sats;
        }
        if (topic === TOPICS.temp) {
            document.getElementById('temp').innerText = parseFloat(rawData).toFixed(1);
        }
    } catch (e) {
        console.error("Data error:", e);
    }
});

// --- CONTROL LOGIC ---
function startAction(key) {
    if (activeActions.has(key)) return;
    activeActions.add(key);

    const btn = document.querySelector(`[data-key="${key}"]`);
    if (btn) btn.classList.add('active');

    // Motor Logic
    const motorMap = { 'z': 'avancer', 's': 'reculer', 'q': 'gauche', 'd': 'droite' };
    if (motorMap[key]) {
        client.publish(TOPICS[motorMap[key]], "1");
    }

    // Servo Logic
    const servoMap = {
        'ArrowLeft':  { axis: 's1', dir: -5 },
        'ArrowRight': { axis: 's1', dir: 5 },
        'ArrowUp':    { axis: 's2', dir: 5 },
        'ArrowDown':  { axis: 's2', dir: -5 }
    };

    if (servoMap[key]) {
        intervals[key] = setInterval(() => {
            const cmd = servoMap[key];
            if (cmd.axis === 's1') s1_pos = Math.min(180, Math.max(0, s1_pos + cmd.dir));
            if (cmd.axis === 's2') s2_pos = Math.min(180, Math.max(0, s2_pos + cmd.dir));
            client.publish(TOPICS.servo1, String(s1_pos));
            client.publish(TOPICS.servo2, String(s2_pos));
        }, 50);
    }
}

function stopAction(key) {
    if (!activeActions.has(key)) return;
    activeActions.delete(key);

    const btn = document.querySelector(`[data-key="${key}"]`);
    if (btn) btn.classList.remove('active');

    const motorMap = { 'z': 'avancer', 's': 'reculer', 'q': 'gauche', 'd': 'droite' };
    if (motorMap[key]) {
        client.publish(TOPICS[motorMap[key]], "0");
    }

    if (intervals[key]) {
        clearInterval(intervals[key]);
        delete intervals[key];
    }
}

// --- EVENT LISTENERS ---
document.querySelectorAll('.dir-btn').forEach(btn => {
    const key = btn.getAttribute('data-key');
    
    // Touch Events
    btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startAction(key);
    }, { passive: false });

    btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        stopAction(key);
    }, { passive: false });

    // Mouse Events for testing
    btn.addEventListener('mousedown', () => startAction(key));
    btn.addEventListener('mouseup', () => stopAction(key));
    btn.addEventListener('mouseleave', () => stopAction(key));
});

// Toggle Buttons
document.getElementById('btn-lumiere').addEventListener('click', function() {
    etats.lumiere = !etats.lumiere;
    const msg = etats.lumiere ? "on" : "off";
    client.publish(TOPICS.lumiere, msg);
    this.classList.toggle('active', etats.lumiere);
    this.innerText = etats.lumiere ? "💡 LUMIÈRE: ON" : "💡 LUMIÈRE: OFF";
});

document.getElementById('btn-demarrage').addEventListener('click', function() {
    etats.demarrage = !etats.demarrage;
    const msg = etats.demarrage ? "1" : "0";
    client.publish(TOPICS.demarrage, msg);
    this.classList.toggle('active', etats.demarrage);
    this.innerText = etats.demarrage ? "🔌 CONNECTÉ" : "🔌 DÉMARRÉ";
});

// Keyboard Support
window.addEventListener('keydown', (e) => startAction(e.key));
window.addEventListener('keyup', (e) => stopAction(e.key));
