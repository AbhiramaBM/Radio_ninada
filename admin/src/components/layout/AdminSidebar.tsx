'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Radio,
  RadioTower,
  Mic,
  Music,
  Calendar,
  Newspaper,
  UserCheck,
  CalendarDays,
  Image as ImageIcon,
  Users,
  BellRing,
  ImagePlus,
  Handshake,
  BarChart3,
  Bot,
  LogOut,
  ChevronRight,
  HardDrive,
  User,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Radio, accessKey: 'dashboard' },
  { name: 'Live Radio', href: '/dashboard/live', icon: RadioTower, badge: 'LIVE', accessKey: 'live' },
  { name: 'Programs', href: '/dashboard/programs', icon: Music, accessKey: 'programs' },
  { name: 'Podcasts & Sessions', href: '/dashboard/podcasts', icon: Mic, accessKey: 'podcasts' },
  { name: 'Weekly Schedule', href: '/dashboard/schedule', icon: Calendar, accessKey: 'schedule' },
  { name: 'News & Editorial', href: '/dashboard/news', icon: Newspaper, accessKey: 'news' },
  { name: 'RJs & Hosts', href: '/dashboard/rjs', icon: UserCheck, accessKey: 'rj' },
  { name: 'Events & Tickets', href: '/dashboard/events', icon: CalendarDays, accessKey: 'events' },
  { name: 'Media Gallery', href: '/dashboard/gallery', icon: ImageIcon, accessKey: 'gallery' },
  { name: 'Server Storage Dump', href: '/dashboard/media', icon: HardDrive },
  { name: 'User & Roles', href: '/dashboard/users', icon: Users, accessKey: 'users' },
  { name: 'Push Notifications', href: '/dashboard/notifications', icon: BellRing, accessKey: 'notifications' },
  { name: 'My Admin Profile', href: '/dashboard/profile', icon: User },
  { name: 'Banners', href: '/dashboard/banners', icon: ImagePlus, accessKey: 'banners' },
  { name: 'Sponsors', href: '/dashboard/sponsors', icon: Handshake, accessKey: 'sponsors' },
  { name: 'Analytics & Reports', href: '/dashboard/analytics', icon: BarChart3, accessKey: 'analytics' },
];

type AdminSidebarProps = {
  canAccess?: Record<string, boolean>;
};

export default function AdminSidebar({ canAccess = {} }: AdminSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  return (
    <aside className="w-64 bg-surface border-r border-border min-h-screen flex flex-col justify-between select-none">
      <div>
        {/* Brand Header */}
        <Link href="/dashboard" className="p-5 border-b border-border flex items-center justify-between hover:bg-slate-900/40 transition-colors block">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-pink-500 to-amber-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Radio className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white tracking-wide text-base leading-none">Radio Ninada</h1>
              <span className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase">Admin Portal</span>
            </div>
          </div>
        </Link>

        {/* Navigation List */}
        <nav className="p-3 space-y-1">
          {navigationItems.filter((item) => !item.accessKey || canAccess[item.accessKey] !== false).map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-rose-500 text-white animate-pulse">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-border bg-slate-900/40">
        <div className="flex items-center justify-between">
          <Link href="/dashboard/profile" className="flex items-center space-x-3 overflow-hidden group">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
              alt={user?.name || 'Admin'}
              className="w-9 h-9 rounded-full object-cover border border-indigo-500/40 group-hover:border-indigo-400 transition-all"
            />
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">{user?.name || 'Radio Admin'}</p>
              <span className="inline-block px-1.5 py-0.5 text-[9px] font-bold bg-indigo-500/20 text-indigo-300 rounded uppercase">
                {user?.role || 'SUPER_ADMIN'}
              </span>
            </div>
          </Link>

          <button
            onClick={logout}
            title="Logout"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
