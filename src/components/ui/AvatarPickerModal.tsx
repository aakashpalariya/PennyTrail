'use client';

import React, { useState } from 'react';
import { Modal } from './Modal';
import { CARTOON_AVATARS } from './Avatar';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvatarPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar?: string;
  onSelect: (avatar: string) => void;
  onRemove?: () => void;
}

type TabType = 'All' | 'Men' | 'Women' | 'Cool' | 'Bots';

export function AvatarPickerModal({
  isOpen,
  onClose,
  currentAvatar,
  onSelect,
  onRemove,
}: AvatarPickerModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('All');

  const filteredCartoons = activeTab === 'All'
    ? CARTOON_AVATARS
    : activeTab === 'Bots'
    ? CARTOON_AVATARS.filter(c => c.category === 'Fun')
    : CARTOON_AVATARS.filter(c => c.category === activeTab);

  const handleSelectAvatar = (url: string) => {
    onSelect(url);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Choose Avatar" size="md">
      <div className="flex flex-col gap-3">
        {/* Categories Tab Navigation */}
        <div className="flex gap-1.5 p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 overflow-x-auto no-scrollbar">
          {(['All', 'Men', 'Women', 'Cool', 'Bots'] as TabType[]).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer',
                activeTab === tab
                  ? 'bg-white dark:bg-neutral-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Full Scrollable Avatars Grid */}
        <div className="max-h-[60vh] sm:max-h-80 overflow-y-auto pr-1 pb-1 pt-1">
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5 justify-items-center">
            {filteredCartoons.map(item => {
              const isChosen = currentAvatar === item.url;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectAvatar(item.url)}
                  className={cn(
                    'group relative flex flex-col items-center gap-1.5 p-2 rounded-2xl border transition-all cursor-pointer w-full active:scale-95',
                    isChosen
                      ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/60 ring-2 ring-emerald-400 shadow-sm'
                      : 'border-neutral-200/70 dark:border-neutral-800 hover:border-emerald-400 dark:hover:border-emerald-600 bg-white/70 dark:bg-neutral-900/70'
                  )}
                >
                  <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 shadow-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.url} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <span className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 truncate w-full text-center">
                    {item.name}
                  </span>
                  {isChosen && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                      <Check size={10} strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Remove / Clear option */}
        {currentAvatar && onRemove && (
          <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-800 flex justify-between items-center">
            <span className="text-xs text-neutral-400">Use default initial letter instead:</span>
            <button
              type="button"
              onClick={() => {
                onRemove();
                onClose();
              }}
              className="text-xs font-bold text-red-500 hover:text-red-600 dark:text-red-400 hover:underline px-3 py-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
            >
              Remove Avatar
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
