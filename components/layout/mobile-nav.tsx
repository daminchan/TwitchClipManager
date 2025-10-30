// 適用スキル: component-creator
// 適用ルール:
// - セクション4.6: コンポーネント構造
// - セクション5.3: レスポンシブデザイン

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Heart, ThumbsUp, User } from 'lucide-react';

export function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', icon: Home, label: 'ホーム' },
    { href: '#favorites', icon: Heart, label: 'お気に入り', onClick: true },
    { href: '/favorites-clips', icon: ThumbsUp, label: 'クリップ' },
    { href: '/settings', icon: User, label: 'マイページ' },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0f0f0f] border-t border-[#2a2a2a]">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          if (item.onClick) {
            return (
              <button
                key={item.href}
                onClick={() => {
                  const event = new CustomEvent('toggleFavorites');
                  window.dispatchEvent(event);
                }}
                className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors ${
                  isActive ? 'text-purple-500' : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors ${
                isActive ? 'text-purple-500' : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
