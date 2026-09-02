import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { AppHeader } from '@/components/layout/AppHeader';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { NetworkStatus } from '@/components/layout/NetworkStatus';
import { PwaRegister } from '@/components/layout/PwaRegister';
import { ToastContainer } from '@/components/ui/Toast';

export const metadata: Metadata = {
  title: 'PennyTrail • Personal Expense Tracker',
  description: 'Track your daily expenses, analyse spending patterns, and manage budgets — all stored locally on your device.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/logo.png', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PennyTrail',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-[var(--background)] text-[var(--foreground)] antialiased min-h-screen flex flex-col transition-colors duration-200">
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <PwaRegister />
              <NetworkStatus />
              <AppHeader />
              <div className="flex flex-1 max-w-7xl w-full mx-auto">
                <DesktopSidebar />
                <main className="flex-1 w-full p-4 sm:p-6 pb-28 lg:pb-8 overflow-x-hidden min-h-[calc(100vh-4rem)]">
                  {children}
                </main>
              </div>
              <MobileBottomNav />
              <ToastContainer />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
