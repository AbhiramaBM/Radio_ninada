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
  const userRole = user?.role || 'SUPER_ADMIN';
  const canAccess = {
    dashboard: true, // All admins can see dashboard
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
