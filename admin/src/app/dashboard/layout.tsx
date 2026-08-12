'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/layout/AdminSidebar';
import AdminHeader from '@/components/layout/AdminHeader';
import { useAuthStore } from '@/store/useAuthStore';

const STAFF_ROLES = ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'RJ', 'MODERATOR'];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isInitialized, initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const token = typeof window !== 'undefined' ? localStorage.getItem('ninada_access_token') : null;
  const userJson = typeof window !== 'undefined' ? localStorage.getItem('ninada_user') : null;
  let currentUser = user;
  if (!currentUser && userJson) {
    try {
      currentUser = JSON.parse(userJson);
    } catch (_) {}
  }

  const isAuthorized = Boolean(token && currentUser && STAFF_ROLES.includes(currentUser.role));

  useEffect(() => {
    if (isInitialized && !isAuthorized) {
      router.push('/login');
    }
  }, [isInitialized, isAuthorized, router]);

  if (!isInitialized || !isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-semibold tracking-wide">Authenticating Admin Session...</p>
      </div>
    );
  }

  const userRole = currentUser?.role || '';
  const canAccess = {
    dashboard: true,
    users: ['SUPER_ADMIN', 'ADMIN'].includes(userRole),
    programs: ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'RJ'].includes(userRole),
    podcasts: ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'RJ'].includes(userRole),
    events: ['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(userRole),
    news: ['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(userRole),
    rj: ['SUPER_ADMIN', 'ADMIN', 'RJ'].includes(userRole),
    schedule: ['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(userRole),
    notifications: ['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(userRole),
    gallery: ['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(userRole),
    banners: ['SUPER_ADMIN', 'ADMIN'].includes(userRole),
    sponsors: ['SUPER_ADMIN', 'ADMIN'].includes(userRole),
    analytics: ['SUPER_ADMIN', 'ADMIN'].includes(userRole),
    live: ['SUPER_ADMIN', 'ADMIN', 'RJ'].includes(userRole),
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar canAccess={canAccess} />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader />
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
