import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PennyTrail - Personal Expense Tracker',
    short_name: 'PennyTrail',
    description: 'Track daily expenses, analyse spending patterns, and manage budgets locally on your device.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#0a0f0d',
    theme_color: '#10b981',
    orientation: 'portrait',
    categories: ['finance', 'utilities', 'productivity'],
    prefer_related_applications: false,
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
