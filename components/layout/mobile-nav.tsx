'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Heart, User } from 'lucide-react';

import { ROUTES } from '@/lib/constants';

export function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { href: ROUTES.HOME, icon: Home, label: 'ホーム' },
    { href: ROUTES.FAVORITES, icon: Users, label: '配信者' },
    { href: ROUTES.FAVORITES_CLIPS, icon: Heart, label: 'クリップ', isYellowHeart: true },
    { href: ROUTES.SETTINGS, icon: User, label: 'マイページ' },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0f0f0f] border-t border-[#2a2a2a]">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const isYellowHeart = 'isYellowHeart' in item && item.isYellowHeart;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors ${
                isActive
                  ? isYellowHeart ? 'text-yellow-400' : 'text-purple-500'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <Icon className={`w-6 h-6 ${isYellowHeart && isActive ? 'fill-current' : ''}`} />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
