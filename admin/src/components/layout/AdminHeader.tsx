'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { RadioTower, Bell, Search, ExternalLink, LayoutDashboard, User, LogOut, Check, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

export default function AdminHeader() {
  const { user, logout } = useAuthStore();
  const [liveState, setLiveState] = useState<{ isLive: boolean; liveListeners: number; currentProgram: string } | null>(null);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchLive() {
      try {
        const res = await api.get('/live');
        if (res.data.success) {
          setLiveState(res.data.data);
        }
      } catch (err) {}
    }

    async function fetchNotifications() {
      try {
        const res = await api.get('/notifications');
        if (res.data.success) {
          const list = res.data.data || [];
          setNotifications(list);
          setUnreadCount(list.filter((n: any) => n.status === 'SENT' || !n.read).length);
        }
      } catch (err) {}
    }

    fetchLive();
    fetchNotifications();

    const interval = setInterval(() => {
      fetchLive();
      fetchNotifications();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-surface/80 backdrop-blur-md border-b border-border px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Global Search & Dashboard Quick Link */}
      <div className="flex items-center space-x-4">
        <Link
          href="/dashboard"
          className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/30 text-indigo-300 font-bold text-xs transition-all shadow-sm"
        >
          <LayoutDashboard className="w-4 h-4 text-indigo-400" />
          <span>Dashboard</span>
        </Link>

        <div className="relative w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search programs, podcasts, news..."
            className="w-full bg-slate-900/60 border border-border rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Right Header Status & Actions */}
      <div className="flex items-center space-x-4">
        {/* Live Broadcast Badge */}
        <div className="flex items-center space-x-2.5 bg-slate-900/60 border border-border px-3 py-1.5 rounded-full">
          <span className="relative flex h-2.5 w-2.5">
            {liveState?.isLive && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                liveState?.isLive ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            ></span>
          </span>

          <div className="text-xs">
            <span className="font-semibold text-slate-200">
              {liveState?.isLive ? 'ON AIR' : 'OFF AIR'}
            </span>
            {liveState?.isLive && (
              <span className="text-slate-400 ml-2 font-mono">
                {liveState.liveListeners} Listeners
              </span>
            )}
          </div>
        </div>

        {/* Notifications Bell Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="p-2 rounded-xl bg-slate-900/60 border border-border text-slate-300 hover:text-white hover:border-indigo-500/50 relative transition-all cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-surface border border-border rounded-2xl shadow-2xl p-4 space-y-3 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-xs font-bold text-white">System Notifications</span>
                <span className="text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded">
                  {notifications.length} Total
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">No notifications broadcasted yet.</p>
                ) : (
                  notifications.slice(0, 5).map((n) => (
                    <div key={n.id} className="p-2.5 rounded-xl bg-slate-900/80 border border-border/60 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white truncate">{n.title}</span>
                        <span className="text-[9px] text-indigo-400 font-mono">{n.status}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{n.message}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-border/60 flex justify-between items-center text-xs">
                <Link
                  href="/dashboard/notifications"
                  onClick={() => setNotifOpen(false)}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1"
                >
                  <span>View All Notifications</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar & Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center space-x-2.5 p-1 rounded-xl hover:bg-slate-800/60 transition-all cursor-pointer"
          >
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
              alt={user?.name || 'Admin'}
              className="w-8 h-8 rounded-full object-cover border border-indigo-500/40"
            />
            <div className="hidden md:block text-left text-xs">
              <p className="font-semibold text-white leading-tight">{user?.name || 'Radio Admin'}</p>
              <span className="text-[10px] text-slate-400">{user?.role || 'SUPER_ADMIN'}</span>
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-surface border border-border rounded-2xl shadow-2xl p-2 space-y-1 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="p-3 border-b border-border/60">
                <p className="text-xs font-bold text-white">{user?.name || 'Radio Admin'}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email || 'admin@radioninada.local'}</p>
              </div>

              <Link
                href="/dashboard"
                onClick={() => setProfileOpen(false)}
                className="flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-indigo-600/15 hover:text-indigo-300 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                <span>Admin Dashboard</span>
              </Link>

              <Link
                href="/dashboard/profile"
                onClick={() => setProfileOpen(false)}
                className="flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-indigo-600/15 hover:text-indigo-300 transition-colors"
              >
                <User className="w-4 h-4 text-emerald-400" />
                <span>My Admin Profile</span>
              </Link>

              <button
                onClick={() => {
                  setProfileOpen(false);
                  logout();
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>

        {/* Public Site Link */}
        <a
          href="http://localhost:5500/modern_fm_home.html"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          title="Open Public Listener Web App"
        >
          <span>Public Site</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </header>
  );
}
