"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  isPushSupported,
  requestNotificationPermission,
  onForegroundMessage,
} from "@/lib/firebase-client";

// ---- Types ----

interface PushContextValue {
  /** Whether the browser supports push notifications */
  supported: boolean;
  /** Whether the user has granted notification permission */
  permission: NotificationPermission | "unsupported";
  /** The FCM device token (only set after permission is granted + registered) */
  fcmToken: string | null;
  /** Request permission and register the device */
  requestPermission: () => Promise<boolean>;
  /** Unregister the device (revoke permission) */
  unregister: () => Promise<void>;
  /** Whether we're actively working on permissions */
  loading: boolean;
}

const PushContext = createContext<PushContextValue>({
  supported: false,
  permission: "unsupported",
  fcmToken: null,
  requestPermission: async () => false,
  unregister: async () => {},
  loading: false,
});

// ---- Provider ----

export function PushNotificationProvider({ children }: { children: ReactNode }) {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    "unsupported",
  );
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Check support on mount
  useEffect(() => {
    setSupported(isPushSupported());
    if (isPushSupported() && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Listen for foreground messages
  useEffect(() => {
    if (!fcmToken) return;

    const unsubscribe = onForegroundMessage((payload) => {
      // Show an in-app toast or banner when a notification arrives
      // while the user has the app open
      if (payload.title && payload.body) {
        // For now, log to console. In production, this would show
        // an in-app notification banner or update a badge count.
        console.log("[Push] Foreground message:", payload.title, payload.body);

        // If the notification has a deepLink, we could show
        // a toast with a "View" button that navigates there.
      }
    });

    return unsubscribe;
  }, [fcmToken]);

  // Register FCM token with our backend
  const registerToken = useCallback(async (token: string) => {
    try {
      const res = await fetch("/api/notifications/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fcmToken: token,
          platform: getPlatform(),
          deviceName: getDeviceName(),
          locale: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      if (res.ok) {
        setFcmToken(token);
      } else {
        console.error("[Push] Failed to register token with backend");
      }
    } catch (err) {
      console.error("[Push] Token registration error:", err);
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!supported) return false;
    setLoading(true);
    try {
      const token = await requestNotificationPermission();
      if (token) {
        setPermission("granted");
        await registerToken(token);
        return true;
      }
      setPermission("denied");
      return false;
    } catch {
      setPermission("denied");
      return false;
    } finally {
      setLoading(false);
    }
  }, [supported, registerToken]);


  const unregister = useCallback(async () => {
    if (fcmToken) {
      try {
        await fetch("/api/notifications/devices", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fcmToken }),
        });
      } catch (err) {
        console.error("[Push] Token unregister error:", err);
      }
      setFcmToken(null);
    }
    setPermission("denied");
  }, [fcmToken]);

  return (
    <PushContext.Provider
      value={{
        supported,
        permission,
        fcmToken,
        requestPermission,
        unregister,
        loading,
      }}
    >
      {children}
    </PushContext.Provider>
  );
}

// ---- Hook ----

export function usePushNotifications() {
  return useContext(PushContext);
}

// ---- Helpers ----

function getPlatform(): string {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "web";
}

function getDeviceName(): string | null {
  // Basic device detection — in production, use a UA parser library
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Android/.test(ua)) return "Android Device";
  if (/Macintosh/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows PC";
  return null;
}
