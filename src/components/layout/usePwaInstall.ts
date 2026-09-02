'use client';

import { useEffect, useState, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

export type DeviceType = 'ios' | 'android' | 'desktop';

function isIosDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  const isIosUa = /iphone|ipad|ipod/.test(ua);
  const isIpadOs =
    typeof navigator !== 'undefined' &&
    navigator.platform === 'MacIntel' &&
    navigator.maxTouchPoints > 1;
  return isIosUa || isIpadOs;
}

function isAndroidDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return /android/.test(ua);
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari uses navigator.standalone
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export interface UsePwaInstallReturn {
  deviceType: DeviceType;
  /** True on iOS (iPhone / iPad) */
  isIos: boolean;
  /** True on Android devices */
  isAndroid: boolean;
  /** True on Desktop (Windows, macOS, Linux, ChromeOS) */
  isDesktop: boolean;
  /** True when the native install prompt is available */
  canInstall: boolean;
  /** Whether the banner should be visible based on device type and install state */
  showBanner: boolean;
  /** Trigger the native browser install dialog */
  promptInstall: () => Promise<void>;
}

export function usePwaInstall(): UsePwaInstallReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState<boolean>(false);
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');
  const [isIos, setIsIos] = useState<boolean>(false);
  const [isAndroid, setIsAndroid] = useState<boolean>(false);
  const [isDesktop, setIsDesktop] = useState<boolean>(true);
  const [isReady, setIsReady] = useState<boolean>(false);

  // Detect device type on client mount
  useEffect(() => {
    const ios = isIosDevice();
    const android = isAndroidDevice();
    const desktop = !ios && !android;

    setIsIos(ios);
    setIsAndroid(android);
    setIsDesktop(desktop);
    setDeviceType(ios ? 'ios' : android ? 'android' : 'desktop');
    setIsReady(true);
  }, []);

  // Detect if already running as installed PWA in standalone mode
  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      return;
    }
    const mq = window.matchMedia('(display-mode: standalone)');
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) setInstalled(true);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Capture browser install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Listen for the OS reporting a successful install
  useEffect(() => {
    const handler = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', handler);
    return () => window.removeEventListener('appinstalled', handler);
  }, []);

  const promptInstall = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstalled(true);
      }
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const canInstall = !!deferredPrompt;

  // Visibility logic based on device type:
  // - iOS: Visible until bookmarked / added to home screen (standalone mode)
  // - Android / Desktop: Visible until installed when the install prompt is available
  const showBanner = isReady && !installed && (isIos || canInstall);

  return {
    deviceType,
    isIos,
    isAndroid,
    isDesktop,
    canInstall,
    showBanner,
    promptInstall,
  };
}
