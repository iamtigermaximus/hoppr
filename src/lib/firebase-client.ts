/**
 * Firebase client SDK — fully optional.
 *
 * Firebase is only loaded at runtime via dynamic import(). If the package
 * isn't installed or the env vars aren't set, every function returns null
 * or a no-op — the app continues working without push notifications.
 *
 * Requirements (to enable push):
 *   npm install firebase
 *   Set NEXT_PUBLIC_FIREBASE_* env vars
 */

let firebaseApp: unknown = null;
let firebaseMessaging: unknown = null;

function hasConfig(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  );
}

async function loadFirebase(): Promise<boolean> {
  if (firebaseApp) return true;
  if (!hasConfig()) return false;

  try {
    const { initializeApp } = await import("firebase/app");
    firebaseApp = initializeApp({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    });
    return true;
  } catch (err) {
    console.warn("[Push] firebase package not installed — push notifications unavailable");
    return false;
  }
}

async function loadMessaging(): Promise<unknown | null> {
  if (firebaseMessaging) return firebaseMessaging;
  if (typeof window === "undefined") return null;

  const ok = await loadFirebase();
  if (!ok) return null;

  try {
    const { getMessaging } = await import("firebase/messaging");
    firebaseMessaging = getMessaging(firebaseApp as import("firebase/app").FirebaseApp);
    return firebaseMessaging;
  } catch (err) {
    console.warn("[Push] firebase/messaging unavailable");
    return null;
  }
}

let swRegistration: ServiceWorkerRegistration | null = null;

async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (swRegistration) return swRegistration;
  if (!("serviceWorker" in navigator)) return null;

  try {
    swRegistration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    console.log("[Push] Service worker registered:", swRegistration.scope);
    return swRegistration;
  } catch (err) {
    console.warn("[Push] Service worker registration failed:", err);
    return null;
  }
}

/**
 * Request notification permission and get FCM token.
 * Returns the token if successful, null otherwise.
 */
export async function requestNotificationPermission(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (!("Notification" in window)) return null;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const messaging = await loadMessaging();
  if (!messaging) return null;

  // Register the service worker — required before getToken can work
  const sw = await registerServiceWorker();
  if (!sw) {
    console.warn("[Push] Service worker not available — cannot get FCM token");
    return null;
  }

  try {
    const { getToken } = await import("firebase/messaging");
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    const token = await getToken(messaging as import("firebase/messaging").Messaging, {
      vapidKey: vapidKey || undefined,
      serviceWorkerRegistration: sw,
    });
    return token;
  } catch (err) {
    console.warn("[Push] Failed to get FCM token:", err);
    return null;
  }
}

/**
 * Listen for foreground messages (when the app is open).
 */
export function onForegroundMessage(
  callback: (payload: {
    title?: string;
    body?: string;
    deepLink?: string;
    contentId?: string;
  }) => void,
): () => void {
  let cancelled = false;

  loadMessaging().then((messaging) => {
    if (!messaging || cancelled) return;
    import("firebase/messaging")
      .then(({ onMessage }) => {
        if (cancelled) return;
        onMessage(messaging as import("firebase/messaging").Messaging, (payload) => {
          const p = payload as { notification?: { title?: string; body?: string }; data?: { deepLink?: string; contentId?: string } };
          const notification = p.notification;
          const data = p.data;
          callback({
            title: notification?.title,
            body: notification?.body,
            deepLink: data?.deepLink,
            contentId: data?.contentId,
          });
        });
      })
      .catch(() => {});
  }).catch(() => {});

  return () => {
    cancelled = true;
  };
}

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator
  );
}
