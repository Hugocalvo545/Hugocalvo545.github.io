/* intranet/service-worker.js */

// --- FCM (Push) ---
importScripts("https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDSYAhAuc0HTgoQBRK1ofwIqNTRdNtcegY",
  authDomain: "booking-viajeros.firebaseapp.com",
  projectId: "booking-viajeros",
  storageBucket: "booking-viajeros.firebasestorage.app",
  messagingSenderId: "42042931651",
  appId: "1:42042931651:web:50d6da6f4366d07ea7a576"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || "Nuevo mensaje";
  const body  = payload?.notification?.body  || "Tienes un mensaje pendiente.";

  self.registration.showNotification(title, {
    body,
    icon: "../img/Logo-JLA.jpg",
    data: payload?.data || {}
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow("./index.html#reservas")
  );
});

// --- Cache ---
const CACHE_NAME = "intranet-cache-v2"; // sube versión para forzar update

const ASSETS = [
  "./",
  "./index.html",
  "./app.js",
  "./manifest.json",
  // Tu intranet carga ../css/intranet.css, no ./styles.css:
  "../css/intranet.css"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((resp) => resp || fetch(event.request))
  );
});
