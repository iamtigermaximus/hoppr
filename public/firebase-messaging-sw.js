/**
 * Firebase Cloud Messaging Service Worker
 *
 * This runs in the background and handles push notifications when the
 * browser is closed or the app is in a background tab.
 *
 * It must be placed in the public/ directory so it's served from the root:
 *   https://hoppr.fi/firebase-messaging-sw.js
 *
 * Firebase config values are injected at build time via env vars.
 * The firebase-app.js and firebase-messaging.js scripts must be available
 * (either from node_modules served statically, or from a CDN).
 */

// Import Firebase scripts from CDN (service workers can't use module imports)
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

// Firebase config — populated at build time from env vars
// These values are PUBLIC (they're visible in the browser)
const firebaseConfig = {
  apiKey: "AIzaSyD9ManAMOJowmG0YfwR3Ezll17K0DNp2T0",
  authDomain: "hoppr-business.firebaseapp.com",
  projectId: "hoppr-business",
  storageBucket: "hoppr-business.firebasestorage.app",
  messagingSenderId: "1018602858827",
  appId: "1:1018602858827:web:d43c08663d8c3aa7fda0ce",
  measurementId: "G-D12W7K7RC7",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || "Hoppr";
  const notificationOptions = {
    body: payload.notification?.body || "",
    icon: "/apple-touch-icon.png",
    badge: "/favicon.ico",
    image: payload.notification?.image || payload.data?.imageUrl,
    data: {
      deepLink: payload.data?.deepLink || "/",
      contentId: payload.data?.contentId || "",
      contentBarId: payload.data?.contentBarId || "",
      fcmMessageId: payload.messageId || "",
    },
    // Actions for the notification (Android only)
    actions: [
      {
        action: "open",
        title: "Open",
      },
      {
        action: "dismiss",
        title: "Dismiss",
      },
    ],
    // Required for showing the notification while the browser is closed
    requireInteraction: false,
    // Vibrate pattern (Android): wait 300ms, vibrate 200ms, wait 100ms, vibrate 200ms
    vibrate: [300, 200, 100, 200],
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const deepLink = data.deepLink;
  const fcmMessageId = data.fcmMessageId;

  // Mark as opened on the backend
  if (fcmMessageId) {
    fetch("/api/notifications/mark-opened", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fcmMessageId }),
    }).catch(function () {
      // Silently fail — analytics tracking is non-critical
    });
  }

  // Open the app and navigate to the deep link
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then(function (clientList) {
      // If there's already an open window, focus it and navigate
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.navigate && client.url.includes(self.location.origin)) {
          var url = deepLink
            ? self.location.origin + deepLink
            : self.location.origin;
          return client.navigate(url).then(function () { return client.focus(); });
        }
        // Fallback: try to focus any existing window
        if ("focus" in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window
      var url = deepLink
        ? self.location.origin + deepLink
        : self.location.origin;
      return self.clients.openWindow(url);
    }),
  );
});
