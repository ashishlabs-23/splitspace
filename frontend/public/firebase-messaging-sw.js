// Firebase Cloud Messaging Background Service Worker for SplitSpace
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAp5X5cnBnLikZYIRMMIekFqoXAORLU6go",
  authDomain: "splitspace-9d28f.firebaseapp.com",
  projectId: "splitspace-9d28f",
  storageBucket: "splitspace-9d28f.firebasestorage.app",
  messagingSenderId: "396055786543",
  appId: "1:396055786543:web:44032626227dff983602da"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background push message:', payload);
  const notificationTitle = payload.notification?.title || 'SplitSpace Alert';
  const notificationOptions = {
    body: payload.notification?.body || 'New financial activity in your SplitSpace.',
    icon: '/icon.png',
    badge: '/icon.svg',
    tag: payload.data?.tag || 'splitspace-alert',
    data: payload.data || {},
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
