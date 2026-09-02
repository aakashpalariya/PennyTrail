'use client';

import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export function NetworkStatus() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    setIsOffline(!navigator.onLine);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-16 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
      <div className="flex items-center gap-2 bg-amber-500 text-white text-xs font-medium px-4 py-2 rounded-full shadow-lg">
        <WifiOff size={13} />
        You&apos;re offline — data is saved locally
      </div>
    </div>
  );
}
