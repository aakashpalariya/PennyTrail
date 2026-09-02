import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in">
      <span className="text-6xl mb-4">🔍</span>
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">Page not found</h1>
      <p className="text-neutral-500 dark:text-neutral-400 mb-6 text-sm">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link href="/dashboard">
        <Button size="md">Back to Dashboard</Button>
      </Link>
    </div>
  );
}

