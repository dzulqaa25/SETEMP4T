'use client';

export type DeviceNotifPermission = NotificationPermission | 'unsupported';

export interface DeviceNotificationPayload {
  title: string;
  body: string;
  tag?: string;
  url?: string;
}

export function isNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'Notification' in window;
}

export function getDeviceNotificationPermission(): DeviceNotifPermission {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function registerNotificationServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    return reg;
  } catch (err) {
    console.warn('Service worker registration failed:', err);
    return null;
  }
}

export async function requestDeviceNotificationPermission(): Promise<DeviceNotifPermission> {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    await registerNotificationServiceWorker();
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('Failed to request notification permission:', err);
    return Notification.permission;
  }
}

export async function sendDeviceNotification({
  title,
  body,
  tag,
  url = '/',
}: DeviceNotificationPayload): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  const uniqueTag = tag || `setemp4t-${Date.now()}`;

  try {
    if ('serviceWorker' in navigator) {
      const reg =
        (await navigator.serviceWorker.getRegistration('/sw.js')) ||
        (await registerNotificationServiceWorker());
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, {
          body,
          tag: uniqueTag,
          data: { url },
        });
        return true;
      }
    }
  } catch (e) {
    console.warn('SW showNotification fallback to Notification API:', e);
  }

  try {
    const n = new Notification(title, {
      body,
      tag: uniqueTag,
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
    return true;
  } catch (err) {
    console.warn('Native Notification error:', err);
    return false;
  }
}
