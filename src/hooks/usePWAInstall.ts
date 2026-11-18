import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface Window {
    __deferredPWAInstallPrompt?: BeforeInstallPromptEvent | null;
  }
}

const PWA_INSTALLED_STORAGE_KEY = 'instamart_pwa_installed';

function checkStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: window-controls-overlay)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
    document.referrer.startsWith('android-app://')
  );
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    if (typeof window !== 'undefined' && window.__deferredPWAInstallPrompt) {
      return window.__deferredPWAInstallPrompt;
    }
    return null;
  });

  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    if (checkStandaloneMode()) return true;
    // If browser already fired beforeinstallprompt, app is not installed
    if (window.__deferredPWAInstallPrompt) return false;
    try {
      return localStorage.getItem(PWA_INSTALLED_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const standalone = checkStandaloneMode();
    if (standalone) {
      setIsInstalled(true);
    }

    // Check installed related apps API when supported (Chrome/Edge/Android)
    const nav = window.navigator as Navigator & {
      getInstalledRelatedApps?: () => Promise<Array<{ platform?: string; url?: string; id?: string }>>;
    };
    if (typeof nav.getInstalledRelatedApps === 'function') {
      nav.getInstalledRelatedApps()
        .then((apps) => {
          if (Array.isArray(apps) && apps.length > 0) {
            setIsInstalled(true);
            try {
              localStorage.setItem(PWA_INSTALLED_STORAGE_KEY, 'true');
            } catch {}
          }
        })
        .catch(() => {});
    }

    // Detect iOS devices (iPhone, iPad, iPod)
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
      setIsIOS(isIOSDevice);
    }

    if (typeof window !== 'undefined' && window.__deferredPWAInstallPrompt) {
      setDeferredPrompt(window.__deferredPWAInstallPrompt);
      if (!standalone) {
        setIsInstalled(false);
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.__deferredPWAInstallPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
      // Browser fired install prompt, so app is not currently installed
      try {
        localStorage.removeItem(PWA_INSTALLED_STORAGE_KEY);
      } catch {}
      if (!checkStandaloneMode()) {
        setIsInstalled(false);
      }
    };

    const handleCustomPromptReady = (e: Event) => {
      const customEvent = e as CustomEvent<BeforeInstallPromptEvent>;
      if (customEvent.detail) {
        setDeferredPrompt(customEvent.detail);
        try {
          localStorage.removeItem(PWA_INSTALLED_STORAGE_KEY);
        } catch {}
        if (!checkStandaloneMode()) {
          setIsInstalled(false);
        }
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      try {
        localStorage.setItem(PWA_INSTALLED_STORAGE_KEY, 'true');
      } catch {}
      if (typeof window !== 'undefined') {
        window.__deferredPWAInstallPrompt = null;
      }
    };

    const standaloneMedia = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-prompt-ready', handleCustomPromptReady);
    window.addEventListener('appinstalled', handleAppInstalled);
    standaloneMedia.addEventListener('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-prompt-ready', handleCustomPromptReady);
      window.removeEventListener('appinstalled', handleAppInstalled);
      standaloneMedia.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  const install = async (): Promise<boolean> => {
    const promptEvent = deferredPrompt || (typeof window !== 'undefined' ? window.__deferredPWAInstallPrompt : null);
    if (!promptEvent) return false;

    try {
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        try {
          localStorage.setItem(PWA_INSTALLED_STORAGE_KEY, 'true');
        } catch {}
        if (typeof window !== 'undefined') {
          window.__deferredPWAInstallPrompt = null;
        }
        return true;
      }
    } catch (err) {
      console.warn('PWA install prompt error:', err);
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt || (typeof window !== 'undefined' && !!window.__deferredPWAInstallPrompt),
    isInstalled,
    isIOS,
    install,
  };
}
