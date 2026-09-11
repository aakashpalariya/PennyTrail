'use client';

import React, { useEffect, useState } from 'react';
import { Download, Share, Plus, X } from 'lucide-react';
import { usePwaInstall } from './usePwaInstall';

export function PwaInstallBanner() {
  const { isIos, isAndroid, isDesktop, showBanner, promptInstall, canInstall } = usePwaInstall();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Slight delay so the banner slides in smoothly after page loads
  useEffect(() => {
    if (showBanner && !dismissed) {
      const t = setTimeout(() => setVisible(true), 400);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [showBanner, dismissed]);

  if (!showBanner || dismissed) return null;

  const handleInstall = async () => {
    if (canInstall) {
      await promptInstall();
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => {
      setDismissed(true);
    }, 300);
  };

  return (
    <div
      role="banner"
      aria-label="Install PennyTrail app"
      className={`
        w-full px-4 py-3.5 rounded-3xl block lg:hidden
        bg-emerald-600 dark:bg-emerald-700
        border border-emerald-500/60 dark:border-emerald-600/60
        shadow-lg shadow-emerald-900/15 dark:shadow-emerald-950/30
        transition-all duration-300 ease-in-out overflow-hidden
        ${visible ? 'max-h-48 opacity-100 scale-100' : 'max-h-0 opacity-0 scale-98 pointer-events-none'}
      `}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left: App Icon + Device-specific Content */}
        <div className="flex items-center gap-3 min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icon-192.png"
            alt="PennyTrail"
            className="w-10 h-10 rounded-2xl shrink-0 shadow-md bg-white p-1 object-contain"
          />
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-bold text-white leading-tight">
              {isIos ? 'Add PennyTrail to Home Screen' : 'Install PennyTrail App'}
            </p>

            {/* iOS device guidance */}
            {isIos && (
              <p className="text-[11px] sm:text-xs text-emerald-100 leading-tight mt-1 flex items-center gap-1 flex-wrap">
                Tap
                <span className="inline-flex items-center gap-0.5 font-bold text-white bg-emerald-700/70 px-1.5 py-0.5 rounded">
                  <Share className="w-3 h-3 shrink-0" />
                  Share
                </span>
                then
                <span className="inline-flex items-center gap-0.5 font-bold text-white bg-emerald-700/70 px-1.5 py-0.5 rounded">
                  <Plus className="w-3 h-3 shrink-0" />
                  Add to Home Screen
                </span>
              </p>
            )}

            {/* Android device guidance */}
            {!isIos && (
              <p className="text-[11px] sm:text-xs text-emerald-100 leading-tight mt-0.5">
                Install as a mobile app for quick offline expense tracking
              </p>
            )}
          </div>
        </div>

        {/* Right: Actions (Install button + Dismiss X button) */}
        <div className="flex items-center gap-2 shrink-0">
          {!isIos && canInstall && (
            <button
              onClick={handleInstall}
              type="button"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-emerald-700 hover:bg-emerald-50 active:scale-95 text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>Install</span>
            </button>
          )}

          {/* Dismiss (X) button — dismisses for current session, reappears on page refresh */}
          <button
            onClick={handleDismiss}
            type="button"
            aria-label="Dismiss banner"
            title="Dismiss"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-emerald-100 hover:text-white hover:bg-emerald-700/70 dark:hover:bg-emerald-800/70 active:scale-95 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
