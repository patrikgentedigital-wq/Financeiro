interface NavigatorStandalone extends Navigator {
  standalone?: boolean;
}

interface WindowWithPWA extends Window {
  MSStream?: unknown;
}

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

export function initPWAInstallListener() {
  if (typeof window === 'undefined') return;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    notifyListeners();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notifyListeners();
  });
}

export function subscribePWAStatus(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

export function isPWAInstallable(): boolean {
  return Boolean(deferredPrompt);
}

export async function promptPWAInstall(): Promise<boolean> {
  if (!deferredPrompt) return false;
  try {
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    deferredPrompt = null;
    notifyListeners();
    return choice.outcome === 'accepted';
  } catch (e) {
    return false;
  }
}

export function isStandalonePWA(): boolean {
  if (typeof window === 'undefined') return false;
  const isDisplayStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isNavStandalone = (navigator as NavigatorStandalone).standalone === true;
  return isDisplayStandalone || isNavStandalone;
}

export function isIOSSafari(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as WindowWithPWA).MSStream;
  const isWebkit = /WebKit/i.test(ua);
  const isSafari = /Safari/i.test(ua) && !/CriOS/i.test(ua) && !/FxiOS/i.test(ua);

  return isIOS && isWebkit && isSafari && !isStandalonePWA();
}
