'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { User, Mail, Shield, KeyRound, Camera, LayoutDashboard, Check, Save, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';

export default function AdminProfilePage() {
  const { user, setAuth } = useAuthStore();

  const [form, setForm] = useState({
    name: user?.name || 'Radio Admin',
    email: user?.email || 'admin@radioninada.local',
    password: '',
    confirmPassword: '',
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (form.password && form.password !== form.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match. Please verify.' });
      return;
    }

    setSaving(true);
    try {
      let avatarUrl = user?.avatar;

      if (avatarFile) {
        const uploadData = new FormData();
        uploadData.append('file', avatarFile);
        const uploadRes = await api.post('/upload', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (uploadRes.data.success) {
          avatarUrl = `http://localhost:5000${uploadRes.data.data.url}`;
        }
      }

      const updatePayload: any = {
        name: form.name,
        email: form.email,
        avatar: avatarUrl,
      };

      if (form.password) {
        updatePayload.password = form.password;
      }

      const res = await api.put(`/users/${user?.id || 'me'}`, updatePayload);

      if (res.data.success) {
        const updatedUser = res.data.data || { ...user, ...updatePayload };
        const token = localStorage.getItem('ninada_access_token') || '';
        const refresh = localStorage.getItem('ninada_refresh_token') || '';
        setAuth(updatedUser, token, refresh);
        setMessage({ type: 'success', text: 'Admin profile updated successfully!' });
        setForm((prev) => ({ ...prev, password: '', confirmPassword: '' }));
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update profile settings.',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Banner & Quick Navigation */}
      <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">
            <Shield className="w-3.5 h-3.5" />
            <span>Executive Profile & System Authority</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Admin Profile Settings</h1>
          <p className="text-xs text-slate-400 mt-1">Manage your administrative credentials, security roles, and profile settings</p>
        </div>

        <Link
          href="/dashboard"
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-lg shadow-indigo-600/25 shrink-0"
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Go to Admin Dashboard</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center space-x-2 ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
          }`}
        >
          <Check className="w-4 h-4 shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Profile Overview Card */}
        <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col items-center text-center space-y-4 shadow-xl">
          <div className="relative group">
            <img
              src={avatarPreview || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
              alt={user?.name || 'Admin'}
              className="w-28 h-28 rounded-full object-cover border-2 border-indigo-500/50 shadow-lg"
            />
            <label className="absolute bottom-0 right-0 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full cursor-pointer shadow-md transition-all">
              <Camera className="w-4 h-4" />
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </label>
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">{user?.name || 'Radio Admin'}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{user?.email || 'admin@radioninada.local'}</p>
            <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5 mr-1.5" />
              <span>{user?.role || 'SUPER_ADMIN'}</span>
            </div>
          </div>

          {/* Quick System Links */}
          <div className="w-full pt-4 border-t border-border/60 space-y-2">
            <Link
              href="/dashboard"
              className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-border text-slate-200 text-xs font-semibold flex items-center justify-between transition-colors"
            >
              <div className="flex items-center space-x-2">
                <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                <span>Admin Dashboard</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>

            <Link
              href="/dashboard/notifications"
              className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-border text-slate-200 text-xs font-semibold flex items-center justify-between transition-colors"
            >
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-emerald-400" />
                <span>Notification Center</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>
        </div>

        {/* Right Form Card */}
        <div className="md:col-span-2 bg-surface border border-border rounded-2xl p-6 shadow-xl space-y-5">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <User className="w-4 h-4 text-indigo-400" />
            <span>Update Account Credentials</span>
          </h3>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full bg-slate-900 border border-border rounded-xl pl-11 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="w-full bg-slate-900 border border-border rounded-xl pl-11 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">New Password (Optional)</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border border-border rounded-xl pl-11 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm New Password</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border border-border rounded-xl pl-11 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <Link
                href="/dashboard"
                className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Back to Dashboard
              </Link>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center space-x-2 transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
