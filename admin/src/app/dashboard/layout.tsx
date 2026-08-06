'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/layout/AdminSidebar';
import AdminHeader from '@/components/layout/AdminHeader';
import { useAuthStore } from '@/store/useAuthStore';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('ninada_access_token') : null;
    const userJson = typeof window !== 'undefined' ? localStorage.getItem('ninada_user') : null;
    let currentUser = user;
    if (!currentUser && userJson) {
      try { currentUser = JSON.parse(userJson); } catch (_) {}
    }

    if (!token && !currentUser) {
      router.push('/login');
    }
  }, [router, user]);

  // Role-based access control for dashboard sections
  const canAccess = {
    dashboard: true, // All admins can see dashboard
    users: ['SUPER_ADMIN', 'ADMIN'].includes(user?.role || ''),
    programs: ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'RJ'].includes(user?.role || ''),
    podcasts: ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'RJ'].includes(user?.role || ''),
    events: ['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(user?.role || ''),
    news: ['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(user?.role || ''),
    rj: ['SUPER_ADMIN', 'ADMIN', 'RJ'].includes(user?.role || ''),
    schedule: ['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(user?.role || ''),
    notifications: ['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(user?.role || ''),
    gallery: ['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(user?.role || ''),
    banners: ['SUPER_ADMIN', 'ADMIN'].includes(user?.role || ''),
    sponsors: ['SUPER_ADMIN', 'ADMIN'].includes(user?.role || ''),
    analytics: ['SUPER_ADMIN', 'ADMIN'].includes(user?.role || ''),
    live: ['SUPER_ADMIN', 'ADMIN', 'RJ'].includes(user?.role || ''),
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
