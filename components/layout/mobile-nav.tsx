'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Home, Users, Heart, User } from 'lucide-react';

import { ROUTES } from '@/lib/constants';

const PROTECTED_ROUTES: Set<string> = new Set([ROUTES.FAVORITES, ROUTES.FAVORITES_CLIPS, ROUTES.SETTINGS]);

export function MobileNav() {
  const pathname = usePathname();
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';

  const navItems = [
    { href: ROUTES.HOME, icon: Home, label: 'ホーム' },
    { href: ROUTES.FAVORITES, icon: Users, label: '配信者' },
    { href: ROUTES.FAVORITES_CLIPS, icon: Heart, label: 'クリップ', isYellowHeart: true },
    { href: ROUTES.SETTINGS, icon: User, label: 'マイページ' },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#f2ede6] border-t border-[#e6e0d6]">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const isYellowHeart = 'isYellowHeart' in item && item.isYellowHeart;
          const href = !isAuthenticated && PROTECTED_ROUTES.has(item.href)
            ? ROUTES.LOGIN
            : item.href;

          return (
            <Link
              key={item.href}
              href={href}
              className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors ${
                isActive
                  ? isYellowHeart ? 'text-[#c4a850]' : 'text-[#6b655c]'
                  : 'text-[#b8b0a6] hover:text-[#8a8078]'
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
