'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Radio, KeyRound, Mail, AlertCircle, ShieldCheck, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

const devAccounts = [
  { role: 'Super Admin', email: 'admin@radioninada.local', pass: 'Admin@123', bg: 'from-purple-600 to-indigo-600' },
  { role: 'Editor', email: 'editor@radioninada.local', pass: 'Editor@123', bg: 'from-blue-600 to-cyan-600' },
  { role: 'RJ Host', email: 'rj@radioninada.local', pass: 'RJ@123', bg: 'from-emerald-600 to-teal-600' },
  { role: 'Moderator', email: 'mod@radioninada.local', pass: 'Mod@123', bg: 'from-amber-600 to-orange-600' },
];

export default function LoginPage() {
  const router = useRouter();
  const { user, setAuth } = useAuthStore();

  const [email, setEmail] = useState('admin@radioninada.local');
  const [password, setPassword] = useState('Admin@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        const { user, accessToken, refreshToken } = res.data.data;
        const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

        if (!isAdmin) {
          setError('Access denied. Only administrators can use the admin portal.');
          return;
        }

        setAuth(user, accessToken, refreshToken);
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to authenticate. Please check credentials.');
    } finally {
      setLoading(false);
    }
  }

  function fillDevAccount(accEmail: string, accPass: string) {
    setEmail(accEmail);
    setPassword(accPass);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Background Glow */}
      <div className="absolute w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-8 shadow-2xl space-y-6">
        {/* Header Logo */}
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-pink-500 to-amber-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4">
            <Radio className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wide">Radio Ninada</h2>
          <p className="text-xs text-slate-400 mt-1">Admin Dashboard Portal & Executive Suite</p>
        </div>

        {user && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between shadow-sm">
            <div>
              <p className="font-semibold text-white">Active Session Detected</p>
              <p className="text-[11px] text-emerald-400">Logged in as {user.name} ({user.role})</p>
            </div>
            <Link
              href="/dashboard"
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1 transition-all shadow-md"
            >
              <span>Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-900 border border-border rounded-lg pl-11 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="admin@radioninada.local"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-900 border border-border rounded-lg pl-11 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold py-2.5 rounded-lg text-sm transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center space-x-2 cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Sign In to Dashboard</span>
              </>
            )}
          </button>

          <div className="pt-2 text-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center space-x-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-all hover:underline"
            >
              <span>Direct Link to Admin Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </form>

        {/* Quick Dev Login Buttons */}
        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3 text-center">
            Development Quick Login Credentials
          </p>
          <div className="grid grid-cols-2 gap-2">
            {devAccounts.map((acc) => (
              <button
                key={acc.role}
                onClick={() => fillDevAccount(acc.email, acc.pass)}
                className="text-left p-2.5 rounded-lg bg-slate-900 border border-border hover:border-indigo-500/50 transition-all group"
              >
                <div className="flex items-center space-x-2">
                  <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${acc.bg}`} />
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-white">{acc.role}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate">{acc.email}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
