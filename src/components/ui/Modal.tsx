'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showClose?: boolean;
}

export function Modal({ isOpen, onClose, title, children, size = 'md', showClose = true }: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!isOpen || !mounted) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };

  const modalElement = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Box */}
      <div
        className={cn(
          'relative w-full rounded-3xl shadow-2xl z-10 my-auto flex flex-col overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 max-h-[90vh]',
          sizeClasses[size]
        )}
      >
        {/* Modal Header */}
        {(title || showClose) && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800/80 shrink-0 bg-neutral-50/60 dark:bg-neutral-900/60">
            {title && (
              <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100">
                {title}
              </h2>
            )}
            {showClose && (
              <button
                type="button"
                onClick={onClose}
                className="ml-auto p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto max-h-[calc(90vh-4.5rem)]">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalElement, document.body);
}
