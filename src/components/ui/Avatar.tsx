'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface CartoonAvatar {
  id: string;
  name: string;
  category: 'Men' | 'Women' | 'Cool' | 'Fun';
  url: string;
}

export const CARTOON_AVATARS: CartoonAvatar[] = [
  // Men & Boys
  { id: 'm-lucas', name: 'Lucas', category: 'Men', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Lucas&backgroundColor=b6e3f4' },
  { id: 'm-oliver', name: 'Oliver', category: 'Men', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Oliver&backgroundColor=ffd5dc' },
  { id: 'm-ethan', name: 'Ethan', category: 'Men', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Ethan&backgroundColor=d1d4f9' },
  { id: 'm-noah', name: 'Noah', category: 'Men', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Noah&backgroundColor=c0aede' },
  { id: 'm-leo', name: 'Leo', category: 'Men', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Leo&backgroundColor=ffdfbf' },
  { id: 'm-alex', name: 'Alex', category: 'Men', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Alex&backgroundColor=b6e3f4' },
  { id: 'm-sam', name: 'Sam', category: 'Men', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Sam&backgroundColor=ffd5dc' },
  { id: 'm-felix', name: 'Felix', category: 'Men', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Felix&backgroundColor=d1d4f9' },
  { id: 'm-liam', name: 'Liam', category: 'Men', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Liam&backgroundColor=ffdfbf' },
  { id: 'm-max', name: 'Max', category: 'Men', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Max&backgroundColor=c0aede' },
  
  // Women & Girls
  { id: 'w-sophia', name: 'Sophia', category: 'Women', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Sophia&backgroundColor=ffd5dc' },
  { id: 'w-emma', name: 'Emma', category: 'Women', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Emma&backgroundColor=b6e3f4' },
  { id: 'w-mia', name: 'Mia', category: 'Women', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Mia&backgroundColor=c0aede' },
  { id: 'w-ava', name: 'Ava', category: 'Women', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Ava&backgroundColor=d1d4f9' },
  { id: 'w-zoe', name: 'Zoe', category: 'Women', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Zoe&backgroundColor=ffdfbf' },
  { id: 'w-chloe', name: 'Chloe', category: 'Women', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Chloe&backgroundColor=ffd5dc' },
  { id: 'w-ruby', name: 'Ruby', category: 'Women', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Ruby&backgroundColor=b6e3f4' },
  { id: 'w-elena', name: 'Elena', category: 'Women', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Elena&backgroundColor=c0aede' },
  { id: 'w-luna', name: 'Luna', category: 'Women', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Luna&backgroundColor=d1d4f9' },
  { id: 'w-maya', name: 'Maya', category: 'Women', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Maya&backgroundColor=ffdfbf' },

  // Cool & OpenPeeps
  { id: 'c-pro', name: 'Financier', category: 'Cool', url: 'https://api.dicebear.com/9.x/open-peeps/svg?seed=Financier&backgroundColor=b6e3f4' },
  { id: 'c-investor', name: 'Investor', category: 'Cool', url: 'https://api.dicebear.com/9.x/open-peeps/svg?seed=Investor&backgroundColor=c0aede' },
  { id: 'c-saver', name: 'Smart Saver', category: 'Cool', url: 'https://api.dicebear.com/9.x/open-peeps/svg?seed=Saver&backgroundColor=ffd5dc' },
  { id: 'c-dev', name: 'Technologist', category: 'Cool', url: 'https://api.dicebear.com/9.x/open-peeps/svg?seed=Tech&backgroundColor=d1d4f9' },

  // Fun & Bots
  { id: 'f-bot1', name: 'Penny Bot', category: 'Fun', url: 'https://api.dicebear.com/9.x/bottts/svg?seed=Penny&backgroundColor=b6e3f4' },
  { id: 'f-bot2', name: 'Trail Bot', category: 'Fun', url: 'https://api.dicebear.com/9.x/bottts/svg?seed=Trail&backgroundColor=ffd5dc' },
  { id: 'f-bot3', name: 'Crypto Bot', category: 'Fun', url: 'https://api.dicebear.com/9.x/bottts/svg?seed=Crypto&backgroundColor=c0aede' },
  { id: 'f-bot4', name: 'Budget Bot', category: 'Fun', url: 'https://api.dicebear.com/9.x/bottts/svg?seed=Budget&backgroundColor=d1d4f9' },
];

export const EMOJI_AVATARS = [
  '💰','🪙','💵','💳','🤑','🐱','🐶','🦊','🐻','🦋','🌟','🎯','🔥','🍀','⚡','🎸','👑','🚀','💎','🏆'
];

interface AvatarProps {
  avatar?: string; // either URL, emoji, or name fallback
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

const SIZE_CLASSES = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-20 h-20 text-2xl',
};

export function Avatar({ avatar, name = 'User', size = 'md', className }: AvatarProps) {
  const isUrl = avatar?.startsWith('http') || avatar?.startsWith('/');
  const isEmoji = avatar && !isUrl && avatar.length <= 4;

  if (isUrl) {
    return (
      <div className={cn('relative rounded-2xl overflow-hidden shrink-0 aspect-square shadow-sm border border-neutral-200/60 dark:border-neutral-700/60 bg-neutral-100 dark:bg-neutral-800', SIZE_CLASSES[size], className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatar}
          alt={name}
          className="w-full h-full object-cover select-none block aspect-square"
          loading="lazy"
          crossOrigin="anonymous"
        />
      </div>
    );
  }

  if (isEmoji) {
    return (
      <div className={cn('rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/60 dark:to-teal-950/60 border border-emerald-300/60 dark:border-emerald-700/60 flex items-center justify-center shrink-0 aspect-square shadow-sm select-none', SIZE_CLASSES[size], className)}>
        <span>{avatar}</span>
      </div>
    );
  }

  // Initials fallback
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase() ?? '')
    .join('') || '?';

  return (
    <div className={cn('rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold flex items-center justify-center shrink-0 aspect-square shadow-sm select-none', SIZE_CLASSES[size], className)}>
      {initials}
    </div>
  );
}
