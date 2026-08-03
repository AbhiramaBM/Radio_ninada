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
    const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

    if (!token) {
      router.push('/login');
      return;
    }

    if (!user || !isAdmin) {
      router.replace('/login');
    }
  }, [router, user]);

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader />
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
